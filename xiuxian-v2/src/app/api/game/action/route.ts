import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { ICharacterStats, IInventoryItem } from "@/types";
import { buildGameGraph, setLLMConfig } from "@/lib/game/graph";
import { injectWorldview, listVectors } from "@/lib/vector-store";
import { HumanMessage } from "@langchain/core/messages";

const gameGraph = buildGameGraph();

export async function POST(req: Request) {
  const { input, playerId, mode, llmConfig, playerName } = await req.json();

  if (!playerId)
    return new Response(JSON.stringify({ error: "Missing playerId" }), {
      status: 400,
    });

  if (llmConfig && llmConfig.apiKey) {
    setLLMConfig({
      apiKey: llmConfig.apiKey,
      baseUrl: llmConfig.baseUrl || "https://api.openai.com/v1",
      modelName: llmConfig.modelId || llmConfig.customModel || "gpt-4o-mini",
    });
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
        stats: {} as Prisma.InputJsonValue,
        inventory: [] as Prisma.InputJsonValue,
        relationships: {} as Prisma.InputJsonValue,
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

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (ev: string, data: string) => {
        ctrl.enqueue(enc.encode(`event: ${ev}\ndata: ${data}\n\n`));
      };
      try {
        send("step", JSON.stringify({ label: "Loading" }));
        const isPrep = mode === "prepare";
        const userInput = isPrep
          ? input + "\n\nPlayer Stats: " + JSON.stringify(player.stats)
          : input;
        const init = {
          messages: [new HumanMessage(userInput)],
          playerId,
          stats: player.stats as unknown as ICharacterStats,
          inventory: player.inventory as unknown as IInventoryItem[], relationships: (player.relationships || {}) as any,
        };
        const rp = gameGraph.invoke(init);
        await new Promise((r) => setTimeout(r, 500));
        const result = await rp;
        const finalReply = result.finalReply || "...";
        await prisma.chatMessage.create({
          data: { role: "assistant", content: finalReply, playerId },
        });
        const up = await prisma.player.findUnique({ where: { id: playerId } });
        send("step", JSON.stringify({ label: "Done" }));
        if(result.deltas&&result.deltas.codex){send("codex",JSON.stringify(result.deltas.codex))}
        if(result.deltas&&result.deltas.journal){send("journal",JSON.stringify(result.deltas.journal))}

        send(
          "reply",
          JSON.stringify({
            reply: finalReply,
            player: up,
            deltas: result.deltas,
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

