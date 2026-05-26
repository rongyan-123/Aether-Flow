/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useGameStore } from '@/stores/game'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Heart, Droplets, Timer, Swords, User, Gem } from 'lucide-react'

const GRADE_DOT: Record<string, string> = {
  '天': 'bg-amber-400', '地': 'bg-emerald-400',
  '玄': 'bg-purple-400', '黄': 'bg-zinc-400',
}

export function StatusPanel() {
  const { player } = useGameStore()
  if (!player) return null
  const { stats: rawStats, inventory: rawInv } = player as any
  const stats = rawStats || {}
  const inventory = rawInv || []
  const hp = stats.hp || { current: 0, max: 100 }
  const mp = stats.mp || { current: 0, max: 50 }
  const age = stats.age || { current: 16, max: 100 }
  const spirit = stats.spirit || { value: 0, desc: 'unknown' }

  const hpPercent = hp.max > 0 ? (hp.current / hp.max) * 100 : 0
  const mpPercent = mp.max > 0 ? (mp.current / mp.max) * 100 : 0
  const agePercent = age.max > 0 ? (age.current / age.max) * 100 : 0
  const isLowHp = hpPercent < 30
  const isDying = agePercent < 10

  return (
    <div className="hidden lg:flex flex-col w-80 bg-zinc-950 border-l border-zinc-800 h-full">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-200 font-chinese flex items-center gap-2">
          <User className="h-5 w-5 text-zinc-400" />修仙面板
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{(player as any).name?.[0] || '?'}</span>
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-200">{(player as any).name || '无名'}</div>
                <div className="text-xs text-zinc-500">{stats.realm || ''}</div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1"><Heart className={isLowHp ? 'h-3 w-3 text-red-500 animate-pulse' : 'h-3 w-3 text-emerald-500'} />气血</span>
                <span className={isLowHp ? 'text-red-500 font-bold' : 'text-zinc-300'}>{hp.current}/{hp.max}</span>
              </div>
              <Progress value={hpPercent} className={isLowHp ? 'h-2 bg-red-900/50 [&>div]:bg-red-500 [&>div]:animate-pulse' : 'h-2 bg-zinc-800 [&>div]:bg-emerald-500'} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" />灵力</span>
                <span className="text-zinc-300">{mp.current}/{mp.max}</span>
              </div>
              <Progress value={mpPercent} className="h-2 bg-zinc-800 [&>div]:bg-blue-500" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1"><Timer className={isDying ? 'h-3 w-3 text-red-500 animate-pulse' : 'h-3 w-3 text-amber-500'} />寿元</span>
                <span className={isDying ? 'text-red-500 font-bold animate-pulse' : 'text-zinc-300'}>{age.current}/{age.max}年</span>
              </div>
              <Progress value={agePercent} className={isDying ? 'h-2 bg-red-900/50 [&>div]:bg-red-500 [&>div]:animate-pulse' : 'h-2 bg-zinc-800 [&>div]:bg-amber-500'} />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">属性</h4>
            <div className="grid grid-cols-2 gap-2">
              
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800"><Droplets className="h-4 w-4 text-purple-400" /><div><div className="text-[10px] text-zinc-500">神识</div><div className="text-sm font-bold text-zinc-200">{spirit.value}</div></div></div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">背包</h4>
            <div className="space-y-1">
              {inventory.length === 0 ? (
                <div className="text-xs text-zinc-600 italic p-2">空空如也</div>
              ) : inventory.slice(0, 5).map((item: any, index: number) => {
                const tier = item.grade?.[0] || '黄'
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className={"w-2 h-2 rounded-full " + (GRADE_DOT[tier] || 'bg-zinc-500')} />
                      <span className="text-xs text-zinc-300">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">x{item.count}</span>
                  </div>
                )
              })}
              {inventory.length > 5 && <div className="text-[10px] text-zinc-600 text-center pt-1">+{inventory.length - 5} 件物品</div>}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
