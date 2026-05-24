'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/game'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

type Template = {
  id: string
  name: string
  description: string
  background: string
  stats: Record<string, string>
}

const templates: Template[] = [
  {
    id: 'wudang',
    name: '武当山弟子',
    description: '名门正派，道法自然，擅长以柔克刚',
    background: '你出身于武当山，自幼修习道家心法，性格沉稳...',
    stats: { spiritual_root: '先天木灵根', alignment: '正道', sect: '武当派' }
  },
  {
    id: 'modao',
    name: '魔道散修',
    description: '亦正亦邪，为求大道不择手段',
    background: '你本是孤儿，偶得魔道功法，从此踏入一条血腥之路...',
    stats: { spiritual_root: '变异暗灵根', alignment: '魔道', sect: '无' }
  },
  {
    id: 'yaohu',
    name: '青丘狐妖',
    description: '妖族异类，天生魅惑，修行艰难',
    background: '你化形于青丘，作为异类在人间行走...',
    stats: { spiritual_root: '天道魅灵根', alignment: '中立', sect: '青丘' }
  }
]

export function SelectScreen() {
  const { setPhase, updateStats } = useGameStore()
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = () => {
    if (!selected) return
    const template = templates.find(t => t.id === selected)
    if (template) {
      updateStats(template.stats as any)
      setPhase('PLAYING')
    }
  }

  const getCardClass = (id: string) => {
    const base = 'p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105'
    if (selected === id) {
      return base + ' border-amber-500 bg-zinc-800/80 shadow-lg shadow-amber-500/20'
    }
    return base + ' border-zinc-700 bg-zinc-900 hover:bg-zinc-800/50'
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-zinc-950 to-zinc-900 p-4"
    >
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-zinc-200 font-chinese tracking-wider">天 命 抉 择</h1>
          <p className="text-zinc-400">选择你心仪的出身与资质，踏上修仙之路</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div 
              key={template.id}
              onClick={() => setSelected(template.id)}
              className={getCardClass(template.id)}
            >
              <h3 className="text-xl font-bold text-zinc-200 mb-2 font-chinese">{template.name}</h3>
              <p className="text-zinc-400 text-sm mb-4 h-12">{template.description}</p>
              <div className="text-xs text-zinc-500 space-y-1">
                <div>灵根: <span className="text-emerald-400">{template.stats.spiritual_root}</span></div>
                <div>阵营: <span className="text-amber-400">{template.stats.alignment}</span></div>
                <div>宗门: <span className="text-blue-400">{template.stats.sect}</span></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={handleSelect}
            disabled={!selected}
            className="px-8 py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg"
          >
            确认选择
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
