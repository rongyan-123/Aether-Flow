import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { IPlayer, IChatMessage } from '@/types'

type GamePhase = 'INIT' | 'SELECT' | 'PLAYING' | 'DEAD'

interface GameState {
  // 状态
  phase: GamePhase
  player: IPlayer | null
  chatHistory: IChatMessage[]
  isLoading: boolean
  currentEvent: string // 当前层事件描述
  currentView: 'chat' | 'backpack' | 'stats'
  
  // 动作
  setPhase: (phase: GamePhase) => void
  setPlayer: (player: IPlayer) => void
  updateStats: (stats: Partial<IPlayer['stats']>) => void
  updateInventory: (inventory: IPlayer['inventory']) => void
  addMessage: (message: IChatMessage) => void
  clearHistory: () => void
  setLoading: (loading: boolean) => void
  setCurrentEvent: (event: string) => void
  setCurrentView: (view: 'chat' | 'backpack' | 'stats') => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      phase: 'INIT',
      player: null,
      chatHistory: [],
      isLoading: false,
      currentEvent: '',
  currentView: 'chat' as 'chat' | 'backpack' | 'stats',
      
      setPhase: (phase) => set({ phase }),
      
      setPlayer: (player) => set({ player }),
      
      updateStats: (stats) => set((state) => ({
        player: state.player ? {
          ...state.player,
          stats: { ...state.player.stats, ...stats }
        } : null
      })),
      
      updateInventory: (inventory) => set((state) => ({
        player: state.player ? {
          ...state.player,
          inventory
        } : null
      })),
      
      addMessage: (message) => set((state) => ({
        chatHistory: [...state.chatHistory, message]
      })),
      
      clearHistory: () => set({ chatHistory: [] }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setCurrentEvent: (event) => set({ currentEvent: event }),
      setCurrentView: (view) => set({ currentView: view })
    }),
    {
      name: 'xiuxian-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        player: state.player,
        phase: state.phase,
        chatHistory: state.chatHistory,
        currentView: state.currentView
      })
    }
  )
)
