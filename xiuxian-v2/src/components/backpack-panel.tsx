/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useGameStore } from '@/stores/game'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Gem, ScrollText, FlaskConical, Swords, Box } from 'lucide-react'

const GRADE_COLORS: Record<string, string> = {
  '天阶上品': 'text-amber-400 border-amber-500/50 bg-amber-500/10',
  '天阶中品': 'text-amber-300 border-amber-400/50 bg-amber-400/10',
  '天阶下品': 'text-amber-200 border-amber-300/50 bg-amber-300/10',
  '地阶上品': 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10',
  '地阶中品': 'text-emerald-300 border-emerald-400/50 bg-emerald-400/10',
  '地阶下品': 'text-emerald-200 border-emerald-300/50 bg-emerald-300/10',
  '玄阶上品': 'text-purple-400 border-purple-500/50 bg-purple-500/10',
  '玄阶中品': 'text-purple-300 border-purple-400/50 bg-purple-400/10',
  '玄阶下品': 'text-purple-200 border-purple-300/50 bg-purple-300/10',
  '黄阶上品': 'text-zinc-300 border-zinc-400/50 bg-zinc-400/10',
  '黄阶中品': 'text-zinc-300 border-zinc-400/50 bg-zinc-400/10',
  '黄阶下品': 'text-zinc-400 border-zinc-500/50 bg-zinc-500/10',
}

const TYPE_ICONS: Record<string, any> = {
  '丹药': FlaskConical,
  '法宝': Gem,
  '功法': ScrollText,
  '材料': Box,
  '杂物': Package,
  '特殊物品': Gem,
}

function getGradeClass(grade: string): string {
  return GRADE_COLORS[grade] || 'text-zinc-400 border-zinc-600/50 bg-zinc-600/10'
}

function getTypeIcon(type: string): any {
  return TYPE_ICONS[type] || Package
}

export function BackpackPanel() {
  const { setCurrentView, player } = useGameStore()
  const inventory = (player as any)?.inventory || []

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('chat')} className="text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-200 font-chinese">背包</h2>
        <span className="text-xs text-zinc-500 ml-auto">{inventory.length} 件物品</span>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
            <Package className="h-12 w-12" />
            <span className="italic">空空如也</span>
          </div>
        ) : (
          <div className="space-y-2">
            {inventory.map((item: any, index: number) => {
              const Icon = getTypeIcon(item.type)
              return (
                <div key={index} className={"p-3 rounded-lg border transition-colors hover:scale-[1.01] " + getGradeClass(item.grade)}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs opacity-60 mt-0.5">{item.type} · {item.grade}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold">x{item.count}</div>
                      {item.value > 0 && <div className="text-[10px] opacity-50">{item.value}灵石</div>}
                    </div>
                  </div>
                  {item.description && (
                    <div className="text-xs opacity-50 mt-1.5 leading-relaxed">{item.description}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
