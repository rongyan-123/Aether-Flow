"use client";
/* eslint-disable react-hooks/purity */

import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/stores/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Brain, RefreshCw } from "lucide-react";
import { marked } from "marked";
import { IChatMessage } from "@/types";

const LOADING_POEMS = [
  "天上白玉京，十二楼五城。\n仙人抚我顶，结发受长生。",
  "大鹏一日同风起，扶摇直上九万里。",
  "仰天大笑出门去，我辈岂是蓬蒿人。",
  "十步杀一人，千里不留行。\n事了拂衣去，深藏身与名。",
  "满堂花醉三千客，一剑霜寒十四州。",
  "大道无形，生育天地。\n大道无情，运行日月w。大道无名，长养万物。",
  "天地不仁，以万物为刍狗。",
  "他日我若为青帝，报与桃花一处开。",
  "长风破浪会有时，直挂云帆济沧海。",
  "天生我材必有用，千金散尽还复来。",
  "且放白鹿青崖间，须行即骑访名山。",
  "待到秋来九月八，我花开后百花杀。",
  "古今多少事，都付笑谈中。",
  "我本楚狂人，凤歌笑孔丘。",
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
    removeMessage,
    isLoading,
    setLoading,
    player,
    chatHistory,
    phase,
    addNotification,
  } = useGameStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const active = { player, phase } as any;

  // chatHistory from store
  // player already from store
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [poemIndex, setPoemIndex] = useState(0);

  // Auto-scroll to bottom when new messages or step logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, stepLogs]);

  // Reset step logs on new send
  useEffect(() => {
    if (isLoading) {
      setStepLogs([]);
      setStreamingText("");
      setPoemIndex(Math.floor(Math.random() * LOADING_POEMS.length));
    }
  }, [isLoading]);

  // 诗歌轮播：等待AI时每4秒换一句
  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setPoemIndex((prev) => (prev + 1) % LOADING_POEMS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isLoading]);

  /** 添加错误消息，如果上一条已经是错误则替换掉 */
  const addErrorMessage = (text: string, userInput: string) => {
    const msgs = useGameStore.getState().chatHistory;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.error) {
      removeMessage(lastMsg.id);
    }
    addMessage({
      id: "err-" + Date.now(),
      role: "assistant",
      content: text,
      timestamp: Date.now(),
      error: true,
      userInput,
    });
  };

  /** 检测文本是否像是一条错误消息 */
  const isErrorLike = (text: string) => {
    if (!text) return false;
    const head = text.substring(0, 100);
    return (
      /\[Server Error\]|\[Connection Error\]|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(
        head,
      ) ||
      /^\s*\{.*"error"/i.test(head) ||
      /\b(Error|404|500|502|503|401|403)\b/i.test(head)
    );
  };

  const doSend = async (text: string, skipUserMessage?: boolean) => {
    if (!text.trim() || isLoading || !player || !active) return;
    if (!skipUserMessage) {
      addMessage({
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      });
    }
    setLoading(true);

    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          playerId: player?.id || String(Date.now()),
          playerName: player?.name || "无名",
          llmConfig: getLLMConfig(),
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        let errMsg = "请求失败 (" + res.status + ")";
        try {
          errMsg = JSON.parse(errBody).error || errMsg;
        } catch {}
        addErrorMessage(errMsg, text);
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
            if (currentEventName === "text-delta") {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setStreamingText((prev) => prev + parsed.content);
              }
            } else if (currentEventName === "reply") {
              const parsed = JSON.parse(data);
              if (parsed.reply) {
                if (isErrorLike(parsed.reply)) {
                  addErrorMessage(parsed.reply, text);
                } else {
                  addMessage({
                    id: "ai-" + Date.now(),
                    role: "assistant",
                    content: parsed.reply,
                    timestamp: Date.now(),
                  });
                }
              }
              setStreamingText("");
              if (parsed.player)
                useGameStore.getState().setPlayer(parsed.player);
              if (parsed.deltas?.addedItems || parsed.deltas?.reducedItems)
                addNotification("backpack");
            } else if (currentEventName === "codex") {
              const ce = JSON.parse(data);
              useGameStore.getState().addCodex({
                id: "c-" + Date.now(),
                name: ce.name,
                entry_type: ce.entry_type || "general",
                description: ce.description || "",
                metadata: ce.metadata || {},
                timestamp: ce.timestamp || Date.now(),
              });
              addNotification("codex");
            } else if (currentEventName === "journal") {
              const je = JSON.parse(data);
              useGameStore.getState().addJournal({
                id: "j-" + Date.now(),
                title: je.title,
                content: je.content,
                entry_type: je.entry_type || "general",
                timestamp: je.timestamp || Date.now(),
              });
              addNotification("journal");
            } else if (currentEventName === "step") {
              setStepLogs((prev) => [...prev, JSON.parse(data).label]);
            } else if (currentEventName === "error") {
              addErrorMessage(JSON.parse(data).message, text);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      addErrorMessage("[Connection Error] " + errMsg, text);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput("");
    await doSend(currentInput);
  };

  const handleRetry = async (errorMsgId: string) => {
    const msgs = useGameStore.getState().chatHistory;
    const errorMsg = msgs.find((m) => m.id === errorMsgId);
    if (!errorMsg?.userInput) return;
    removeMessage(errorMsgId);
    await doSend(errorMsg.userInput, true);
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
      <div className="px-4 py-2.5 md:py-4 border-b border-zinc-800 safe-area-top">
        <h2 className="text-sm md:text-lg font-semibold text-zinc-200 font-chinese">
          天机推演
        </h2>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
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
                      "max-w-[88%] md:max-w-[80%] p-3 md:p-4 rounded-2xl " +
                      (msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : msg.error
                        ? "bg-red-900/50 text-red-300 rounded-bl-none border border-red-500/30"
                        : "bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700")
                    }
                  >
                    {renderAssistant(msg.content)}
                    {msg.error && (
                      <button
                        onClick={() => handleRetry(msg.id)}
                        disabled={isLoading}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800/40 border border-red-500/40 text-red-200 hover:bg-red-700/50 hover:text-red-100 transition-colors text-xs disabled:opacity-50"
                      >
                        <RefreshCw className="h-3 w-3" />
                        重新发送
                      </button>
                    )}
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
              <div className="max-w-[95%] md:max-w-[90%] p-3 md:p-4 rounded-2xl rounded-bl-none bg-zinc-900/95 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400/80 font-medium">
                    天道推演
                  </span>
                  <Loader2 className="h-3 w-3 text-zinc-500 animate-spin ml-auto" />
                </div>
                {/* 诗歌轮播 */}
                {stepLogs.length === 0 && (
                  <motion.div
                    key={poemIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-sm text-amber-300/80 leading-relaxed whitespace-pre-line text-center py-2 font-chinese"
                  >
                    {LOADING_POEMS[poemIndex]}
                  </motion.div>
                )}
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {stepLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className={
                        "text-xs " +
                        (log.includes("[Node]")
                          ? "text-amber-400 mt-1"
                          : log.includes("Executed")
                          ? "text-emerald-400"
                          : log.includes("failed") || log.includes("Failed")
                          ? "text-red-400"
                          : log.includes("Done")
                          ? "text-emerald-300"
                          : "text-zinc-400")
                      }
                    >
                      <span className="text-zinc-600 mr-1 select-none">▸</span>
                      {log}
                    </motion.div>
                  ))}
                </div>
                {stepLogs.length > 0 &&
                  !stepLogs[stepLogs.length - 1]?.includes("Done") && (
                    <div className="mt-2 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-0.5 flex-1 rounded-full bg-emerald-500/30"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.25,
                          }}
                        />
                      ))}
                    </div>
                  )}
                {streamingText && (
                  <div className="mt-3 p-3 rounded-lg bg-zinc-800/50 border border-emerald-500/10 text-sm text-zinc-300 leading-relaxed max-h-48 overflow-y-auto">
                    <span className="text-xs text-emerald-400/60 mr-1">▸</span>
                    {streamingText}
                    <span className="inline-block w-1.5 h-4 bg-emerald-400/70 ml-0.5 animate-pulse align-middle" />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="p-2 md:p-4 border-t border-zinc-800 bg-zinc-900/50 safe-area-bottom">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的行动或对话..."
            disabled={isLoading}
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 text-sm md:text-base h-9 md:h-10 focus:ring-2 focus:ring-amber-500/50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 md:h-10 md:w-auto p-0 md:px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-1.5 md:mt-2 flex gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {"修练 查看四周 吃药 逃跑".split(" ").map((cmd) => (
            <Button
              key={cmd}
              variant="outline"
              size="sm"
              onClick={() => setInput("/" + cmd)}
              className="text-xs md:text-sm py-1 px-2.5 md:px-3 h-7 md:h-8 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 whitespace-nowrap shrink-0"
            >
              {"/" + cmd}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
