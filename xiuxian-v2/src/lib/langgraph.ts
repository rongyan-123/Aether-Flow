import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// 1. 定义图状态 (Graph State)
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  playerState: Annotation<Record<string, unknown>>({
    reducer: (x, y) => ({ ...x, ...y }),
  }),
  intent: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  ragContext: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  calculations: Annotation<Record<string, unknown>>({
    reducer: (x, y) => ({ ...x, ...y }),
  }),
});

// 2. 定义节点 (Nodes)

// Node A: RAG Retriever (读)
async function ragRetriever(state: typeof GraphState.State) {
  console.log("--- Node: RAG Retriever ---");
  // TODO: 实际调用 pgvector 或 Chroma
  // const context = await vectorStore.similaritySearch(lastMessage.content);
  const context = "修仙界常识：练气期修士寿元百年，需筑基丹方能突破...";
  return { ragContext: context };
}

// Node B: Plot Director (想 - LLM)
async function plotDirector(state: typeof GraphState.State) {
  console.log("--- Node: Plot Director ---");
  // TODO: 调用 LLM (Vercel AI SDK 或 LangChain ChatModel)
  // 输入: messages + ragContext + playerState
  // 输出: AI 回复 + 意图分类 (Intent)

  const mockAiReply = "你盘膝而坐，吸纳天地灵气。忽然，一道传音符飞入洞府...";
  const mockIntent = "NONE"; // REWARD, PENALTY, COMBAT

  return {
    messages: [new AIMessage(mockAiReply)],
    intent: mockIntent,
  };
}

// Node C: Rule Engine (算 - Code)
async function ruleEngine(state: typeof GraphState.State) {
  console.log("--- Node: Rule Engine ---");
  const { intent, playerState } = state;
  let calculations = {};

  // 纯代码逻辑，不依赖 LLM
  if (intent === "COMBAT") {
    calculations = { damage: 10, expGain: 20 };
  } else if (intent === "REWARD") {
    calculations = { itemGained: "下品灵石", amount: 5 };
  }

  return { calculations };
}

// Node D: DB Persist (写)
async function dbPersist(state: typeof GraphState.State) {
  console.log("--- Node: DB Persist ---");
  // TODO: 使用 Prisma 保存最新的 playerState 和聊天记录
  // await prisma.player.update({ ... });
  return {};
}

// 3. 构建图 (Build Graph)
const workflow = new StateGraph(GraphState)
  .addNode("rag_retriever", ragRetriever)
  .addNode("plot_director", plotDirector)
  .addNode("rule_engine", ruleEngine)
  .addNode("db_persist", dbPersist)
  .addEdge(START, "rag_retriever")
  .addEdge("rag_retriever", "plot_director")
  .addEdge("plot_director", "rule_engine")
  .addEdge("rule_engine", "db_persist")
  .addEdge("db_persist", END);

// 4. 编译图
export const xiuxianGraph = workflow.compile();
