import { prisma } from "@/lib/db";
import { ChatOpenAI } from "@langchain/openai";
import { storeVector, searchVectors } from "@/lib/vector-store";

let _llmConfig = { apiKey: '', baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-4o-mini' };

export function setSummaryLLMConfig(config: { apiKey: string; baseUrl: string; modelName: string }) {
  _llmConfig = config;
}

const SUMMARY_INTERVAL = 20;

/**
 * 检查是否需要总结：每20轮（40条user+assistant消息）总结一次
 * 返回最新的摘要文本，如果不需要总结则返回 null
 */
export async function maybeSummarize(playerId: string): Promise<string | null> {
  try {
    const count = await prisma.chatMessage.count({
      where: { playerId, role: { in: ['user', 'assistant'] } },
    });

    if (count < SUMMARY_INTERVAL * 2) return null;

    // 检查上次总结到了哪个位置
    let lastSummarizedIndex = 0;
    try {
      const lastSummary = await prisma.conversationSummary.findFirst({
        where: { playerId },
        orderBy: { toIndex: 'desc' },
      });
      lastSummarizedIndex = lastSummary?.toIndex ?? 0;
    } catch { /* 表可能还不存在 */ }

    const newMessages = count - lastSummarizedIndex;

    if (newMessages < SUMMARY_INTERVAL * 2) return null;

    // 取最近未总结的消息
    const messages = await prisma.chatMessage.findMany({
      where: { playerId, role: { in: ['user', 'assistant'] } },
      orderBy: { createdAt: 'asc' },
      skip: lastSummarizedIndex,
      take: newMessages,
    });

    const conversation = messages.map(m => `${m.role === 'user' ? '玩家' : 'AI'}: ${m.content}`).join('\n');

    const llm = new ChatOpenAI({
      modelName: _llmConfig.modelName,
      apiKey: _llmConfig.apiKey,
      configuration: { baseURL: _llmConfig.baseUrl },
      temperature: 0.3,
    });

    const result = await llm.invoke([
      {
        role: 'system',
        content: `你是一个修仙游戏的故事摘要助手。请将以下对话内容压缩为简洁摘要。
规则：
- 只记录关键事件、重要NPC、地点变化、物品得失、属性变化
- 忽略日常闲聊和无事发生的回合
- 用第三人称，一句话一条事件
- 总字数不超过300字
- 格式：
【当前地点】xxx
【最近事件】
- xxx
- xxx
【关键NPC】xxx
【背包重要物品】xxx`,
      },
      { role: 'user', content: conversation },
    ]);

    const summary = result.content as string;

    // 存DB
    try {
      await prisma.conversationSummary.create({
        data: {
          playerId,
          content: summary,
          fromIndex: lastSummarizedIndex,
          toIndex: count,
        },
      });
    } catch { /* 表可能还不存在 */ }

    // 同时存向量库，供RAG检索
    try {
      await storeVector(playerId, `[游戏历程摘要 ${new Date().toLocaleDateString()}]\n${summary}`, {
        type: 'summary',
        fromIndex: lastSummarizedIndex,
        toIndex: count,
      });
    } catch {}

    return summary;
  } catch (e) {
    console.error('[Summarizer] Failed:', e);
    return null;
  }
}

/**
 * 获取所有历史摘要（拼接）
 */
export async function getAllSummaries(playerId: string): Promise<string> {
  try {
    const summaries = await prisma.conversationSummary.findMany({
      where: { playerId },
      orderBy: { createdAt: 'asc' },
    });
    if (summaries.length === 0) return '';
    return summaries.map((s, i) => `【第${i + 1}段摘要】\n${s.content}`).join('\n\n');
  } catch { return ''; }
}

/**
 * 获取应该加载的消息：只有上次总结之后的消息
 */
export async function getRecentMessages(playerId: string): Promise<{ role: string; content: string }[]> {
  try {
    let lastSummarizedIndex = 0;
    try {
      const lastSummary = await prisma.conversationSummary.findFirst({
        where: { playerId },
        orderBy: { toIndex: 'desc' },
      });
      lastSummarizedIndex = lastSummary?.toIndex ?? 0;
    } catch { /* 表可能还不存在 */ }

    const messages = await prisma.chatMessage.findMany({
      where: { playerId, role: { in: ['user', 'assistant'] } },
      orderBy: { createdAt: 'asc' },
      skip: lastSummarizedIndex,
      take: SUMMARY_INTERVAL * 2 + 10,
    });

    return messages.map(m => ({ role: m.role, content: m.content }));
  } catch {
    // 如果新表不存在，回退到直接读最近消息
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { playerId, role: { in: ['user', 'assistant'] } },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      return messages.map(m => ({ role: m.role, content: m.content }));
    } catch { return []; }
  }
}
