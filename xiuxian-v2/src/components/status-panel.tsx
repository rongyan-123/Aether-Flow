'use client'

import { useGameStore } from '@/stores/game'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { Heart, Droplets, Wind, Timer, Swords, User, MapPin } from 'lucide-react'

export function StatusPanel() {
  const { player } = useGameStore()
  
  if (!player) return null
  
  const { stats, inventory } = player
  
  const hpPercent = (stats.hp.current / stats.hp.max) * 100
  const mpPercent = (stats.mp.current / stats.mp.max) * 100
  const agePercent = (stats.age.current / stats.age.max) * 100
  
  const isLowHp = hpPercent < 30
  const isDying = agePercent < 10

  return (
    <div className="hidden lg:flex flex-col w-80 bg-zinc-950 border-l border-zinc-800 h-full">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-200 font-chinese flex items-center gap-2">
          <User className="h-5 w-5 text-zinc-400" />
          修仙面板
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* 基础信息 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">仙</span>
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-200">{player.name || '无名'}</div>
                <div className="text-xs text-zinc-500">{stats.realm}</div>
              </div>
            </div>
          </div>

          {/* 状态条 */}
          <div className="space-y-4">
            {/* 气血 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Heart className={isLowHp ? 'h-3 w-3 text-red-500 animate-pulse' : 'h-3 w-3 text-emerald-500'} />
                  气血
                </span>
                <span className={isLowHp ? 'text-red-500 font-bold' : 'text-zinc-300'}>
                  {stats.hp.current}/{stats.hp.max}
                </span>
              </div>
              <Progress 
                value={hpPercent} 
                className={isLowHp ? 'h-2 bg-red-900/50 [&>div]:bg-red-500 [&>div]:animate-pulse' : 'h-2 bg-zinc-800 [&>div]:bg-emerald-500'}
                
              />
            </div>

            {/* 灵力 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-blue-500" />
                  灵力
                </span>
                <span className="text-zinc-300">{stats.mp.current}/{stats.mp.max}</span>
              </div>
              <Progress value={mpPercent} className="h-2 bg-zinc-800 [&>div]:bg-blue-500"  />
            </div>

            {/* 寿元 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Timer className={isDying ? 'h-3 w-3 text-red-500 animate-heartbeat' : 'h-3 w-3 text-amber-500'} />
                  寿元
                </span>
                <span className={isDying ? 'text-red-500 font-bold animate-pulse' : 'text-zinc-300'}>
                  {stats.age.current}/{stats.age.max}年
                </span>
              </div>
              <Progress 
                value={agePercent} 
                className={isDying ? 'h-2 bg-red-900/50 [&>div]:bg-red-500 [&>div]:animate-pulse' : 'h-2 bg-zinc-800 [&>div]:bg-amber-500'} 
                
              />
            </div>
          </div>

          {/* 详细属性 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">属性</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <Swords className="h-4 w-4 text-red-400" />
                <div>
                  <div className="text-[10px] text-zinc-500">战力</div>
                  <div className="text-sm font-bold text-zinc-200">{stats.combat_power}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <Wind className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-[10px] text-zinc-500">神识</div>
                  <div className="text-sm font-bold text-zinc-200">{stats.spirit.value}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 背包快览 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">背包</h4>
            <div className="space-y-1">
              {inventory.length === 0 ? (
                <div className="text-xs text-zinc-600 italic p-2">空空如也</div>
              ) : (
                inventory.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
                        <span className="text-[10px] text-zinc-400">{item.type === '丹药' ? '丹' : '物'}</span>
                      </div>
                      <span className="text-xs text-zinc-300">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">x{item.count}</span>
                  </div>
                ))
              )}
              {inventory.length > 5 && (
                <div className="text-[10px] text-zinc-600 text-center pt-1">
                  +{inventory.length - 5} 件物品
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
