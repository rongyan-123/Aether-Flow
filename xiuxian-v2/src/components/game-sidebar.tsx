'use client'

import { useState } from 'react'

import { useGameStore } from '@/stores/game'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Backpack, 
  User, 
  Map, 
  BookOpen, 
  Settings,
  Menu,
  X
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const routes = [
  {
    label: '对话',
    icon: MessageCircle,
    view: 'chat' as const,
  },
  {
    label: '背包',
    icon: Backpack,
    view: 'backpack' as const,
  },
  {
    label: '属性',
    icon: User,
    view: 'stats' as const,
  },
  {
    label: '地图',
    icon: Map,
    view: 'chat' as const,
  },
  {
    label: '功法',
    icon: BookOpen,
    view: 'chat' as const,
  },
  {
    label: '设置',
    icon: Settings,
    view: 'chat' as const,
  },
]

export function GameSidebar() {
  const { currentView, setCurrentView } = useGameStore()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 移动端汉堡菜单 */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger>
            <Button variant="ghost" size="icon" className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-zinc-950 border-r border-zinc-800 w-72">
            <div className="flex flex-col h-full">
              <div className="p-6 flex items-center justify-between border-b border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-200 font-chinese">修仙系统</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5 text-zinc-400" />
                </Button>
              </div>
              <ScrollArea className="flex-1 py-4">
                <div className="space-y-1 px-3">
                  {routes.map((route) => (
                    <button
                      key={route.view}
                      onClick={() => { setCurrentView(route.view); setIsOpen(false); }}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                        currentView === route.view 
                          ? "bg-zinc-800/50 text-zinc-200" 
                          : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"
                      )}
                    >
                      <route.icon className="h-5 w-5" />
                      <span className="font-medium">{route.label}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex flex-col w-72 bg-zinc-950 border-r border-zinc-800 h-full">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold font-chinese">仙</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-200 font-chinese">修仙模拟器</h1>
              <p className="text-xs text-zinc-500">Xiuxian Simulator</p>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-1 px-3">
            {routes.map((route) => (
              <button
                key={route.view}
                onClick={() => setCurrentView(route.view)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                  currentView === route.view 
                    ? "bg-zinc-800/50 text-zinc-200" 
                    : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"
                )}
              >
                <route.icon className="h-5 w-5" />
                <span className="font-medium">{route.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-sm text-zinc-300">测</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">测试账号</p>
              <p className="text-xs text-zinc-500 truncate">在线</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
