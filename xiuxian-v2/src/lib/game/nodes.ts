// 小白导览：这个文件实现了几个“节点”（nodes），每个节点负责一小段任务，组合起来就是完整的游戏对话/决策流程。
// 节点角色快速说明：
// - ragRetrieverNode: 从向量库检索相关记忆（把 AI 的长期记忆拿出来）。
// - plotDirectorNode: 把玩家状态、记忆和最新输入喂给 LLM，让 LLM 生成文本或调用工具。
// - ruleEngineNode: 对 LLM 请求的工具调用做实际的业务逻辑处理（修改背包/属性/写图鉴等）。
// 每个节点接收一个 state（玩家当前状态）并返回一个小结果（例如日志、最终回复、或待执行操作）。
import { GameStateAnnotation } from "./graph";
import { searchVectors } from "@/lib/vector-store";
import { buildDirectorPrompt } from "./prompts";
import { gameTools, setConversationId, findToolByName } from "./tools";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Situation, Foreshadowing } from "@/types";

let _llmConfig = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  modelName: "gpt-4o-mini",
};

export function setLLMConfig(config: {
  apiKey: string;
  baseUrl: string;
  modelName: string;
}) {
  _llmConfig = config;
}

function getLLM() {
  return new ChatOpenAI({
    modelName: _llmConfig.modelName,
    apiKey: _llmConfig.apiKey,
    configuration: { baseURL: _llmConfig.baseUrl },
    temperature: 0.7,
  }).bindTools(gameTools);
}

function getPlainLLM() {
  return new ChatOpenAI({
    modelName: _llmConfig.modelName,
    apiKey: _llmConfig.apiKey,
    configuration: { baseURL: _llmConfig.baseUrl },
    temperature: 0.7,
  });
}
// ========== Node A: RAG Retriever ==========
export async function ragRetrieverNode(
  state: typeof GameStateAnnotation.State,
) {
  const logs = ["[Node] RAG Retriever"];
  const { messages, playerId } = state;
  const lastMessage = messages[messages.length - 1];
  const query =
    typeof lastMessage.content === "string" ? lastMessage.content : "";
  let ragContext = "";
  try {
    const results = await searchVectors(playerId, query, 5);
    ragContext = results.map((r: { content: string }) => r.content).join("\n");
    logs.push("[RAG] Found " + results.length + " contexts");
  } catch {
    ragContext = "修仙界常言：练气期修士寿元百年。当前地点：青云山脉外围。";
    logs.push("[RAG] Fallback context used");
  }
  return { ragContext, stepLogs: logs };
}

// ========== Node B: Plot Director (LLM) ==========
export async function plotDirectorNode(
  state: typeof GameStateAnnotation.State,
) {
  const logs = ["[Node] Plot Director"];
  setConversationId(state.playerId);
  const { stats, inventory, ragContext, messages, situations, foreshadowings } = state;

  // 格式化局面上下文
  const activeSituations = (situations || []).filter((s: Situation) => s.status !== 'ended');
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
  const unresolvedForeshadowing = (foreshadowings || []).filter((f: Foreshadowing) => !f.resolved);
  let foreshadowingContext = '';
  if (unresolvedForeshadowing.length > 0) {
    foreshadowingContext = '【未回收伏笔】\n' + unresolvedForeshadowing.map((f: Foreshadowing) =>
      `- [${f.id}] ${f.title} (第${f.plantedTurn}回合埋下): ${f.description}`
    ).join('\n');
  } else {
    foreshadowingContext = '【未回收伏笔】暂无。可在合适时机调用Create_Foreshadowing埋下新伏笔。';
  }

  const promptInput = {
    playerName: state.playerName || "无名修士",
    playerStats: JSON.stringify(stats, null, 2),
    inventory: JSON.stringify(inventory, null, 2),
    ragContext,
    chat_history: messages.slice(0, -1),
    input: messages[messages.length - 1].content,
    situation_context: situationContext,
    foreshadowing_context: foreshadowingContext,
  };

  // First call: LLM with tools
  const chain = buildDirectorPrompt(state.playerName || "无名修士").pipe(getLLM());
  const result = await chain.invoke(promptInput);

  // Execute tool calls (side effects: vector DB storage etc.)
  if (result.tool_calls && result.tool_calls.length > 0) {
    logs.push("[Plot Director] " + result.tool_calls.length + " tool calls");
    for (const toolCall of result.tool_calls) {
      const tool = findToolByName(toolCall.name);
      if (tool) {
        try {
          await tool.invoke(toolCall.args);
          logs.push("[Plot Director] Executed: " + toolCall.name);
        } catch (err) {
          logs.push("[Plot Director] Tool failed: " + toolCall.name);
        }
      }
    }
  }

  // If only tool calls with no narrative text, do follow-up
  let finalReply = (result.content as string) || "";
  if (
    finalReply.trim() === "" &&
    result.tool_calls &&
    result.tool_calls.length > 0
  ) {
    logs.push("[Plot Director] Empty content with tool calls, follow-up...");
    const toolSummary = result.tool_calls
      .map(
        (tc: { name: string; args: Record<string, unknown> }) =>
          tc.name + ": " + JSON.stringify(tc.args),
      )
      .join("\n");
    const plainLlm = getPlainLLM();
    const followUp = await plainLlm.invoke([
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
      ...(promptInput.chat_history as { content: string }[]),
      { role: "user", content: promptInput.input },
      {
        role: "assistant",
        content: "[Internal] executed tools:\n" + toolSummary,
      },
      {
        role: "user",
        content:
          "Based on the above, generate a vivid xianxia narration. Direct text output only, no tools. Every line MUST start with 2 full-width spaces.",
      },
    ] as any);
    finalReply = (followUp.content as string) || "";
  }

  return { messages: [result], finalReply, stepLogs: logs };
}

// ========== Node C: Rule Engine (code, no LLM) ==========
// Code-enforced todolist: processes ALL tool calls from the LLM
export async function ruleEngineNode(state: typeof GameStateAnnotation.State) {
  const logs = ["[Node] Rule Engine"];
  const { messages, stats, inventory, codex, situations, foreshadowings } = state;
  const lastAiMessage = messages[messages.length - 1] as AIMessage;
  const newStats = { ...stats } as any;
  const newInventory = [...inventory];
  const newCodex = [...(codex || [])];
  const newSituations = [...(situations || [])];
  const newForeshadowings = [...(foreshadowings || [])];
  const deltas: Record<string, any> = {};
  const todolist: string[] = [];
  const turnEstimate = Math.max(1, (situations || []).reduce((max, s) => Math.max(max, s.startTurn), 0) + 1);

  if (lastAiMessage.tool_calls && lastAiMessage.tool_calls.length > 0) {
    for (const toolCall of lastAiMessage.tool_calls) {
      const { name, args } = toolCall;

      // === Backpack Operations ===
      if (name === "Backpack_additems") {
        todolist.push(
          "[DONE] Backpack_additems: " +
            JSON.stringify(args.items?.map((i: any) => i.name + "x" + i.count)),
        );
        const itemsToAdd = args.items as any[];
        for (const item of itemsToAdd) {
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
        deltas.addedItems = itemsToAdd;
      }

      if (name === "Backpack_reduceitems" || name === "Consume_Item") {
        if (args.items && args.items.length > 0) {
          todolist.push(
            "[DONE] " +
              name +
              ": " +
              JSON.stringify(
                args.items.map((i: any) => i.name + "x" + i.count),
              ),
          );
          const itemsToReduce = args.items as any[];
          for (const item of itemsToReduce) {
            const idx = newInventory.findIndex(
              (i: any) => i.name === item.name,
            );
            if (idx !== -1) {
              newInventory[idx].count -= item.count;
              if (newInventory[idx].count <= 0) newInventory.splice(idx, 1);
            }
          }
          deltas.reducedItems = itemsToReduce;
        }
        // Dynamic mp_cost: player can inject variable spirit power
        if (args.mp_cost && args.mp_cost > 0) {
          if (!newStats.mp)
            newStats.mp = { current: 50, max: 50, status_desc: "充沛" };
          newStats.mp.current = Math.max(0, newStats.mp.current - args.mp_cost);
          todolist.push("[DONE] Consume_Item mp_cost: -" + args.mp_cost);
          deltas.mpCost = args.mp_cost;
        }
      }

      // === Core Stats ===
      if (name === "Modify_Stats") {
        todolist.push("[DONE] Modify_Stats");
        const a = args;
        if (!newStats.hp)
          newStats.hp = { current: 100, max: 100, status_desc: "良好" };
        if (!newStats.mp)
          newStats.mp = { current: 50, max: 50, status_desc: "充沛" };
        if (!newStats.spirit)
          newStats.spirit = { value: 100, desc: "精神饱满" };
        if (!newStats.age) newStats.age = { current: 16, max: 100 };
        if (!newStats.shield) newStats.shield = { current: 0, max: 0 };

        // Shield processing: apply shield changes first
        if (a.shield_change) {
          newStats.shield.current = Math.max(
            0,
            (newStats.shield.current || 0) + a.shield_change,
          );
        }
        if (a.shield_max_change) {
          newStats.shield.max += a.shield_max_change;
        }

        // HP damage: shield absorbs first, overflow hits HP
        if (a.hp_change && a.hp_change < 0) {
          const damage = Math.abs(a.hp_change);
          const shieldCurrent = newStats.shield.current || 0;
          if (shieldCurrent > 0) {
            if (shieldCurrent >= damage) {
              // Shield fully absorbs
              newStats.shield.current = shieldCurrent - damage;
              if (newStats.shield.current === 0) {
                todolist.push("[MECH] 护盾被击碎！护体灵光崩溃");
              }
            } else {
              // Shield breaks, overflow to HP
              const overflow = damage - shieldCurrent;
              newStats.shield.current = 0;
              newStats.hp.current = Math.max(0, newStats.hp.current - overflow);
              todolist.push("[MECH] 护盾碎裂！溢出伤害 " + overflow);
            }
          } else {
            // No shield, direct HP damage
            newStats.hp.current = Math.max(
              0,
              Math.min(newStats.hp.max, newStats.hp.current + a.hp_change),
            );
          }
        } else if (a.hp_change && a.hp_change > 0) {
          // Healing goes directly to HP
          newStats.hp.current = Math.min(
            newStats.hp.max,
            newStats.hp.current + a.hp_change,
          );
        }

        // Injury grading status_desc based on HP%
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

      // === Techniques ===
      if (name === "Modify_Techniques") {
        todolist.push("[DONE] Modify_Techniques");
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
          t.support = t.support.filter(
            (s: string) => s !== args.remove_support,
          );
        }
        deltas.techniques = t;
      }

      // === Traits & Talents ===
      if (name === "Modify_Traits") {
        todolist.push("[DONE] Modify_Traits");
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

      // === Mental & Social ===
      if (name === "Modify_Mental") {
        todolist.push("[DONE] Modify_Mental");
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

      // === Relationship ===
      if (name === "Update_Relationship") {
        todolist.push(
          "[DONE] Update_Relationship: " +
            args.npc_name +
            " " +
            (args.change > 0 ? "+" : "") +
            args.change,
        );
        const rels = state.relationships || {};
        rels[args.npc_name] = (rels[args.npc_name] || 0) + args.change;
        deltas.relationships = rels;
      }

      // === Location ===
      if (name === "Change_Location") {
        todolist.push("[DONE] Change_Location: " + args.location);
        deltas.location = args.location;
      }

      // === Breakthrough ===
      if (name === "Check_Breakthrough") {
        todolist.push("[DONE] Check_Breakthrough: " + args.result);
        if (args.result === "SUCCESS" && args.new_realm) {
          newStats.realm = args.new_realm;
        }
        deltas.breakthrough = args;
      }

      // === Generate_NPC (codex) ===
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
      // === Generate_Location (codex) ===
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
      // === Generate_Sect (codex) ===
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
      // === Generate_Item (codex) ===
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
      // === Write_Codex ===
      if (name === "Write_Codex") {
        todolist.push("[DONE] Write_Codex: " + args.name);
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
      // === Write_Journal ===
      if (name === "Write_Journal") {
        todolist.push("[DONE] Write_Journal: " + args.title);
        deltas.journal = {
          title: args.title,
          content: args.content,
          entry_type: args.entry_type || "general",
          timestamp: Date.now(),
        };
      }

      // === Update_Situation ===
      if (name === "Update_Situation") {
        todolist.push("[DONE] Update_Situation: " + args.action);
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

      // === Create_Foreshadowing ===
      if (name === "Create_Foreshadowing") {
        const a = args;
        if (!a.resolved) {
          todolist.push("[DONE] Create_Foreshadowing: " + a.title);
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
          todolist.push("[DONE] Resolve_Foreshadowing: " + a.foreshadowing_id);
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

      // === Search_History (read-only) ===
      if (name === "Search_History") {
        todolist.push("[DONE] Search_History: " + args.query);
      }

      // === Skip ===
      if (name === "Skip") {
        todolist.push("[DONE] Skip: " + args.reason);
      }
    } // end for
  } // end if

  logs.push("[Rule Engine] Todolist: " + JSON.stringify(todolist));
  return {
    stats: newStats,
    inventory: newInventory,
    codex: newCodex,
    situations: newSituations,
    foreshadowings: newForeshadowings,
    deltas,
    stepLogs: logs,
  };
}

// ========== Node D: DB Persist ==========
export async function dbPersistNode(state: typeof GameStateAnnotation.State) {
  const logs = ["[Node] DB Persist"];
  const { playerId, stats, inventory, relationships, codex, situations, foreshadowings } = state;
  const hp = (stats as any).hp;
  const hpCurrent = hp?.current ?? 100;

  try {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        stats: stats as unknown as Prisma.InputJsonValue,
        inventory: inventory as any,
        relationships: (relationships || {}) as any,
        status: hpCurrent <= 0 ? "DEAD" : "ALIVE",
        codex: (codex || []) as any,
        situations: (situations || []) as any,
        foreshadowings: (foreshadowings || []) as any,
      },
    });
    logs.push("[DB] Persisted successfully");
  } catch (err) {
    logs.push(
      "[DB] Persist failed: " +
        (err instanceof Error ? err.message : String(err)),
    );
  }

  return { stepLogs: logs };
}
