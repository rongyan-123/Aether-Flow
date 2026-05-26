/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useGameStore } from "@/stores/game";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, BookOpen } from "lucide-react";

export function JournalPanel() {
  const { journal, setCurrentView } = useGameStore();

  const typeColors: Record<string, string> = {
    story_start: "border-amber-500/50 bg-amber-500/10",
    major_twist: "border-red-500/50 bg-red-500/10",
    story_end: "border-blue-500/50 bg-blue-500/10",
    general: "border-zinc-500/50 bg-zinc-500/10",
  };

  const typeLabels: Record<string, string> = {
    story_start: "故事开始",
    major_twist: "重大转折",
    story_end: "故事结束",
    general: "记录",
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("chat")} className="text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-200 font-chinese">修仙日志</h2>
      </div>
      <div className="flex-1 p-4">
        {journal.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <BookOpen className="h-12 w-12 mb-4 opacity-50" />
            <p>暂无日志记录</p>
            <p className="text-sm mt-2">AI会在故事开始、重大转折、故事结束时自动记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journal.map((entry) => (
              <div key={entry.id} className="p-4 rounded-xl border border-zinc-700 bg-zinc-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-zinc-200">{entry.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {typeLabels[entry.entry_type] || typeLabels.general}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                <div className="text-xs text-zinc-600 mt-2">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
