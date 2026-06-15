"use client";

import { cn } from "@/lib/utils";
import { MessageCircle, Package, User, ScrollText } from "lucide-react";
import { useGameStore } from "@/stores/game";

const tabs = [
  { id: "chat", label: "对话", icon: MessageCircle },
  { id: "backpack", label: "背包", icon: Package },
  { id: "stats", label: "属性", icon: User },
  { id: "codex", label: "图鉴", icon: ScrollText },
] as const;

export function MobileTabBar() {
  const { currentView, setCurrentView, phase, notifications } = useGameStore();
  const hasPlayer = phase === "PLAYING" || phase === "DEAD";

  return (
    <div className="md:hidden shrink-0 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const enabled = !(tab.id === "backpack" || tab.id === "stats" || tab.id === "codex") || hasPlayer;
          const active = currentView === tab.id;
          const notifCount = notifications[tab.id] || 0;

          return (
            <button
              key={tab.id}
              onClick={() => enabled && setCurrentView(tab.id as any)}
              disabled={!enabled}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors relative min-w-0",
                !enabled && "opacity-30",
                active
                  ? "text-amber-400"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] leading-tight">{tab.label}</span>
              {notifCount > 0 && !active && (
                <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
