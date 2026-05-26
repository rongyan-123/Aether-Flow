import { GameStateAnnotation } from './graph'
import { searchVectors } from '@/lib/vector-store'
import { directorPrompt } from './prompts'
import { gameTools, setConversationId, findToolByName } from './tools'
import { ChatOpenAI } from '@langchain/openai'
import { AIMessage } from '@langchain/core/messages'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

let _llmConfig={apiKey:'',baseUrl:'https://api.openai.com/v1',modelName:'gpt-4o-mini'}

export function setLLMConfig(config:{apiKey:string;baseUrl:string;modelName:string}){_llmConfig=config}

function getLLM(){
return new ChatOpenAI({modelName:_llmConfig.modelName,apiKey:_llmConfig.apiKey,configuration:{baseURL:_llmConfig.baseUrl},temperature:0.7}).bindTools(gameTools)
}

function getPlainLLM(){
return new ChatOpenAI({modelName:_llmConfig.modelName,apiKey:_llmConfig.apiKey,configuration:{baseURL:_llmConfig.baseUrl},temperature:0.7})
}
// ========== Node A: RAG Retriever ==========
export async function ragRetrieverNode(state:typeof GameStateAnnotation.State){
console.log('[Node] RAG Retriever')
const{messages,playerId}=state
const lastMessage=messages[messages.length-1]
const query=typeof lastMessage.content==='string'?lastMessage.content:''
let ragContext=''
try{
const results=await searchVectors(playerId,query,5)
ragContext=results.map((r:{content:string})=>r.content).join('\n')
console.log('[RAG] Found '+results.length+' contexts')
}catch{
ragContext='修仙界常言：练气期修士寿元百年。当前地点：青云山脉外围。'
}
return{ragContext}
}

// ========== Node B: Plot Director (LLM) ==========
export async function plotDirectorNode(state:typeof GameStateAnnotation.State){
setConversationId(state.playerId)
console.log('[Node] Plot Director')
const{stats,inventory,ragContext,messages}=state

const promptInput={
playerStats:JSON.stringify(stats,null,2),
inventory:JSON.stringify(inventory,null,2),
ragContext,
chat_history:messages.slice(0,-1),
input:messages[messages.length-1].content,
}

// First call: LLM with tools
const chain=directorPrompt.pipe(getLLM())
const result=await chain.invoke(promptInput)

// Execute tool calls (side effects: vector DB storage etc.)
if(result.tool_calls&&result.tool_calls.length>0){
console.log('[Plot Director] '+result.tool_calls.length+' tool calls')
for(const toolCall of result.tool_calls){
const tool=findToolByName(toolCall.name)
if(tool){
try{await tool.invoke(toolCall.args);console.log('[Plot Director] Executed: '+toolCall.name)}
catch(err){console.error('[Plot Director] Tool failed: '+toolCall.name,err)}
}
}
}

// If only tool calls with no narrative text, do follow-up
let finalReply=(result.content as string)||''
if(finalReply.trim()===''&&result.tool_calls&&result.tool_calls.length>0){
console.log('[Plot Director] Empty content with tool calls, follow-up...')
const toolSummary=result.tool_calls.map((tc:{name:string;args:Record<string,unknown>})=>tc.name+': '+JSON.stringify(tc.args)).join('\n')
const plainLlm=getPlainLLM()
const followUp=await plainLlm.invoke([
{role:'system',content:promptInput.playerStats+'\n\n背包:\n'+promptInput.inventory+'\n\nRAG:\n'+promptInput.ragContext},
...(promptInput.chat_history as{content:string}[]),
{role:'user',content:promptInput.input},
{role:'assistant',content:'[Internal] executed tools:\n'+toolSummary},
{role:'user',content:'Based on the above, generate a vivid xianxia narration. Direct text output only, no tools.'},
] as any)
finalReply=(followUp.content as string)||''
}

return{messages:[result],finalReply}
}

// ========== Node C: Rule Engine (code, no LLM) ==========
// Code-enforced todolist: processes ALL tool calls from the LLM
export async function ruleEngineNode(state:typeof GameStateAnnotation.State){
console.log('[Node] Rule Engine')
const{messages,stats,inventory}=state
const lastAiMessage=messages[messages.length-1] as AIMessage
const newStats={...stats} as any
const newInventory=[...inventory]
const deltas:Record<string,any>={}
const todolist:string[]=[]

if(lastAiMessage.tool_calls&&lastAiMessage.tool_calls.length>0){
for(const toolCall of lastAiMessage.tool_calls){
const{name,args}=toolCall

// === Backpack Operations ===
if(name==='Backpack_additems'){
todolist.push('[DONE] Backpack_additems: '+JSON.stringify(args.items?.map((i:any)=>i.name+'x'+i.count)))
const itemsToAdd=args.items as any[]
for(const item of itemsToAdd){
const existing=newInventory.find((i:any)=>i.name===item.name)
if(existing){existing.count+=item.count}
else{newInventory.push({...item,id:item.id||Date.now().toString()+'-'+Math.random().toString(36).substr(2,5)})}
}
deltas.addedItems=itemsToAdd
}

if(name==='Backpack_reduceitems'||name==='Consume_Item'){
todolist.push('[DONE] '+name+': '+JSON.stringify(args.items?.map((i:any)=>i.name+'x'+i.count)))
const itemsToReduce=args.items as any[]
for(const item of itemsToReduce){
const idx=newInventory.findIndex((i:any)=>i.name===item.name)
if(idx!==-1){
newInventory[idx].count-=item.count
if(newInventory[idx].count<=0)newInventory.splice(idx,1)
}
}
deltas.reducedItems=itemsToReduce
}

// === Core Stats ===
if(name==='Modify_Stats'){
todolist.push('[DONE] Modify_Stats')
const a=args
if(!newStats.hp)newStats.hp={current:100,max:100,status_desc:'良好'}
if(!newStats.mp)newStats.mp={current:50,max:50,status_desc:'充沛'}
if(!newStats.spirit)newStats.spirit={value:100,desc:'精神饱满'}
if(!newStats.age)newStats.age={current:16,max:100}
if(a.hp_change){newStats.hp.current=Math.max(0,Math.min(newStats.hp.max,newStats.hp.current+a.hp_change))}
if(a.hp_max_change){newStats.hp.max+=a.hp_max_change}
if(a.mp_change){newStats.mp.current=Math.max(0,Math.min(newStats.mp.max,newStats.mp.current+a.mp_change))}
if(a.mp_max_change){newStats.mp.max+=a.mp_max_change}
if(a.spirit_change){newStats.spirit.value+=a.spirit_change}
if(a.age_change){newStats.age.current+=a.age_change}
if(a.combat_power_change){newStats.combat_power+=a.combat_power_change}
if(a.reputation_change){newStats.reputation+=a.reputation_change}
if(a.state_of_mind_change){newStats.state_of_mind=(newStats.state_of_mind||50)+a.state_of_mind_change}
if(a.fortune_change){newStats.fortune=(newStats.fortune||10)+a.fortune_change}
if(a.karma_change){newStats.karma=(newStats.karma||0)+a.karma_change}
deltas.stats=a
}

// === Techniques ===
if(name==='Modify_Techniques'){
todolist.push('[DONE] Modify_Techniques')
if(!newStats.techniques){newStats.techniques={main:'',combat:[],movement:'',support:[]}}
const t=newStats.techniques
if(args.main!==undefined){t.main=args.main}
if(args.add_combat){t.combat=[...t.combat,args.add_combat]}
if(args.remove_combat){t.combat=t.combat.filter((c:string)=>c!==args.remove_combat)}
if(args.movement!==undefined){t.movement=args.movement}
if(args.add_support){t.support=[...t.support,args.add_support]}
if(args.remove_support){t.support=t.support.filter((s:string)=>s!==args.remove_support)}
deltas.techniques=t
}

// === Equipment ===
if(name==='Modify_Equipment'){
todolist.push('[DONE] Modify_Equipment')
if(!newStats.equipment){newStats.equipment={weapon:'',armor:'',artifact:''}}
const e=newStats.equipment
if(args.weapon!==undefined)e.weapon=args.weapon
if(args.armor!==undefined)e.armor=args.armor
if(args.artifact!==undefined)e.artifact=args.artifact
deltas.equipment=e
}

// === Traits & Talents ===
if(name==='Modify_Traits'){
todolist.push('[DONE] Modify_Traits')
if(args.add_talents){newStats.talents=[...(newStats.talents||[]),...args.add_talents]}
if(args.remove_talents){newStats.talents=(newStats.talents||[]).filter((t:string)=>!args.remove_talents.includes(t))}
if(args.add_traits){newStats.traits=[...(newStats.traits||[]),...args.add_traits]}
if(args.remove_traits){newStats.traits=(newStats.traits||[]).filter((t:string)=>!args.remove_traits.includes(t))}
deltas.traits=newStats.traits
}

// === Mental & Social ===
if(name==='Modify_Mental'){
todolist.push('[DONE] Modify_Mental')
if(args.emotion)newStats.emotion=args.emotion
if(args.mental_state)newStats.mental_state=args.mental_state
if(args.reputation_change){newStats.reputation+=args.reputation_change}
if(args.state_of_mind_change){newStats.state_of_mind=(newStats.state_of_mind||50)+args.state_of_mind_change}
if(args.alignment)newStats.alignment=args.alignment
if(args.sect)newStats.sect=args.sect
if(args.spiritual_root)newStats.spiritual_root=args.spiritual_root
deltas.mental=args
}

// === Relationship ===
if(name==='Update_Relationship'){
todolist.push('[DONE] Update_Relationship: '+args.npc_name+' '+(args.change>0?'+':'')+args.change)
const rels=state.relationships||{}
rels[args.npc_name]=(rels[args.npc_name]||0)+args.change
deltas.relationships=rels
}

// === Location ===
if(name==='Change_Location'){
todolist.push('[DONE] Change_Location: '+args.location)
deltas.location=args.location
}

// === Breakthrough ===
if(name==='Check_Breakthrough'){
todolist.push('[DONE] Check_Breakthrough: '+args.result)
if(args.result==='SUCCESS'&&args.new_realm){newStats.realm=args.new_realm}
deltas.breakthrough=args
}

// === Skip ===
if(name==='Skip'){
todolist.push('[DONE] Skip: '+args.reason)
}

}// end for
}// end if

console.log('[Rule Engine] Todolist:',todolist)
return{stats:newStats,inventory:newInventory,deltas}
}

// ========== Node D: DB Persist ==========
export async function dbPersistNode(state:typeof GameStateAnnotation.State){
console.log('[Node] DB Persist')
const{playerId,stats,inventory,relationships}=state
const hp=(stats as any).hp
const hpCurrent=hp?.current??100

try{
await prisma.player.update({
where:{id:playerId},
data:{
stats:stats as unknown as Prisma.InputJsonValue,
inventory:inventory as any,
relationships:(relationships||{}) as any,
status:hpCurrent<=0?'DEAD':'ALIVE',
},
})
console.log('[DB] Persisted successfully')
}catch(err){
console.error('[DB] Persist failed:',err)
}

return{}
}
