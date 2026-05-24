'use client'

import { GameSidebar } from '@/components/game-sidebar'
import { ChatPanel } from '@/components/chat-panel'
import { StatusPanel } from '@/components/status-panel'
import { InitScreen } from '@/components/init-screen'
import { SelectScreen } from '@/components/select-screen'
import { useGameStore } from '@/stores/game'

export default function Home() {
  const { phase, currentView } = useGameStore()

  return (
    <main className="flex h-screen overflow-hidden bg-zinc-950">
      {/* 左侧面板：导航与菜单 */}
      <GameSidebar />
      
      {/* 中间主区域 */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {phase === 'INIT' && <InitScreen />}
        {phase === 'SELECT' && <SelectScreen />}
        {phase === 'PLAYING' && currentView === 'chat' && <ChatPanel />}
        {phase === 'PLAYING' && currentView === 'backpack' && <div className="flex items-center justify-center h-full text-zinc-400 font-chinese">???????...</div>}
        {phase === 'PLAYING' && currentView === 'stats' && <div className="flex items-center justify-center h-full text-zinc-400 font-chinese">???????...</div>}
        {phase === 'DEAD' && <div className="flex items-center justify-center h-full text-red-500 text-2xl font-chinese">寿元已尽，道友陨落</div>}
      </div>
      
      {/* 右侧面板：属性与背包 */}
      {phase === 'PLAYING' && <StatusPanel />}
    </main>
  )
}
