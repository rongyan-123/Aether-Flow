"use client";

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { IPlayer, IChatMessage, JournalEntry, CodexEntry } from "@/types"

export interface GameState {
  // 单对话：只有一场修仙旅程
  player: IPlayer | null
  chatHistory: IChatMessage[]
  journal: JournalEntry[]
  codex: CodexEntry[]
  phase: "INIT" | "SELECT" | "PLAYING" | "DEAD"
  currentView: "chat" | "backpack" | "stats" | "settings" | "journal"
  isLoading: boolean
  currentEvent: string

  setPhase: (phase: GameState["phase"]) => void
  setPlayer: (player: IPlayer) => void
  updateStats: (stats: Partial<IPlayer["stats"]>) => void
  updateInventory: (inventory: IPlayer["inventory"]) => void
  addMessage: (msg: IChatMessage) => void
  addJournal: (entry: JournalEntry) => void
  addCodex: (entry: CodexEntry) => void
  clearHistory: () => void
  setCurrentView: (v: GameState["currentView"]) => void
  setLoading: (v: boolean) => void
  setCurrentEvent: (v: string) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      player: null,
      chatHistory: [],
      journal: [],
      codex: [],
      phase: "INIT",
      currentView: "chat",
      isLoading: false,
      currentEvent: "",

      setPhase: (phase) => set({ phase }),
      setPlayer: (player) => set({ player }),
      updateStats: (stats) => set((s) => ({
        player: s.player ? { ...s.player, stats: { ...s.player.stats, ...stats } as IPlayer["stats"] } : null,
      })),
      updateInventory: (inventory) => set((s) => ({
        player: s.player ? { ...s.player, inventory } : null,
      })),
      addCodex: (entry) => set((s) => ({ codex: [...s.codex, entry] })),
      addJournal: (entry) => set((s) => ({
        journal: [...s.journal, entry],
      })),
      addMessage: (msg) => set((s) => ({
        chatHistory: [...s.chatHistory, msg],
      })),
      clearHistory: () => set({ chatHistory: [] }),
      setCurrentView: (currentView) => set({ currentView }),
      setLoading: (isLoading) => set({ isLoading }),
      setCurrentEvent: (currentEvent) => set({ currentEvent }),
      resetGame: () => set({ player: null, chatHistory: [],
      journal: [], codex: [], phase: "INIT", currentView: "chat" }),
    }),
    {
      name: "xiuxian-game",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ player: s.player, chatHistory: s.chatHistory, phase: s.phase, journal: s.journal }),
    }
  )
)