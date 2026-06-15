import { Annotation, START, END, StateGraph } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import {
  ICharacterStats,
  IInventoryItem,
  IRelationships,
  IntentType,
  CodexEntry,
  Situation,
  Foreshadowing,
} from "@/types";
import {
  ragRetrieverNode,
  plotDirectorNode,
  ruleEngineNode,
  dbPersistNode,
  setLLMConfig,
} from "./nodes";

export const GameStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  }),
  playerId: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
  }),
  playerName: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  stats: Annotation<ICharacterStats>({
    reducer: (x: ICharacterStats, y: Partial<ICharacterStats>) => ({
      ...x,
      ...y,
    }),
  }),
  inventory: Annotation<IInventoryItem[]>({
    reducer: (x: IInventoryItem[], y: IInventoryItem[] | null) => y ?? x,
    default: () => [],
  }),
  codex: Annotation<CodexEntry[]>({
    reducer: (x: CodexEntry[], y: CodexEntry[]) => y ?? x,
    default: () => [],
  }),
  relationships: Annotation<IRelationships>({
    reducer: (x: IRelationships, y: IRelationships) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  ragContext: Annotation<string>({
    reducer: (x: string, y: string) => (y ? x + "\n\n" + y : x),
    default: () => "",
  }),
  intent: Annotation<IntentType>({
    reducer: (x: IntentType, y: IntentType) => y ?? x,
    default: () => "NONE",
  }),
  deltas: Annotation<Record<string, unknown>>({
    reducer: (x: Record<string, unknown>, y: Record<string, unknown>) => ({
      ...x,
      ...y,
    }),
    default: () => ({}),
  }),
  finalReply: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
  stepLogs: Annotation<string[]>({
    reducer: (x: string[], y: string[]) => x.concat(y),
    default: () => [],
  }),
  situations: Annotation<Situation[]>({
    reducer: (x: Situation[], y: Situation[] | null) => y ?? x,
    default: () => [],
  }),
  foreshadowings: Annotation<Foreshadowing[]>({
    reducer: (x: Foreshadowing[], y: Foreshadowing[] | null) => y ?? x,
    default: () => [],
  }),
});

export function buildGameGraph() {
  const workflow = new StateGraph(GameStateAnnotation)
    .addNode("rag_retriever", ragRetrieverNode)
    .addNode("plot_director", plotDirectorNode)
    .addNode("rule_engine", ruleEngineNode)
    .addNode("db_persist", dbPersistNode)
    .addEdge(START, "rag_retriever")
    .addEdge("rag_retriever", "plot_director")
    .addEdge("plot_director", "rule_engine")
    .addEdge("rule_engine", "db_persist")
    .addEdge("db_persist", END);
  return workflow.compile();
}

export { setLLMConfig };
