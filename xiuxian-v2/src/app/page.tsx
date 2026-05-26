"use client";

import { GameSidebar } from "@/components/game-sidebar"
import { ChatPanel } from "@/components/chat-panel"
import { StatusPanel } from "@/components/status-panel"
import { InitScreen } from "@/components/init-screen"
import { SelectScreen } from "@/components/select-screen"
import { SettingsPanel } from "@/components/settings-panel"
import { BackpackPanel } from "@/components/backpack-panel"
import { StatsDetailPanel } from "@/components/stats-panel"
import { useGameStore } from "@/stores/game"
import { useState, useEffect } from "react"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { currentView, phase } = useGameStore()
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <main className="flex h-screen overflow-hidden bg-zinc-950">      <GameSidebar />
      <div className="flex-1 flex-col relative overflow-hidden">        {currentView === "settings" && <SettingsPanel />}
        {currentView === "backpack" && <BackpackPanel />}
        {currentView !== "settings" && currentView !== "backpack" && phase === "INIT" && <InitScreen />}
        {phase === "SELECT" && <SelectScreen />}
        {phase === "PLAYING" && currentView === "chat" && <ChatPanel />}
        {phase === "PLAYING" && currentView === "stats" && <StatsDetailPanel />}
        {phase === "DEAD" && <div className="flex items-center justify-center h-full text-red-500 text-2xl font-chinese">小元已尽</div>}
      </div>      {phase === "PLAYING" && <StatusPanel />}
    </main>
  )
}