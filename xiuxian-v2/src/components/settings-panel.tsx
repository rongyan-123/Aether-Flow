'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/game'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Check } from 'lucide-react'

type LLMProvider = {
  id: string
  name: string
  baseUrl: string
  models: { id: string; name: string }[]
}

const providers: LLMProvider[] = [
  {
    id: 'doubao',
    name: '豆包 (Volcengine)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-1.5-pro-256k', name: 'Doubao 1.5 Pro 256K' },
      { id: 'doubao-1.5-lite-32k', name: 'Doubao 1.5 Lite 32K' },
      { id: 'doubao-pro-256k', name: 'Doubao Pro 256K' },
      { id: 'doubao-lite-128k', name: 'Doubao Lite 128K' },
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
    ]
  },
  {
    id: 'qwen',
    name: '通义千问 (Qwen)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-max', name: 'Qwen Max' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    ]
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    models: []
  },
]

type LLMConfig = {
  providerId: string
  apiKey: string
  baseUrl: string
  modelId: string
  customModel: string
}

const STORAGE_KEY = 'xiuxian-llm-config'

function loadConfig(): LLMConfig {
  if (typeof window === 'undefined') return { providerId: 'doubao', apiKey: '', baseUrl: providers[0].baseUrl, modelId: '', customModel: '' }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { providerId: 'doubao', apiKey: '', baseUrl: providers[0].baseUrl, modelId: '', customModel: '' }
}

export function SettingsPanel() {
  const { setCurrentView } = useGameStore()
  const [config, setConfig] = useState<LLMConfig>(loadConfig)
  const [saved, setSaved] = useState(false)

  const provider = providers.find(p => p.id === config.providerId) || providers[0]

  const update = (patch: Partial<LLMConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  const handleProviderChange = (id: string) => {
    const p = providers.find(x => x.id === id)!
    update({ providerId: id, baseUrl: p.baseUrl, modelId: p.models[0]?.id || '', customModel: '' })
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('chat')} className="text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-200 font-chinese">设置</h2>
      </div>
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="space-y-2">
          <Label className="text-zinc-300">提供商</Label>
          <div className="grid grid-cols-3 gap-2">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={"px-3 py-2 rounded-lg text-sm transition-colors " + (config.providerId === p.id ? 'bg-amber-500/20 border border-amber-500 text-amber-300' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700')}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">API Key</Label>
          <Input
            type="password"
            value={config.apiKey}
            onChange={e => update({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="bg-zinc-900 border-zinc-800 text-zinc-200"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Base URL</Label>
          <Input
            value={config.baseUrl}
            onChange={e => update({ baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
            className="bg-zinc-900 border-zinc-800 text-zinc-200"
          />
          <p className="text-xs text-zinc-600">提供商默认已填充，可自定义修改</p>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">模型</Label>
          {provider.models.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {provider.models.map(m => (
                <button
                  key={m.id}
                  onClick={() => update({ modelId: m.id, customModel: '' })}
                  className={"px-3 py-2 rounded-lg text-sm transition-colors text-left " + (config.modelId === m.id ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700')}
                >
                  {m.name}
                </button>
              ))}
            </div>
          ) : null}
          <Input
            value={config.customModel}
            onChange={e => update({ customModel: e.target.value, modelId: '' })}
            placeholder="model-name or endpoint ID (e.g. ep-m-xxxxx)"
            className="bg-zinc-900 border-zinc-800 text-zinc-200"
          />
        </div>

        <Button onClick={handleSave} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
          {saved ? <><Check className="h-4 w-4 mr-2" /> 已保存</> : <><Save className="h-4 w-4 mr-2" /> 保存配置</>}
        </Button>

        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-2">当前配置</h3>
          <div className="text-xs text-zinc-600 space-y-1">
            <div>提供商: {provider.name}</div>
            <div>URL: {config.baseUrl || '未设置'}</div>
            <div>模型: {config.modelId || config.customModel || '未设置'}</div>
            <div>Key: {config.apiKey ? '***' + config.apiKey.slice(-4) : '未设置'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
