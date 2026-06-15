import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearVectors } from "@/lib/vector-store";

export async function POST(req: Request) {
  try {
    const { input, playerId } = await req.json();
    if (!input || !playerId) {
      return NextResponse.json({ error: "Missing input or playerId" }, { status: 400 });
    }
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    await prisma.chatMessage.create({ data: { role: "user", content: input, playerId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Game Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { playerId } = await req.json();
    if (!playerId) return NextResponse.json({ error: "Missing playerId" }, { status: 400 });

    // Clear vector database (conversation_vectors)
    await clearVectors(playerId);

    // Delete chat messages
    await prisma.chatMessage.deleteMany({ where: { playerId } });

    // Delete player
    await prisma.player.deleteMany({ where: { id: playerId } });

    return NextResponse.json({ success: true, message: "Player data cleaned" });
  } catch (error) {
    console.error("[API/Game DELETE Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
