import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildGameGraph } from "@/lib/game/graph";
import { HumanMessage } from "@langchain/core/messages";

// 全局图实例 (单例)
const gameGraph = buildGameGraph();

export async function POST(req: Request) {
  try {
    const { input, playerId } = await req.json();

    if (!input || !playerId) {
      return NextResponse.json(
        { error: "Missing input or playerId" },
        { status: 400 },
      );
    }

    // 1. 获取玩家状态
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // 2. 暂存用户消息 (非流式阶段)
    await prisma.chatMessage.create({
      data: {
        role: "user",
        content: input,
        playerId,
      },
    });

    // 3. 运行 LangGraph
    // 注意：这里 invoke 是同步等待所有步骤完成。
    // 如果要实现流式返回中间步骤（如 RAG 检索中...），需要用 streamEvents。
    // 目前为了确保稳定性，先用 invoke，后续再优化流式体验。

    const initialState = {
      messages: [new HumanMessage(input)],
      playerId: playerId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stats: player.stats as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inventory: player.inventory as any,
    };

    const result = await gameGraph.invoke(initialState);

    // 4. 获取最终回复
    const finalReply = result.finalReply;
    const updatedPlayer = await prisma.player.findUnique({
      where: { id: playerId },
    });

    // 5. 返回结果
    return NextResponse.json({
      reply: finalReply,
      player: updatedPlayer,
      deltas: result.deltas, // 告诉前端发生了什么变化（用于动效）
    });
  } catch (error) {
    console.error("[API/Game Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
