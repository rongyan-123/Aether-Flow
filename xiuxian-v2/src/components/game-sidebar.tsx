/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Menu, RotateCcw, MessageCircle, Package, User, Settings, BookOpen, ScrollText } from 'lucide-react'
import { useGameStore } from '@/stores/game'

const navItems = [
  { id: 'chat', label: '对话', icon: MessageCircle, requiresPlayer: false },
  { id: 'backpack', label: '背包', icon: Package, requiresPlayer: true },
  { id: 'stats', label: '属性', icon: User, requiresPlayer: true },
  { id: 'journal', label: '日志', icon: BookOpen, requiresPlayer: true },
  { id: 'codex', label: '图鉴', icon: ScrollText, requiresPlayer: true },
  { id: 'settings', label: '设置', icon: Settings, requiresPlayer: false },
]

export function GameSidebar() {
  const { currentView, setCurrentView, phase, resetGame, player, notifications } = useGameStore()
  const [open, setOpen] = useState(false)
  const hasPlayer = phase === 'PLAYING' || phase === 'DEAD'
  const name = (player as any)?.name || '无名'

  const handleRestart = async () => {
    if (!window.confirm('确定要结束当前修仙之旅，重新开始吗？')) return;
    // Clean server-side data (DB + vectors)
    if ((player as any)?.id) {
      try {
        await fetch('/api/game', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: (player as any).id }),
        });
      } catch (e) { console.error('Cleanup failed:', e); }
    }
    resetGame();
  }

  return (
    <>
      <div className='md:hidden fixed top-4 left-4 z-50'>
        <button onClick={() => setOpen(!open)} className='inline-flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 h-10 w-10'>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className='hidden md:flex flex-col w-72 bg-zinc-950 border-r border-zinc-800 h-full'>
        <div className='p-4 border-b border-zinc-800'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center'>
              <span className="text-white text-base font-bold font-chinese">仙</span>
            </div>
            <h1 className="text-lg font-bold text-zinc-200 font-chinese">修仙模拟器</h1>
          </div>
        </div>

        {name !== '无名' && (
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="text-xs text-zinc-500 mb-1">当前角色</div>
            <div className="text-sm font-medium text-zinc-200">{name}</div>
          </div>
        )}

        <div className="flex-1 overflow-auto py-2">
          <div className="px-3 py-2">
            {navItems.map((item) => {
              const enabled = !item.requiresPlayer || hasPlayer
              return (
                <button key={item.id} onClick={() => enabled && setCurrentView(item.id as any)} disabled={!enabled} className={cn('flex items-center gap-4 px-4 py-3 rounded-lg transition-colors w-full text-left relative', !enabled && 'opacity-30 cursor-not-allowed', enabled && currentView === item.id && 'bg-zinc-800/50 text-zinc-200', enabled && currentView !== item.id && 'text-zinc-400 hover:bg-zinc-800/30')}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {(notifications[item.id] || 0) > 0 && currentView !== item.id && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {notifications[item.id] > 99 ? '99+' : notifications[item.id]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-3 border-t border-zinc-800">
          {hasPlayer && (
            <button onClick={handleRestart} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-red-700 text-red-400 hover:border-red-500 hover:text-red-300 transition-colors">
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">重新开始</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}