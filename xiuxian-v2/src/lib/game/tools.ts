import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { IInventoryItem } from "@/types";

// 物品属性 Schema
const ItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe("物品名称"),
  type: z.string().describe("物品类型：丹药/法宝/材料/功法"),
  grade: z.string().describe("品质：如 黄阶下品"),
  description: z.string().describe("物品描述"),
  count: z.number().describe("数量"),
  value: z.number().describe("价值"),
});

// 1. 背包添加物品工具
export const backpackAddItemsTool = new DynamicStructuredTool({
  name: "Backpack_additems",
  description: "向玩家背包中添加一个或多个物品。例如获得战利品、任务奖励。",
  schema: z.object({
    items: z.array(ItemSchema).describe("要添加的物品列表")
  }),
  func: async ({ items }) => {
    // 实际逻辑由 RuleEngine 处理，这里仅做透传标记
    // 但为了调试，我们可以打印日志
    console.log("[Tool Call] Adding items:", items.map(i => i.name));
    return JSON.stringify({ success: true, added: items });
  },
});

// 2. 背包减少物品工具
export const backpackReduceItemsTool = new DynamicStructuredTool({
  name: "Backpack_reduceitems",
  description: "从玩家背包中消耗/移除物品。例如使用丹药、损坏法宝。",
  schema: z.object({
    items: z.array(z.object({
      name: z.string().describe("物品名称"),
      count: z.number().describe("消耗数量")
    })).describe("要消耗的物品列表")
  }),
  func: async ({ items }) => {
    console.log("[Tool Call] Reducing items:", items.map(i => i.name));
    return JSON.stringify({ success: true, reduced: items });
  },
});

// 3. 状态变动工具 (伤害/治疗/经验/修为)
export const modifyStatsTool = new DynamicStructuredTool({
  name: "Modify_PlayerStats",
  description: "修改玩家数值状态。包括气血(hp)、灵力(mp)、寿元(age)、修为(cultivation)等。",
  schema: z.object({
    hp_change: z.number().optional().describe("气血变动，负数为扣血，正数为回血"),
    mp_change: z.number().optional().describe("灵力变动"),
    age_change: z.number().optional().describe("寿元变动 (通常是负数，消耗寿元)"),
    exp_gain: z.number().optional().describe("修为/经验增加"),
    damage_taken: z.number().optional().describe("受到的物理/法术伤害")
  }),
  func: async (args) => {
    console.log("[Tool Call] Modifying stats:", args);
    return JSON.stringify({ success: true, deltas: args });
  },
});

// 4. 跳过/无事发生工具
export const skipTool = new DynamicStructuredTool({
  name: "Skip",
  description: "当没有发生特殊事件、不需要修改数值或背包时调用。",
  schema: z.object({
    reason: z.string().describe("原因")
  }),
  func: async ({ reason }) => {
    return JSON.stringify({ action: "skip", reason });
  },
});

// 5. 修改位置工具
export const changeLocationTool = new DynamicStructuredTool({
  name: "Current_Location",
  description: "当玩家移动到新地点时调用。",
  schema: z.object({
    location: z.string().describe("新地点名称")
  }),
  func: async ({ location }) => {
    console.log("[Tool Call] Changing location to:", location);
    return JSON.stringify({ success: true, new_location: location });
  },
});

// 6. 突破境界检测工具
export const breakthroughTool = new DynamicStructuredTool({
  name: "Check_Breakthrough",
  description: "检测玩家是否满足突破条件（修为满且心境稳），如果满足则触发突破。",
  schema: z.object({
    result: z.enum(["SUCCESS", "FAIL"]).describe("突破结果"),
    new_realm: z.string().optional().describe("突破后的新境界")
  }),
  func: async ({ result, new_realm }) => {
    return JSON.stringify({ result, new_realm });
  },
});

// 导出所有工具数组
export const gameTools = [
  backpackAddItemsTool,
  backpackReduceItemsTool,
  modifyStatsTool,
  skipTool,
  changeLocationTool,
  breakthroughTool
];
