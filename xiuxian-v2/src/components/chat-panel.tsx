'use client'

import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '@/stores/game'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import { marked } from 'marked'
import { IChatMessage } from '@/types'

export function ChatPanel() {
  const { chatHistory, addMessage, isLoading, setLoading, player } = useGameStore()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !player) return
    const userMessage: IChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    }
    addMessage(userMessage)
    const currentInput = input
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: currentInput, playerId: player.id })
      })
      const data = await res.json()
      if (data.reply) {
        const aiMessage: IChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now()
        }
        addMessage(aiMessage)
      }
      if (data.player) {
        useGameStore.getState().setPlayer(data.player)
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-200 font-chinese">天机推演</h2>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          <AnimatePresence>
            {chatHistory.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={"max-w-[80%] p-4 rounded-2xl " +
                    (msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700')
                  }
                >
                  <div
                    className="prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-800 p-4 rounded-2xl rounded-bl-none border border-zinc-700">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>天道推演中...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的行动或对话..."
            disabled={isLoading}
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-amber-500/50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {['/修炼', '/查看四周', '/吃药', '/逃跑'].map((cmd) => (
            <Button
              key={cmd}
              variant="outline"
              size="sm"
              onClick={() => setInput(cmd)}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 whitespace-nowrap"
            >
              {cmd}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
