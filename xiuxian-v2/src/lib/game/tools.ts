// game tools
let _cid='';
export function setConversationId(id:string){_cid=id}

import{DynamicStructuredTool}from'@langchain/core/tools'
import{z}from'zod'
import{storeVector}from'@/lib/vector-store'

const ItemGradeSchema=z.enum(['黄阶下品','黄阶中品','黄阶上品','玄阶下品','玄阶中品','玄阶上品','地阶下品','地阶中品','地阶上品','天阶下品','天阶中品','天阶上品','无'])
const ItemTypeSchema=z.enum(['丹药','法宝','材料','功法','杂物','特殊物品'])
const AlignmentSchema=z.enum(['正道','魔道','中立'])
const EmotionSchema=z.enum(['平静','愤怒','狂喜','悲恸','恐惧','仇恨','好奇','警惕','绝望','冷漠','得意','紧张'])

// ========== Category 1: World Gen (vector DB only) ==========
export const generateItemTool=new DynamicStructuredTool({
name:'Generate_Item',
description:'Generate item metadata and store in world knowledge base. Does NOT add to backpack. To give items, also call Backpack_additems.',
schema:z.object({items:z.array(z.object({
name:z.string(),type:ItemTypeSchema,grade:ItemGradeSchema,
description:z.string(),count:z.number(),value:z.number(),
effects:z.string().optional(),
}))}),
func:async({items})=>{
for(const item of items){if(_cid){try{await storeVector(_cid,'Item: '+item.name+'\nType: '+item.type+'\nGrade: '+item.grade+'\nDesc: '+item.description,{type:'item',name:item.name,grade:item.grade})}catch(e){console.error(e)}}}
return JSON.stringify({success:true,added:items.map(i=>i.name+' x'+i.count)})
},
})

export const generateNpcTool=new DynamicStructuredTool({
name:'Generate_NPC',
description:'Generate NPC character and store in world knowledge base.',
schema:z.object({npcs:z.array(z.object({
name:z.string(),title:z.string().optional(),realm:z.string(),
alignment:AlignmentSchema,sect:z.string(),personality:z.string(),
relationship:z.number(),description:z.string(),
}))}),
func:async({npcs})=>{
for(const npc of npcs){if(_cid){try{await storeVector(_cid,'NPC: '+npc.name+'\nRealm: '+npc.realm+'\nDesc: '+npc.description,{type:'npc',name:npc.name})}catch(e){console.error(e)}}}
return JSON.stringify({success:true,created:npcs.map(n=>n.name)})
},
})

export const generateLocationTool=new DynamicStructuredTool({
name:'Generate_Location',
description:'Generate location and store in world knowledge base.',
schema:z.object({locations:z.array(z.object({
name:z.string(),type:z.string(),danger_level:z.string(),
description:z.string(),resources:z.string().optional(),creatures:z.string().optional(),
}))}),
func:async({locations})=>{
for(const loc of locations){if(_cid){try{await storeVector(_cid,'Location: '+loc.name+'\nDesc: '+loc.description,{type:'location',name:loc.name})}catch(e){console.error(e)}}}
return JSON.stringify({success:true,created:locations.map(l=>l.name)})
},
})

export const generateSectTool=new DynamicStructuredTool({
name:'Generate_Sect',
description:'Generate sect and store in world knowledge base.',
schema:z.object({sects:z.array(z.object({
name:z.string(),alignment:AlignmentSchema,power_level:z.string(),
master:z.string(),master_realm:z.string(),description:z.string(),specialties:z.string().optional(),
}))}),
func:async({sects})=>{
for(const sect of sects){if(_cid){try{await storeVector(_cid,'Sect: '+sect.name+'\nAlignment: '+sect.alignment+'\nDesc: '+sect.description,{type:'sect',name:sect.name})}catch(e){console.error(e)}}}
return JSON.stringify({success:true,created:sects.map(s=>s.name)})
},
})

// ========== Category 2: Backpack Ops ==========

export const backpackAddItemsTool=new DynamicStructuredTool({
name:'Backpack_additems',
description:'Add items to player backpack. MUST be called when player obtains items.',
schema:z.object({items:z.array(z.object({
name:z.string(),type:z.string(),grade:z.string(),
description:z.string(),count:z.number(),value:z.number(),
}))}),
func:async({items})=>JSON.stringify({success:true,action:'add',items:items.map(i=>i.name+' x'+i.count)})
})

export const backpackReduceItemsTool=new DynamicStructuredTool({
name:'Backpack_reduceitems',
description:'Remove items from player backpack.',
schema:z.object({items:z.array(z.object({
name:z.string(),count:z.number(),
}))}),
func:async({items})=>JSON.stringify({success:true,action:'reduce',items:items.map(i=>i.name+' x'+i.count)})
})

export const consumeItemTool=new DynamicStructuredTool({
name:'Consume_Item',
description:'Consume/use an item. Same as Backpack_reduceitems.',
schema:z.object({items:z.array(z.object({name:z.string(),count:z.number()}))}),
func:async({items})=>JSON.stringify({success:true})
})

// ========== Category 3: Player State ==========

export const modifyStatsTool=new DynamicStructuredTool({
name:'Modify_Stats',
description:'Modify player core attributes. Positive=gain, negative=loss.',
schema:z.object({
hp_change:z.number().optional(),hp_max_change:z.number().optional(),
mp_change:z.number().optional(),mp_max_change:z.number().optional(),
spirit_change:z.number().optional(),age_change:z.number().optional(),
combat_power_change:z.number().optional(),reputation_change:z.number().optional(),
state_of_mind_change:z.number().optional(),fortune_change:z.number().optional(),
karma_change:z.number().optional(),
}),
func:async(args)=>JSON.stringify({success:true,deltas:args})
})

export const modifyTechniquesTool=new DynamicStructuredTool({
name:'Modify_Techniques',
description:'Modify player technique/cultivation skills.',
schema:z.object({
main:z.string().optional(),add_combat:z.string().optional(),
remove_combat:z.string().optional(),movement:z.string().optional(),
add_support:z.string().optional(),remove_support:z.string().optional(),
}),
func:async(args)=>JSON.stringify({success:true,...args})
})

export const modifyEquipmentTool=new DynamicStructuredTool({
name:'Modify_Equipment',
description:'Modify player equipment. null=unequip.',
schema:z.object({
weapon:z.string().optional(),armor:z.string().optional(),artifact:z.string().optional(),
}),
func:async(args)=>JSON.stringify({success:true,...args})
})

export const modifyTraitsTool=new DynamicStructuredTool({
name:'Modify_Traits',
description:'Modify player talents and traits.',
schema:z.object({
add_talents:z.array(z.string()).optional(),remove_talents:z.array(z.string()).optional(),
add_traits:z.array(z.string()).optional(),remove_traits:z.array(z.string()).optional(),
}),
func:async(args)=>JSON.stringify({success:true,...args})
})

export const modifyMentalTool=new DynamicStructuredTool({
name:'Modify_Mental',
description:'Modify player mental and social state.',
schema:z.object({
emotion:EmotionSchema.optional(),mental_state:z.string().optional(),
reputation_change:z.number().optional(),state_of_mind_change:z.number().optional(),
alignment:z.enum(['正道','魔道','中立']).optional(),
sect:z.string().optional(),spiritual_root:z.string().optional(),
}),
func:async(args)=>JSON.stringify({success:true,...args})
})

export const updateRelationshipTool=new DynamicStructuredTool({
name:'Update_Relationship',
description:'Update relationship with NPC. Range: -100 to 100.',
schema:z.object({npc_name:z.string(),change:z.number()}),
func:async({npc_name,change})=>JSON.stringify({success:true,npc_name,change})
})

export const skipTool=new DynamicStructuredTool({
name:'Skip',
description:'Nothing happened.',
schema:z.object({reason:z.string()}),
func:async({reason})=>JSON.stringify({action:'skip',reason})
})

export const changeLocationTool=new DynamicStructuredTool({
name:'Change_Location',
description:'Change player location.',
schema:z.object({location:z.string()}),
func:async({location})=>JSON.stringify({success:true,new_location:location})
})

export const breakthroughTool=new DynamicStructuredTool({
name:'Check_Breakthrough',
description:'Check realm breakthrough.',
schema:z.object({result:z.enum(['SUCCESS','FAIL']),new_realm:z.string().optional(),realm_change:z.string().optional()}),
func:async({result,new_realm})=>JSON.stringify({result,new_realm})
})

// ========== Export ==========
export const gameTools=[
generateItemTool,generateNpcTool,generateLocationTool,generateSectTool,
backpackAddItemsTool,backpackReduceItemsTool,consumeItemTool,
modifyStatsTool,modifyTechniquesTool,modifyEquipmentTool,
modifyTraitsTool,modifyMentalTool,updateRelationshipTool,
skipTool,changeLocationTool,breakthroughTool,
]

export function findToolByName(name:string):DynamicStructuredTool|undefined{
return gameTools.find(t=>t.name===name)
}