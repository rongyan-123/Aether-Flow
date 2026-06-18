// 新手说明：这是一个后端的 API 路由（POST），负责处理玩家发来的动作请求。
// 简单流程（小白版）：
// 1. 接收请求，校验 playerId 和 API Key。
// 2. 加载玩家数据（如果没有就创建新档并注入世界观记忆）。
// 3. 执行检索（RAG）→ 调用 LLM（带 tools）→ 执行 tools（如改背包/写图鉴）→ 回写并流式返回文本。
// 你不用一次看懂每一行，先关注这些高层步骤，后面遇到具体功能再逐步深入。
import { prisma } from "@/lib/db";
// InputJsonValue removed in Prisma 7 — use PrismaClient native JSON handling
import type { ICharacterStats, IInventoryItem, Situation, Foreshadowing } from "@/types";
import { setLLMConfig } from "@/lib/game/nodes";
import { injectWorldview, listVectors, storeVector } from "@/lib/vector-store";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { buildDirectorPrompt, CRITIQUE_PROMPT } from "@/lib/game/prompts";
import { gameTools, setConversationId, findToolByName } from "@/lib/game/tools";
import { searchVectors } from "@/lib/vector-store";
import {
  maybeSummarize,
  getAllSummaries,
  getRecentMessages,
  setSummaryLLMConfig,
} from "@/lib/game/summarizer";

let _llmConfig = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  modelName: "gpt-4o-mini",
};

export async function POST(req: Request) {
  // 小白提示：整个函数很长，这是一个 "处理一轮玩家输入并生成回应" 的流程器。
  // 如果你迷糊，先看上面几行（参数解析、player 加载/创建、注入世界观），
  // 再按注释的 STEP 标记逐段读理解。
  const { input, playerId, mode, llmConfig, playerName } = await req.json();
  if (!playerId)
    return new Response(JSON.stringify({ error: "Missing playerId" }), {
      status: 400,
    });
  if (llmConfig && llmConfig.apiKey) {
    _llmConfig = {
      apiKey: llmConfig.apiKey,
      baseUrl: llmConfig.baseUrl || "https://api.openai.com/v1",
      modelName: llmConfig.modelId || llmConfig.customModel || "gpt-4o-mini",
    };
    setLLMConfig(_llmConfig);
    setSummaryLLMConfig(_llmConfig);
  } else {
    return new Response(JSON.stringify({ error: "API Key" }), { status: 400 });
  }

  let player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    player = await prisma.player.create({
      data: {
        id: playerId,
        status: "ALIVE",
        name: playerName || "wu",
        gender: "m",
        stats: {
          hp: { current: 100, max: 100, status_desc: "良好" },
          mp: { current: 50, max: 50, status_desc: "充沛" },
          spirit: { value: 100, desc: "精神饱满" },
          realm: "练气期一层",
          age: { current: 16, max: 100 },
          race: "人族",
          alignment: "中立",
          sect: "散修",
          spiritual_root: "五行杂灵根",
          mental_state: "心如止水",
          reputation: 0,
          state_of_mind: 50,
          fortune: 10,
          karma: 0,
        } as any,
        inventory: [] as any,
        relationships: {} as any,
        codex: [] as any,
      },
    });
    await injectWorldview(playerId);
  }
  const ev = await listVectors(playerId);
  if (ev.length === 0) await injectWorldview(playerId);
  if (input)
    await prisma.chatMessage.create({
      data: { role: "user", content: input, playerId },
    });

  // 加载局面与伏笔数据
  const situations: Situation[] = (player as any).situations || [];
  const foreshadowings: Foreshadowing[] = (player as any).foreshadowings || [];

  // 格式化局面上下文
  const activeSituations = situations.filter((s: Situation) => s.status !== 'ended');
  let situationContext = '';
  if (activeSituations.length > 0) {
    const statusLabel: Record<string, string> = { brewing: '发酵中', climax: '高潮', resolution: '收束中', ended: '已结束' };
    situationContext = '【当前活跃局面】\n' + activeSituations.map((s: Situation) =>
      `- [${s.type}] ${s.title} (${statusLabel[s.status] || s.status}, 第${s.startTurn}回合起)\n` +
      `  触发: ${s.trigger}\n` +
      `  参与NPC: ${s.npcs.join(', ') || '无'}\n` +
      `  可能结局: ${s.possible_outcomes.join(' | ')}`
    ).join('\n');
  } else {
    situationContext = '【当前活跃局面】无。如果当前场景有值得发展的冲突或事件，请调用Update_Situation(action="create")创建第一个局面。';
  }

  // 格式化伏笔上下文
  const unresolvedForeshadowing = foreshadowings.filter((f: Foreshadowing) => !f.resolved);
  let foreshadowingContext = '';
  if (unresolvedForeshadowing.length > 0) {
    foreshadowingContext = '【未回收伏笔】\n' + unresolvedForeshadowing.map((f: Foreshadowing) =>
      `- [${f.id}] ${f.title} (第${f.plantedTurn}回合埋下): ${f.description}`
    ).join('\n');
  } else {
    foreshadowingContext = '【未回收伏笔】暂无。可在合适时机调用Create_Foreshadowing埋下新伏笔。';
  }

  // 检查是否需要自动总结（每20轮触发一次）
  try {
    await maybeSummarize(playerId);
  } catch {}

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (ev: string, data: string) => {
        ctrl.enqueue(enc.encode("event: " + ev + "\ndata: " + data + "\n\n"));
      };
      try {
        setConversationId(playerId);
        const isPrep = mode === "prepare";
        const userInput = isPrep
          ? input + "\n\nPlayer Stats: " + JSON.stringify(player.stats)
          : input;

        // ===== STEP 1: RAG Retrieval =====
        send(
          "step",
          JSON.stringify({
            label: "正在检索天道记忆——搜索修仙界的古老传说...",
          }),
        );
        const query = userInput;
        let ragContext = "";
        try {
          const results = await searchVectors(playerId, query, 5);
          ragContext = results
            .map((r: { content: string }) => r.content)
            .join("\n");
          send(
            "step",
            JSON.stringify({
              label: "天道印记共鸣，检索到 " + results.length + " 段相关记忆",
            }),
          );
        } catch {
          ragContext =
            "修仙界常言：练气期修士寿元百年。当前地点：青云山脉外围。";
          send(
            "step",
            JSON.stringify({ label: "天道记忆模糊，以凡间常识替代..." }),
          );
        }

        // ===== STEP 2: First LLM Call (with tools, non-streaming) =====
        send(
          "step",
          JSON.stringify({ label: "天机推演中——正在参悟命运因果之线..." }),
        );

        // 加载历史摘要 + 上次总结后的最近消息
        const summaries = await getAllSummaries(playerId);
        const recentMessages = await getRecentMessages(playerId);
        const chatHistory = recentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        // 把摘要注入RAG上下文供AI参考
        const fullRagContext =
          (ragContext || "") +
          (summaries ? "\n\n【历史摘要】\n" + summaries : "");

        const promptInput = {
          playerName: player.name || "无名修士",
          playerStats: JSON.stringify(player.stats, null, 2),
          inventory: JSON.stringify(player.inventory, null, 2),
          ragContext: fullRagContext,
          chat_history: chatHistory as any[],
          input: userInput,
          situation_context: situationContext,
          foreshadowing_context: foreshadowingContext,
        };

        const llmWithTools = new ChatOpenAI({
          modelName: _llmConfig.modelName,
          apiKey: _llmConfig.apiKey,
          configuration: { baseURL: _llmConfig.baseUrl },
          temperature: 0.7,
        }).bindTools(gameTools);

        const chain = buildDirectorPrompt(player.name || "无名修士").pipe(llmWithTools);
        const llmResult = await chain.invoke(promptInput);
        const toolCalls = (llmResult as any).tool_calls || [];
        const narrativeText = (llmResult.content as string) || "";

        // ===== STEP 3: Execute Tool Calls =====
        if (toolCalls.length > 0) {
          send(
            "step",
            JSON.stringify({
              label: "命运已定——执行 " + toolCalls.length + " 项天道指令...",
            }),
          );
          for (const tc of toolCalls) {
            const tool = findToolByName(tc.name);
            if (tool) {
              send("step", JSON.stringify({ label: "▸ " + tc.name }));
              try {
                await tool.invoke(tc.args);
              } catch (e) {
                console.error(e);
              }
            }
          }
        }

        // ===== STEP 4: Streaming Follow-up (if no narrative from first call) =====
        let finalReply = narrativeText;
        if (!finalReply.trim() && toolCalls.length > 0) {
          send(
            "step",
            JSON.stringify({ label: "正在编织命运长卷——为您书写修仙传奇..." }),
          );

          const toolSummary = toolCalls
            .map((tc: any) => tc.name + ": " + JSON.stringify(tc.args))
            .join("\n");
          const followUpMessages = [
            {
              role: "system",
              content:
                "玩家: " +
                promptInput.playerName +
                "\n\n" +
                promptInput.playerStats +
                "\n\n背包:\n" +
                promptInput.inventory +
                "\n\nRAG:\n" +
                promptInput.ragContext,
            },
            { role: "user", content: promptInput.input },
            {
              role: "assistant",
              content: "[Internal] executed tools:\n" + toolSummary,
            },
            {
              role: "user",
              content:
                "Based on the above, generate a vivid xianxia narration. Direct text output only, no tools. 500+ chars, each sentence on its own line. Every line MUST start with 2 full-width spaces（每行开头空两格）. Use " + (player.name || "无名修士") + " as protagonist name.",
            },
          ];

          const streamingLLM = new ChatOpenAI({
            modelName: _llmConfig.modelName,
            apiKey: _llmConfig.apiKey,
            configuration: { baseURL: _llmConfig.baseUrl },
            temperature: 0.7,
            streaming: true,
          });

          const streamResult = await streamingLLM.stream(
            followUpMessages as any,
          );
          const chunks: string[] = [];
          for await (const chunk of streamResult) {
            const text = (chunk.content as string) || "";
            if (text) {
              chunks.push(text);
              send("text-delta", JSON.stringify({ content: text }));
            }
          }
          finalReply = chunks.join("");
          if (!finalReply.trim())
            finalReply = "天道沉默...命运之线模糊不清，请稍后再试。";
        }

        // ===== STEP 4.5: Logic Critique (挑刺层) =====
        if (finalReply.trim() && userInput) {
          try {
            send(
              "step",
              JSON.stringify({ label: "天道审视中——正在校验命运逻辑..." }),
            );
            const critiqueLLM = new ChatOpenAI({
              modelName: _llmConfig.modelName,
              apiKey: _llmConfig.apiKey,
              configuration: { baseURL: _llmConfig.baseUrl },
              temperature: 0.1,
            });
            const critiqueResult = await critiqueLLM.invoke([
              { role: "system", content: CRITIQUE_PROMPT },
              {
                role: "user",
                content: `Player input: ${userInput}\n\nPrevious context: ${chatHistory
                  .slice(-6)
                  .map((m: any) => m.role + ": " + m.content)
                  .join(
                    "\n",
                  )}\n\nAI response to review:\n${finalReply}\n\nTool calls: ${JSON.stringify(
                  toolCalls.map((tc: any) => tc.name),
                )}`,
              },
            ]);
            const critiqueText = (critiqueResult.content as string) || "";
            if (
              critiqueText.includes("ISSUES") &&
              !critiqueText.includes("PASS")
            ) {
              // 发现逻辑问题，让AI修复
              send(
                "step",
                JSON.stringify({ label: "天道察觉命运矛盾——正在修正因果..." }),
              );
              const fixLLM = new ChatOpenAI({
                modelName: _llmConfig.modelName,
                apiKey: _llmConfig.apiKey,
                configuration: { baseURL: _llmConfig.baseUrl },
                temperature: 0.5,
              });
              const fixResult = await fixLLM.invoke([
                {
                  role: "system",
                  content:
                    "你是一个修仙小说作者。你的上一段回复有逻辑问题需要修正。请重新写一段回复，修正以下问题，但保留相同的场景和工具调用。直接输出修正后的叙述文本，不要解释。每行开头空两格（两个全角空格）。" +
                    "\n\n修正原则：NPC行为必须有合理动机，反派要有深度而非无脑恶人。正式场合的冲突通过冷言冷语、态度轻蔑、社交排挤来体现，而非公开抢劫或肢体冲突。反应要符合修仙世界逻辑（如五行杂灵根很常见，不应引起戏剧性震惊）。",
                },
                {
                  role: "user",
                  content: `原始回复:\n${finalReply}\n\n发现的问题:\n${critiqueText}\n\n玩家输入: ${userInput}\n\n请输出修正后的完整回复（500+字）：`,
                },
              ]);
              const fixedText = (fixResult.content as string) || "";
              if (fixedText.trim()) {
                finalReply = fixedText;
                send(
                  "step",
                  JSON.stringify({ label: "命运已修正——因果归于正轨" }),
                );
              }
            }
          } catch (e) {
            console.error("[Critique] Failed:", e);
          }
        }

        // ===== STEP 5: Rule Engine (process tool calls → update stats/inventory/codex) =====
        send(
          "step",
          JSON.stringify({ label: "因果结算中——天道规则正在校准..." }),
        );
        const ruleResult = processRuleEngine(
          toolCalls,
          player.stats as unknown as ICharacterStats,
          player.inventory as unknown as IInventoryItem[],
          (player.codex || []) as any[],
          (player.relationships || {}) as any,
          situations,
          foreshadowings,
        );

        // ===== STEP 6: DB Persist =====
        send(
          "step",
          JSON.stringify({ label: "天道刻印——正在将您的传奇刻入修仙史册..." }),
        );
        const hp = (ruleResult.stats as any).hp;
        const hpCurrent = hp?.current ?? 100;
        await prisma.player.update({
          where: { id: playerId },
          data: {
            stats: ruleResult.stats as any,
            inventory: ruleResult.inventory as any,
            relationships: (ruleResult.relationships || {}) as any,
            status: hpCurrent <= 0 ? "DEAD" : "ALIVE",
            codex: (ruleResult.codex || []) as any,
            situations: (ruleResult.situations || []) as any,
            foreshadowings: (ruleResult.foreshadowings || []) as any,
          },
        });

        // ===== STEP 7: Save assistant message & send done =====
        await prisma.chatMessage.create({
          data: { role: "assistant", content: finalReply, playerId },
        });
        // 存向量库供Search_History检索
        try {
          await storeVector(
            playerId,
            "玩家: " + userInput + "\nAI: " + finalReply,
            { type: "history", timestamp: Date.now() },
          );
        } catch {}
        const updatedPlayer = await prisma.player.findUnique({
          where: { id: playerId },
        });

        send("step", JSON.stringify({ label: "天机推演完成！" }));
        if (ruleResult.deltas && ruleResult.deltas.codex) {
          send("codex", JSON.stringify(ruleResult.deltas.codex));
        }
        if (ruleResult.deltas && ruleResult.deltas.journal) {
          send("journal", JSON.stringify(ruleResult.deltas.journal));
        }
        send(
          "reply",
          JSON.stringify({
            reply: finalReply,
            player: updatedPlayer,
            deltas: ruleResult.deltas,
          }),
        );
        send("done", "");
      } catch (err) {
        console.error(err);
        let errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.length > 200) errMsg = errMsg.substring(0, 200) + "...";
        send("error", JSON.stringify({ message: "[Server Error] " + errMsg }));
        send("done", "");
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

// ===== Inline Rule Engine (moved from nodes.ts for streaming orchestration) =====
function processRuleEngine(
  toolCalls: any[],
  stats: ICharacterStats,
  inventory: IInventoryItem[],
  codex: any[],
  relationships: Record<string, number>,
  situations: Situation[],
  foreshadowings: Foreshadowing[],
) {
  const newStats = { ...stats } as any;
  const newInventory = [...inventory];
  const newCodex = [...(codex || [])];
  const newSituations = [...situations];
  const newForeshadowings = [...foreshadowings];
  const deltas: Record<string, any> = {};
  // 回合数估算（基于chat message数量，后续可从外部传入精确值）
  const turnEstimate = Math.max(1, situations.reduce((max, s) => Math.max(max, s.startTurn), 0) + 1);

  if (!newStats.hp)
    newStats.hp = { current: 100, max: 100, status_desc: "良好" };
  if (!newStats.mp) newStats.mp = { current: 50, max: 50, status_desc: "充沛" };
  if (!newStats.spirit) newStats.spirit = { value: 100, desc: "精神饱满" };
  if (!newStats.age) newStats.age = { current: 16, max: 100 };
  if (!newStats.shield) newStats.shield = { current: 0, max: 0 };

  for (const tc of toolCalls) {
    const { name, args } = tc;

    // Backpack add
    if (name === "Backpack_additems" && args.items) {
      for (const item of args.items) {
        const existing = newInventory.find((i: any) => i.name === item.name);
        if (existing) {
          existing.count += item.count;
        } else {
          newInventory.push({
            ...item,
            id:
              item.id ||
              Date.now().toString() +
                "-" +
                Math.random().toString(36).substr(2, 5),
          });
        }
      }
      deltas.addedItems = args.items;
    }

    // Backpack reduce / Consume
    if (
      (name === "Backpack_reduceitems" || name === "Consume_Item") &&
      args.items
    ) {
      for (const item of args.items) {
        const idx = newInventory.findIndex((i: any) => i.name === item.name);
        if (idx !== -1) {
          newInventory[idx].count -= item.count;
          if (newInventory[idx].count <= 0) newInventory.splice(idx, 1);
        }
      }
      deltas.reducedItems = args.items;
    }
    // Dynamic mp_cost
    if (name === "Consume_Item" && args.mp_cost && args.mp_cost > 0) {
      newStats.mp.current = Math.max(0, newStats.mp.current - args.mp_cost);
      deltas.mpCost = args.mp_cost;
    }

    // Modify_Stats
    if (name === "Modify_Stats") {
      const a = args;
      if (a.shield_change) {
        newStats.shield.current = Math.max(
          0,
          (newStats.shield.current || 0) + a.shield_change,
        );
      }
      if (a.shield_max_change) {
        newStats.shield.max += a.shield_max_change;
      }

      if (a.hp_change && a.hp_change < 0) {
        const damage = Math.abs(a.hp_change);
        const shieldCurrent = newStats.shield.current || 0;
        if (shieldCurrent > 0) {
          if (shieldCurrent >= damage) {
            newStats.shield.current = shieldCurrent - damage;
          } else {
            const overflow = damage - shieldCurrent;
            newStats.shield.current = 0;
            newStats.hp.current = Math.max(0, newStats.hp.current - overflow);
          }
        } else {
          newStats.hp.current = Math.max(
            0,
            Math.min(newStats.hp.max, newStats.hp.current + a.hp_change),
          );
        }
      } else if (a.hp_change && a.hp_change > 0) {
        newStats.hp.current = Math.min(
          newStats.hp.max,
          newStats.hp.current + a.hp_change,
        );
      }

      const hpPct = (newStats.hp.current / newStats.hp.max) * 100;
      if (hpPct >= 90) newStats.hp.status_desc = "状态良好";
      else if (hpPct >= 70) newStats.hp.status_desc = "轻伤";
      else if (hpPct >= 50) newStats.hp.status_desc = "流血负伤";
      else if (hpPct >= 30) newStats.hp.status_desc = "伤及内脏";
      else if (hpPct >= 10) newStats.hp.status_desc = "肉身破裂";
      else newStats.hp.status_desc = "神仙难救";

      if (a.hp_max_change) {
        newStats.hp.max += a.hp_max_change;
      }
      if (a.mp_change) {
        newStats.mp.current = Math.max(
          0,
          Math.min(newStats.mp.max, newStats.mp.current + a.mp_change),
        );
      }
      if (a.mp_max_change) {
        newStats.mp.max += a.mp_max_change;
      }
      if (a.spirit_change) {
        newStats.spirit.value += a.spirit_change;
      }
      if (a.age_change) {
        newStats.age.current += a.age_change;
      }
      if (a.reputation_change) {
        newStats.reputation += a.reputation_change;
      }
      if (a.state_of_mind_change) {
        newStats.state_of_mind =
          (newStats.state_of_mind || 50) + a.state_of_mind_change;
      }
      if (a.fortune_change) {
        newStats.fortune = (newStats.fortune || 10) + a.fortune_change;
      }
      if (a.karma_change) {
        newStats.karma = (newStats.karma || 0) + a.karma_change;
      }
      deltas.stats = a;
    }

    // Modify_Techniques
    if (name === "Modify_Techniques") {
      if (!newStats.techniques) {
        newStats.techniques = {
          main: "",
          combat: [],
          movement: "",
          support: [],
        };
      }
      const t = newStats.techniques;
      if (args.main !== undefined) {
        t.main = args.main;
      }
      if (args.add_combat) {
        t.combat = [...t.combat, args.add_combat];
      }
      if (args.remove_combat) {
        t.combat = t.combat.filter((c: string) => c !== args.remove_combat);
      }
      if (args.movement !== undefined) {
        t.movement = args.movement;
      }
      if (args.add_support) {
        t.support = [...t.support, args.add_support];
      }
      if (args.remove_support) {
        t.support = t.support.filter((s: string) => s !== args.remove_support);
      }
      deltas.techniques = t;
    }

    // Modify_Traits
    if (name === "Modify_Traits") {
      if (args.add_talents) {
        newStats.talents = [...(newStats.talents || []), ...args.add_talents];
      }
      if (args.remove_talents) {
        newStats.talents = (newStats.talents || []).filter(
          (t: string) => !args.remove_talents.includes(t),
        );
      }
      if (args.add_traits) {
        newStats.traits = [...(newStats.traits || []), ...args.add_traits];
      }
      if (args.remove_traits) {
        newStats.traits = (newStats.traits || []).filter(
          (t: string) => !args.remove_traits.includes(t),
        );
      }
      deltas.traits = newStats.traits;
    }

    // Modify_Mental
    if (name === "Modify_Mental") {
      if (args.emotion) newStats.emotion = args.emotion;
      if (args.mental_state) newStats.mental_state = args.mental_state;
      if (args.reputation_change) {
        newStats.reputation += args.reputation_change;
      }
      if (args.state_of_mind_change) {
        newStats.state_of_mind =
          (newStats.state_of_mind || 50) + args.state_of_mind_change;
      }
      if (args.alignment) newStats.alignment = args.alignment;
      if (args.sect) newStats.sect = args.sect;
      if (args.spiritual_root) newStats.spiritual_root = args.spiritual_root;
      if (args.realm) newStats.realm = args.realm;
      if (args.race) newStats.race = args.race;
      deltas.mental = args;
    }

    // Update_Relationship
    if (name === "Update_Relationship") {
      relationships[args.npc_name] =
        (relationships[args.npc_name] || 0) + args.change;
      deltas.relationships = relationships;
    }

    // Change_Location
    if (name === "Change_Location") {
      deltas.location = args.location;
    }

    // Check_Breakthrough
    if (name === "Check_Breakthrough") {
      if (args.result === "SUCCESS" && args.new_realm) {
        newStats.realm = args.new_realm;
      }
      deltas.breakthrough = args;
    }

    // Generate_NPC → codex
    if (name === "Generate_NPC" && args.npcs) {
      for (const npc of args.npcs) {
        const parts = [npc.description];
        if (npc.realm) parts.push("[" + npc.realm + "]");
        if (npc.sect) parts.push(npc.sect);
        if (npc.personality) parts.push(npc.personality);
        newCodex.push({
          id:
            "cv-" +
            Date.now().toString(36) +
            Math.random().toString(36).substr(2, 5),
          name: npc.name,
          entry_type: "npc",
          description: parts.join(" "),
          metadata: {},
          timestamp: Date.now(),
        });
      }
    }
    // Generate_Location → codex
    if (name === "Generate_Location" && args.locations) {
      for (const loc of args.locations) {
        const parts = [loc.description];
        if (loc.danger_level) parts.push("[" + loc.danger_level + "]");
        if (loc.region) parts.push("位于" + loc.region);
        if (loc.power_distribution)
          parts.push("势力:" + loc.power_distribution);
        if (loc.bound_locations && loc.bound_locations.length > 0)
          parts.push("关联:" + loc.bound_locations.join("、"));
        if (loc.inhabitants && loc.inhabitants.length > 0)
          parts.push("居民:" + loc.inhabitants.join("、"));
        newCodex.push({
          id:
            "cv-" +
            Date.now().toString(36) +
            Math.random().toString(36).substr(2, 5),
          name: loc.name,
          entry_type: "location",
          description: parts.join(" "),
          metadata: {
            region: loc.region,
            danger_level: loc.danger_level,
            peace_orno: loc.peace_orno,
            power_distribution: loc.power_distribution,
            level_range: loc.level_range,
            rules: loc.rules,
            inhabitants: loc.inhabitants,
            bound_items: loc.bound_items,
            bound_locations: loc.bound_locations,
          },
          timestamp: Date.now(),
        });
      }
    }
    // Generate_Sect → codex
    if (name === "Generate_Sect" && args.sects) {
      for (const sect of args.sects) {
        const parts = [sect.description];
        if (sect.alignment) parts.push("[" + sect.alignment + "]");
        if (sect.master) parts.push(sect.master);
        if (sect.specialties) parts.push(sect.specialties);
        newCodex.push({
          id:
            "cv-" +
            Date.now().toString(36) +
            Math.random().toString(36).substr(2, 5),
          name: sect.name,
          entry_type: "sect",
          description: parts.join(" "),
          metadata: {},
          timestamp: Date.now(),
        });
      }
    }
    // Generate_Item → codex
    if (name === "Generate_Item" && args.items) {
      for (const item of args.items) {
        const parts = [item.description];
        if (item.grade) parts.push("[" + item.grade + "]");
        if (item.effects) parts.push(item.effects);
        newCodex.push({
          id:
            "cv-" +
            Date.now().toString(36) +
            Math.random().toString(36).substr(2, 5),
          name: item.name,
          entry_type: "item",
          description: parts.join(" "),
          metadata: {},
          timestamp: Date.now(),
        });
      }
    }
    // Write_Codex
    if (name === "Write_Codex") {
      newCodex.push({
        id:
          "cv-" +
          Date.now().toString(36) +
          Math.random().toString(36).substr(2, 5),
        name: args.name,
        entry_type: args.entry_type,
        description: args.description,
        metadata: args.metadata || {},
        timestamp: Date.now(),
      });
      deltas.codex = {
        name: args.name,
        entry_type: args.entry_type,
        description: args.description,
        metadata: args.metadata || {},
        timestamp: Date.now(),
      };
    }
    // Write_Journal
    if (name === "Write_Journal") {
      deltas.journal = {
        title: args.title,
        content: args.content,
        entry_type: args.entry_type || "general",
        timestamp: Date.now(),
      };
    }
    // Update_Situation
    if (name === "Update_Situation") {
      const a = args;
      if (a.action === "create") {
        const newSit: Situation = {
          id: "sit-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          title: a.title || "未命名局面",
          type: a.type || "conflict",
          trigger: a.trigger || "",
          npcs: a.npcs || [],
          player_goal: a.player_goal || "",
          possible_outcomes: a.possible_outcomes || ["其他可能结局"],
          linked_foreshadowing: [],
          linked_situation: a.linked_situation || null,
          status: "brewing",
          startTurn: turnEstimate,
          updatedAt: Date.now(),
        };
        newSituations.push(newSit);
        deltas.situation = { action: "create", situation: newSit };
      } else if (a.action === "update_status" && a.situation_id) {
        const idx = newSituations.findIndex((s: Situation) => s.id === a.situation_id);
        if (idx !== -1 && a.status) {
          newSituations[idx] = { ...newSituations[idx], status: a.status, updatedAt: Date.now() };
          deltas.situation = { action: "update_status", situation_id: a.situation_id, status: a.status };
        }
      } else if (a.action === "end" && a.situation_id) {
        const idx = newSituations.findIndex((s: Situation) => s.id === a.situation_id);
        if (idx !== -1) {
          newSituations[idx] = {
            ...newSituations[idx],
            status: "ended",
            actual_outcome: a.actual_outcome || "局面已结束",
            endTurn: turnEstimate,
            updatedAt: Date.now(),
          };
          deltas.situation = { action: "end", situation_id: a.situation_id, actual_outcome: a.actual_outcome };
        }
      } else if (a.action === "add_outcome" && a.situation_id && a.new_outcome) {
        const idx = newSituations.findIndex((s: Situation) => s.id === a.situation_id);
        if (idx !== -1) {
          const outcomes = [...newSituations[idx].possible_outcomes, a.new_outcome];
          newSituations[idx] = { ...newSituations[idx], possible_outcomes: outcomes, updatedAt: Date.now() };
          deltas.situation = { action: "add_outcome", situation_id: a.situation_id, new_outcome: a.new_outcome };
        }
      }
    }

    // Create_Foreshadowing
    if (name === "Create_Foreshadowing") {
      const a = args;
      if (!a.resolved) {
        // 埋下伏笔
        const newFs: Foreshadowing = {
          id: "fs-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          title: a.title || "未命名伏笔",
          description: a.description || "",
          related_situation: a.related_situation || "",
          plantedTurn: turnEstimate,
          resolved: false,
        };
        newForeshadowings.push(newFs);
        deltas.foreshadowing = { action: "create", foreshadowing: newFs };
        // 如果关联了局面，更新局面的linked_foreshadowing
        if (a.related_situation) {
          const sIdx = newSituations.findIndex((s: Situation) => s.id === a.related_situation);
          if (sIdx !== -1) {
            newSituations[sIdx] = {
              ...newSituations[sIdx],
              linked_foreshadowing: [...newSituations[sIdx].linked_foreshadowing, newFs.id],
            };
          }
        }
      } else if (a.resolved && a.foreshadowing_id) {
        // 回收伏笔
        const idx = newForeshadowings.findIndex((f: Foreshadowing) => f.id === a.foreshadowing_id);
        if (idx !== -1) {
          newForeshadowings[idx] = {
            ...newForeshadowings[idx],
            resolved: true,
            resolvedTurn: turnEstimate,
          };
          deltas.foreshadowing = {
            action: "resolve",
            foreshadowing_id: a.foreshadowing_id,
            resolve_note: a.resolve_note || "",
          };
        }
      }
    }
    // Search_History (read-only, no state change)
  }

  return {
    stats: newStats,
    inventory: newInventory,
    codex: newCodex,
    relationships,
    situations: newSituations,
    foreshadowings: newForeshadowings,
    deltas,
  };
}
