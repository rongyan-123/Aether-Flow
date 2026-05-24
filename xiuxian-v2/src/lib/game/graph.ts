import { Annotation, START, END, StateGraph } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { ICharacterStats, IInventoryItem, IntentType } from "@/types";
import { ragRetrieverNode, plotDirectorNode, ruleEngineNode, dbPersistNode } from "./nodes";

// 1. 定义核心状态 (Graph State)
export const GameStateAnnotation = Annotation.Root({
  // 对话历史
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  // 玩家ID
  playerId: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  // 玩家当前属性 (可变)
  stats: Annotation<ICharacterStats>({
    reducer: (x, y) => ({ ...x, ...y }),
  }),
  // 背包 (可变)
  inventory: Annotation<IInventoryItem[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  // RAG 检索到的上下文
  ragContext: Annotation<string>({
    reducer: (x, y) => (y ? x + "\n\n" + y : x),
    default: () => "",
  }),
  // 意图识别结果 (REWARD, PENALTY, COMBAT, NONE)
  intent: Annotation<IntentType>({
    reducer: (x, y) => y ?? x,
    default: () => "NONE",
  }),
  // 规则引擎计算出的数值变动 (delta)
  deltas: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  // 最终回复文本
  finalReply: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
});

// 2. 构建 Graph
export function buildGameGraph() {
  const workflow = new StateGraph(GameStateAnnotation)
    // 添加节点
    .addNode("rag_retriever", ragRetrieverNode)
    .addNode("plot_director", plotDirectorNode)
    .addNode("rule_engine", ruleEngineNode)
    .addNode("db_persist", dbPersistNode)
    // 定义边 (流程顺序)
    .addEdge(START, "rag_retriever")
    .addEdge("rag_retriever", "plot_director")
    .addEdge("plot_director", "rule_engine")
    .addEdge("rule_engine", "db_persist")
    .addEdge("db_persist", END);

  return workflow.compile();
}
