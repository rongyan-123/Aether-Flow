/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useGameStore } from "@/stores/game";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText, MapPin, User, Package } from "lucide-react";

const typeLabels: Record<string, string> = {
  npc: "人物", location: "地点", item: "物品", sect: "宗门",
};

export function CodexPanel() {
  const { codex, setCurrentView } = useGameStore();

  const grouped: Record<string, any[]> = {};
  codex.forEach((e) => { if (!grouped[e.entry_type]) grouped[e.entry_type] = []; grouped[e.entry_type].push(e); });

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("chat")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-200 font-chinese">修仙图鉴</h2>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <ScrollText className="h-12 w-12 mb-4 opacity-50" />
            <p>暂无图鉴记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, entries]) => (
              <div key={type}>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">{typeLabels[type] || type} ({entries.length})</h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="p-3 rounded-xl border border-zinc-700 bg-zinc-900">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-zinc-200">{entry.name}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{entry.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}