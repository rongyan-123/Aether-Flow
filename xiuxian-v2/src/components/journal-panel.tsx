/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react";
import { useGameStore } from "@/stores/game";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, MessageCircle, CheckCircle, AlertTriangle, Bug } from "lucide-react";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "success", label: "成功经验" },
  { key: "failure", label: "失败教训" },
  { key: "pitfall", label: "踩坑点" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const FILTER_ENTRY_TYPES: Record<string, string[]> = {
  success: ["success"],
  failure: ["failure"],
  pitfall: ["pitfall"],
};

const typeConfig: Record<string, { label: string; color: string; icon?: any }> = {
  story_start: { label: "故事开始", color: "border-amber-500/50 bg-amber-500/10 text-amber-400" },
  major_twist: { label: "重大转折", color: "border-red-500/50 bg-red-500/10 text-red-400" },
  story_end: { label: "故事结束", color: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
  general: { label: "记录", color: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400" },
  success: { label: "成功经验", color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400", icon: CheckCircle },
  failure: { label: "失败教训", color: "border-orange-500/50 bg-orange-500/10 text-orange-400", icon: AlertTriangle },
  pitfall: { label: "踩坑点", color: "border-purple-500/50 bg-purple-500/10 text-purple-400", icon: Bug },
};

function getTypeLabel(type: string) {
  return typeConfig[type]?.label || typeConfig.general.label;
}

function getTypeColor(type: string) {
  return typeConfig[type]?.color || typeConfig.general.color;
}

export function JournalPanel() {
  const { journal, setCurrentView, setPendingInput } = useGameStore();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = filter === "all"
    ? journal
    : journal.filter((entry) => FILTER_ENTRY_TYPES[filter]?.includes(entry.entry_type));

  const handleChatClick = (content: string) => {
    setPendingInput(content);
    setCurrentView("chat");
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("chat")} className="text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-200 font-chinese">修仙日志</h2>
      </div>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-zinc-800">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 " +
                (active
                  ? "bg-amber-500/20 border border-amber-500 text-amber-300"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <BookOpen className="h-12 w-12 mb-4 opacity-50" />
            <p>{filter === "all" ? "暂无日志记录" : "该分类下暂无记录"}</p>
            {filter === "all" && (
              <p className="text-sm mt-2">AI会在故事开始、重大转折、故事结束时自动记录</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((entry) => (
              <div key={entry.id} className="p-4 rounded-xl border border-zinc-700 bg-zinc-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-zinc-200">{entry.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(entry.entry_type)}`}>
                    {getTypeLabel(entry.entry_type)}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-zinc-600">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChatClick(entry.content)}
                    className="h-7 px-2 text-xs text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 gap-1"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    聊这个
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
