import { GameStateAnnotation } from "./graph";
import { directorPrompt } from "./prompts";
import { gameTools } from "./tools";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/db";

const llm = new ChatOpenAI({
  modelName: process.env.ARK_MODEL_ID || "ep-m-20260221202117-dwrl4",
  openAIApiKey: process.env.ARK_API_KEY,
  configuration: {
    baseURL: process.env.ARK_BASE_URL,
  },
  temperature: 0.7,
  streaming: true,
});

const llmWithTools = llm.bindTools(gameTools);

export async function ragRetrieverNode(state: typeof GameStateAnnotation.State) {
  console.log("[Node] RAG Retriever");
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const query = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  
  let ragContext = '';
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/xiuxian' });
    const res = await pool.query('SELECT content, metadata FROM world_vectors LIMIT 5');
    ragContext = res.rows.map((r: any) => r.content).join(String.fromCharCode(10));
    await pool.end();
    console.log('[RAG] Found ' + res.rows.length + ' context chunks');
  } catch (err) {
    console.log('[RAG] pgvector query failed, using fallback');
    ragContext = '????????????????????????????';
  }
  
  return { ragContext };
}

export async function plotDirectorNode(state: typeof GameStateAnnotation.State) {
  console.log("[Node] Plot Director");
  const { stats, inventory, ragContext, messages } = state;
  const promptInput = {
    playerStats: JSON.stringify(stats, null, 2),
    inventory: JSON.stringify(inventory, null, 2),
    ragContext,
    chat_history: messages.slice(0, -1),
    input: messages[messages.length - 1].content,
  };
  const chain = directorPrompt.pipe(llmWithTools);
  const result = await chain.invoke(promptInput);
  return {
    messages: [result],
    finalReply: result.content as string,
  };
}

export async function ruleEngineNode(state: typeof GameStateAnnotation.State) {
  console.log("[Node] Rule Engine");
  const { messages, stats, inventory } = state;
  const lastAiMessage = messages[messages.length - 1] as AIMessage;
  let newStats = { ...stats } as any;
  let newInventory = [...inventory];
  const deltas: Record<string, any> = {};

  if (lastAiMessage.tool_calls && lastAiMessage.tool_calls.length > 0) {
    for (const toolCall of lastAiMessage.tool_calls) {
      const { name, args } = toolCall;
      if (name === "Modify_PlayerStats") {
        if (args.hp_change) {
          newStats.hp.current = Math.max(0, Math.min(newStats.hp.max, newStats.hp.current + args.hp_change));
        }
        if (args.mp_change) {
          newStats.mp.current = Math.max(0, Math.min(newStats.mp.max, newStats.mp.current + args.mp_change));
        }
        if (args.age_change) {
          newStats.age.current += args.age_change;
        }
        deltas.stats = args;
      }
      if (name === "Backpack_additems") {
        const itemsToAdd = args.items as any[];
        for (const item of itemsToAdd) {
          const existing = newInventory.find((i: any) => i.name === item.name);
          if (existing) {
            existing.count += item.count;
          } else {
            newInventory.push({ ...item, id: item.id || Date.now().toString() });
          }
        }
        deltas.addedItems = itemsToAdd;
      }
      if (name === "Backpack_reduceitems") {
        const itemsToReduce = args.items as any[];
        for (const item of itemsToReduce) {
          const existingIndex = newInventory.findIndex((i: any) => i.name === item.name);
          if (existingIndex !== -1) {
            newInventory[existingIndex].count -= item.count;
            if (newInventory[existingIndex].count <= 0) {
              newInventory.splice(existingIndex, 1);
            }
          }
        }
        deltas.reducedItems = itemsToReduce;
      }
      if (name === "Current_Location") {
        deltas.location = args.location;
      }
    }
  }

  return {
    stats: newStats,
    inventory: newInventory,
    deltas,
  };
}

export async function dbPersistNode(state: typeof GameStateAnnotation.State) {
  console.log("[Node] DB Persist");
  const { playerId, stats, inventory, messages } = state;
  const lastMessage = messages[messages.length - 1];
  const statsAny = stats as any;

  try {
    await prisma.$transaction([
      prisma.player.update({
        where: { id: playerId },
        data: {
          stats: statsAny,
          inventory: inventory as any,
          status: statsAny.hp.current <= 0 ? 'DEAD' : 'ALIVE'
        }
      }),
      prisma.chatMessage.create({
        data: {
          role: "assistant",
          content: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content),
          playerId
        }
      })
    ]);
    console.log("[DB] Persisted successfully.");
  } catch (err) {
    console.error("[DB Error] Failed to persist:", err);
  }

  return {};
}
