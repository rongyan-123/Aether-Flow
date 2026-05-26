/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/game'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
// removed unused import

type Template = {
  id: string
  name: string
  description: string
  stats: Record<string, string>
}

const templates: Template[] = [
  { id: 'wudang', name: '武当山弟子', description: '名门正派，道法自然，擅长以柔克刚', stats: { spiritual_root: '先天木灵根', alignment: '正道', sect: '武当派' } },
  { id: 'modao', name: '魔道散修', description: '亦正亦邪，为求大道不择手段', stats: { spiritual_root: '变异暗灵根', alignment: '魔道', sect: '无' } },
  { id: 'yaohu', name: '青丘狐妖', description: '妖族异类，天生魅惑，修行艰难', stats: { spiritual_root: '天道魅灵根', alignment: '中立', sect: '青丘' } },
]


function getLLMConfig() {
  try { return JSON.parse(localStorage.getItem('xiuxian-llm-config') || '{}') } catch { return {} }
}
export function SelectScreen() {
  const { setPhase, updateStats, setPlayer, addMessage, setLoading, setCurrentEvent, player } = useGameStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLocalLoading] = useState(false)
  const active = { player }

  const getCardClass = (id: string) => {
    const base = 'p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105'
    if (selected === id) return base + ' border-amber-500 bg-zinc-800/80 shadow-lg shadow-amber-500/20'
    return base + ' border-zinc-700 bg-zinc-900 hover:bg-zinc-800/50'
  }

  const handleSelect = async () => {
    if (!selected || loading || !active?.player) return
    const template = templates.find(t => t.id === selected)
    if (!template) return

    updateStats(template.stats as any)
    if (active.player) {
      setPlayer({ ...active.player, stats: { ...active.player.stats, ...template.stats } } as any)
    }
    setPhase('PLAYING')
    setLocalLoading(true)
    setLoading(true)

    addMessage({ id: 'sys-' + Date.now(), role: 'system', content: '已选择出身: ' + template.name, timestamp: Date.now() })

    try {
      const res = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llmConfig: getLLMConfig(), 
          input: '\u73a9\u5bb6\u9009\u62e9\u4e86\u003a\u0020' + template.name + ' - ' + template.description + '\n\n\u80cc\u666f\u003a\u0020' + template.description,
          playerId: active.player?.id || String(Date.now()),
          mode: 'prepare'
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        let errMsg = '请求失败 (' + res.status + ')'
        try { errMsg = JSON.parse(errBody).error || errMsg } catch {}
        addMessage({ id: 'err-' + Date.now(), role: 'assistant', content: errMsg, timestamp: Date.now() })
        return
      }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEventName = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventName = line.slice(7)
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (currentEventName === 'reply') {
              const parsed = JSON.parse(data)
              if (parsed.reply) {
                addMessage({ id: 'ai-' + Date.now(), role: 'assistant', content: parsed.reply, timestamp: Date.now() })
              }
              if (parsed.player) setPlayer(parsed.player)
            } else if (currentEventName === 'step') {
              setCurrentEvent(JSON.parse(data).label)
            } else if (currentEventName === 'error') {
              addMessage({ id: 'err-' + Date.now(), role: 'assistant', content: JSON.parse(data).message, timestamp: Date.now() })
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err)
      addMessage({ id: 'err-' + Date.now(), role: 'assistant', content: '[Connection Error] ' + (err instanceof Error ? err.message : String(err)), timestamp: Date.now() })
    } finally {
      setLocalLoading(false)
      setLoading(false)
      setCurrentEvent('')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-zinc-950 to-zinc-900 p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-zinc-200 font-chinese tracking-wider">天 命 抉 择</h1>
          <p className="text-zinc-400">选择你心仪的出身与资质，踏上修仙之路</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} onClick={() => !loading && setSelected(template.id)} className={getCardClass(template.id)}>
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
          <Button onClick={handleSelect} disabled={!selected || loading} className="px-8 py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-lg">
            {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />天道推演中...</> : '确认选择'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
