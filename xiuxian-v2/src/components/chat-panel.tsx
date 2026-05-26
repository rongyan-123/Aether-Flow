"use client";
/* eslint-disable react-hooks/purity */

import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/stores/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Brain } from "lucide-react";
import { marked } from "marked";
import { IChatMessage } from "@/types";

const LOADING_TEXTS = [
  "天道推演中...",
  "正在参悟因果...",
  "灵气汇聚，命运之线交织...",
  "天机不可泄露...",
  "大道五十，天衍四九...",
  "正在推演命运轨迹...",
];

function getLLMConfig() {
  try {
    return JSON.parse(localStorage.getItem("xiuxian-llm-config") || "{}");
  } catch {
    return {};
  }
}
export function ChatPanel() {
  const {
    addMessage,
    isLoading,
    setLoading,
    player,
    chatHistory,
    phase,
    currentEvent,
    setCurrentEvent,
  } = useGameStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = { player, phase } as any;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // chatHistory from store
  // player already from store
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  // loadingIdx removed, using random instead

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, currentEvent]);

  // loading 轮播定时器
  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(
      () =>
        setLoadingText(
          LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)],
        ),
      2500,
    );
    return () => clearInterval(timer);
  }, [isLoading]);
  // 实时状态（通过 callback 避免直接 setState）
  const prevEventRef = useRef("");
  useEffect(() => {
    if (currentEvent && currentEvent !== prevEventRef.current) {
      prevEventRef.current = currentEvent;
      setLoadingText(currentEvent);
    }
  }, [currentEvent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !player || !active) return;
    const userMessage: IChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: currentInput,
          playerId: player?.id || String(Date.now()),
          playerName: player?.name || '无名',
          llmConfig: getLLMConfig(),
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        let errMsg = "请求失败 (" + res.status + ")";
        try {
          errMsg = JSON.parse(errBody).error || errMsg;
        } catch {}
        addMessage({
          id: "err-" + Date.now(),
          role: "assistant",
          content: errMsg,
          timestamp: Date.now(),
        });
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEventName = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventName = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (currentEventName === "reply") {
              const parsed = JSON.parse(data);
              if (parsed.reply)
                addMessage({
                  id: "ai-" + Date.now(),
                  role: "assistant",
                  content: parsed.reply,
                  timestamp: Date.now(),
                });
              if (parsed.player)
                useGameStore.getState().setPlayer(parsed.player);
            } else if (currentEventName === "codex") {
              var ce = JSON.parse(data);
              useGameStore.getState().addCodex({ id: "c-" + Date.now(), name: ce.name, entry_type: ce.entry_type || "general", description: ce.description || "", metadata: ce.metadata || {}, timestamp: ce.timestamp || Date.now() });
            } else if (currentEventName === "journal") {
              var je = JSON.parse(data);
              useGameStore.getState().addJournal({ id: "j-" + Date.now(), title: je.title, content: je.content, entry_type: je.entry_type || "general", timestamp: je.timestamp || Date.now() });
            } else if (currentEventName === "step") {
              setCurrentEvent(JSON.parse(data).label);
            } else if (currentEventName === "error") {
              addMessage({
                id: "err-" + Date.now(),
                role: "assistant",
                content: JSON.parse(data).message,
                timestamp: Date.now(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      addMessage({
        id: "err-" + Date.now(),
        role: "assistant",
        content: "[Connection Error] " + errMsg,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
      setCurrentEvent("");
    }
  };

  const renderAssistant = (content: string) => {
    const html = marked.parse(content, { breaks: true, gfm: true }) as string;
    return (
      <div
        className="prose prose-invert prose-sm max-w-none prose-xiuxian"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-200 font-chinese">
          天机推演
        </h2>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          <AnimatePresence>
            {chatHistory.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  "flex " +
                  (msg.role === "user"
                    ? "justify-end"
                    : msg.role === "system"
                    ? "justify-center"
                    : "justify-start")
                }
              >
                {msg.role === "system" ? (
                  <div className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs">
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className={
                      "max-w-[80%] p-4 rounded-2xl " +
                      (msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : msg.id.startsWith("err-")
                        ? "bg-red-900/50 text-red-300 rounded-bl-none border border-red-500/30"
                        : "bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700")
                    }
                  >
                    {renderAssistant(msg.content)}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] p-4 rounded-2xl rounded-bl-none bg-zinc-900/80 border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-amber-400 animate-pulse" />
                  <div className="flex-1">
                    <div className="text-xs text-amber-400/70 mb-1 font-medium">
                      天道推演中
                    </div>
                    <motion.div
                      key={loadingText}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-zinc-300"
                    >
                      {loadingText}
                    </motion.div>
                  </div>
                  <Loader2 className="h-4 w-4 text-zinc-500 animate-spin flex-shrink-0" />
                </div>
                <div className="mt-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1 flex-1 rounded-full bg-amber-500/30"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {isLoading && !currentEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-800 p-4 rounded-2xl rounded-bl-none border border-zinc-700">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>天道推演中...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的行动或对话..."
            disabled={isLoading}
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-amber-500/50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {"修练 查看四周 吃药 逃跑".split(" ").map((cmd) => (
            <Button
              key={cmd}
              variant="outline"
              size="sm"
              onClick={() => setInput("/" + cmd)}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 whitespace-nowrap"
            >
              {"/" + cmd}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
