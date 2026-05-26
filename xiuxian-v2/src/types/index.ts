export type GradeTier = '天' | '地' | '玄' | '黄'
export type GradeLevel = '上' | '中' | '下'
export type ItemGrade = `${GradeTier}阶${GradeLevel}品` | '无'
export type IntentType = 'NONE' | 'REWARD' | 'PENALTY' | 'COMBAT'

export interface IPlayer {
  id: string
  status: 'ALIVE' | 'DEAD'
  name: string
  gender: string
  stats: ICharacterStats
  inventory: IInventoryItem[]
  relationships: IRelationships
}

export interface ICharacterStats {
  hp: { current: number; max: number; status_desc: string }
  mp: { current: number; max: number; status_desc: string }
  spirit: { value: number; desc: string }
  realm: string
  age: { current: number; max: number }
  race: string
  alignment: '正道' | '魔道' | '中立'
  sect: string
  spiritual_root: string
  combat_power: number
  mental_state: string
  reputation: number
  emotion?: string
  state_of_mind?: number
  fortune?: number
  karma?: number
  techniques?: {
    main: string
    combat: string[]
    movement: string
    support: string[]
  }
  equipment?: {
    weapon: string
    armor: string
    artifact: string
  }
  talents?: string[]
  traits?: string[]
}

export interface IInventoryItem {
  id: string
  name: string
  grade: ItemGrade
  type: string
  description: string
  count: number
  value: number
}

export interface IRelationships {
  [key: string]: number
}

export interface IChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  thinking?: string
  timestamp: number
}
