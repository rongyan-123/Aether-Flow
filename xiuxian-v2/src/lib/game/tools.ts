// ======================================================================
// 新手注释（小白指南）
// 这个文件定义了一组 "工具"（tools），它们像是 AI 的插件：当 AI 决定要做一件事
//（比如生成一个 NPC、把物品放进玩家背包、写一本图鉴条目），它会调用这些工具。
// 每个工具都有：
// - name: 工具名（AI 会用这个名字来调用）
// - schema: 用 zod 定义的参数格式（这能在运行时校验 AI 传入的数据）
// - func: 真正执行的 JS 代码（通常会把记录写入向量库或返回一个操作结果）
//
// 读代码小贴士：
// - 如果你看到 z.object(...) 或 z.enum(...)，那是 "输入格式/限制"，相当于工具的说明书。
// - func 里通常会调用 storeVector()（把信息写进 AI 的记忆库），或返回一个 JSON 字符串
//   表示执行结果。不要担心复杂实现，先看工具名和 schema，理解它的意图即可。
// ======================================================================

// 这是一个全局变量，用来存当前聊天的"房间号"或者"存档 ID"（Conversation ID）。
// 就像你去网吧开机，网管得知道你是哪台电脑（哪个玩家的哪个存档），才能帮你存盘。
let _cid = "";

/**
 * 这是一个"修改/设置当前房间号"的函数。
 * 外部程序在启动游戏或切换存档时，会调用这个函数把新的 ID 传进来。
 * @param id 字符串类型的房间/对话 ID
 */
export function setConversationId(id: string) {
  _cid = id;
}

// 从 LangChain 库中引入动态结构化工具类。
// LangChain 是一个专门用来帮 AI 组装技能的工具箱。DynamicStructuredTool 就是"给 AI 打造的专属技能外挂"。
import { DynamicStructuredTool } from "@langchain/core/tools";

// 从 Zod 库中引入 z。
// Zod 是一个"规则制定官"（数据校验库）。
// 举个例子：AI 有时候会胡言乱语，我们要限制它只能在我们规定的几个词（比如只能选‘丹药’或‘法宝’）里挑，不能自己发明一个‘超级赛亚人变身器’。
import { z } from "zod";

// 从项目的向量数据库模块中引入存储函数。
// 向量数据库（Vector Store）通俗来说就是"AI 的长效记忆海马体"或者"世界百科全书"。
// 游戏里随机生成的路人甲、新门派，都会塞进这里。以后 AI 忘了，就会来这里"搜寻记忆"。
import { storeVector, searchVectors } from "@/lib/vector-store";

// ==============================================================================
// 【数据规则定义（Zod Schemas）—— 给 AI 画的格子，不能跳出去】
// ==============================================================================

/**
 * 物品品阶规则：严格限定了修仙世界里法宝丹药的等级。
 * 从最垃圾的"黄阶下品"到神仙级别的"天阶上品"，外加一个"无"（普通物品）。
 * 就像网游里的：白装、绿装、蓝装、紫装、橙装。
 */
const ItemGradeSchema = z.enum([
  "黄阶下品",
  "黄阶中品",
  "黄阶上品",
  "玄阶下品",
  "玄阶中品",
  "玄阶上品",
  "地阶下品",
  "地阶中品",
  "地阶上品",
  "天阶下品",
  "天阶中品",
  "天阶上品",
  "无",
]);

/**
 * 物品类型规则：限定了物品的归类。
 * 丹药（吃药）、法宝（装备/武器）、材料（炼丹炼器用）、功法（技能书）、杂物（垃圾/换钱货）、特殊物品（任务道具）。
 */
const ItemTypeSchema = z.enum([
  "丹药",
  "法宝",
  "材料",
  "功法",
  "杂物",
  "特殊物品",
]);

/**
 * 阵营规则：修仙世界的三大立场。
 * 正道（名门正派，满口仁义道德）、魔道（随心所欲，或者残忍嗜杀）、中立（散修，不掺和两边打架）。
 */
const AlignmentSchema = z.enum(["正道", "魔道", "中立"]);

/**
 * 情绪规则：限定了角色演戏时的面部表情和心理状态。
 * AI 判定当前剧情气氛后，必须从这 12 种标准情绪里选一个，用来驱动前端头像变化或文本语气。
 */
const EmotionSchema = z.enum([
  "平静",
  "愤怒",
  "狂喜",
  "悲恸",
  "恐惧",
  "仇恨",
  "好奇",
  "警惕",
  "绝望",
  "冷漠",
  "得意",
  "紧张",
]);

// ==============================================================================
// ========== 第一部分：世界生成工具 (只存入 AI 的记忆数据库) ==========
//
// 划重点：这一组工具的作用是"造物/编故事"，它们只负责把世界设定写进 AI 的记忆本里。
// 比如 AI 生成了一把剑，此时这把剑只是"存在于这个世界上"，并没有掉落到玩家的手里！
// ==============================================================================

/**
 * 工具 1：生成物品元数据
 * 作用：当剧情中出现了一种世界上本来没有的、新的奇珍异宝时，AI 用它来记录这件物品的背景故事。
 */
export const generateItemTool = new DynamicStructuredTool({
  name: "Generate_Item", // 工具的唯一名字，AI 认字就认这个
  description:
    "Generate item metadata and store in world knowledge base. Does NOT add to backpack. To give items, also call Backpack_additems. IMPORTANT - Grade restriction: 天/地/玄/黄 grade system ONLY applies to 丹药/法宝/材料/功法. For 杂物 and 特殊物品, grade MUST be '无'.",
  // 这里的英文描述是写给 AI 看的"说明书"！明确警告 AI：这个工具只是注册物品，不会直接塞进玩家背包！如果想送给玩家，必须同时调用 Backpack_additems 工具。
  schema: z.object({
    items: z.array(
      z.object({
        // 允许 AI 一次性生成一堆物品（数组形式）
        name: z.string(), // 物品名字，比如"九转金丹"
        type: ItemTypeSchema, // 必须是我们上面定义的类型（丹药、法宝等）
        grade: ItemGradeSchema, // 必须是我们上面定义的品阶（天阶、地阶等）
        description: z.string(), // 物品的背景介绍，例如"散发着淡淡的金光，据说能白日飞升..."
        count: z.number(), // 数量
        value: z.number(), // 价值（灵石数量）
        effects: z.string().optional(), // 物品效果，选填。比如"气血+100"
      }),
    ),
  }),
  func: async ({ items }) => {
    // 这里的 func 是 AI 决定用这个技能时，服务器真正执行的 JavaScript 代码
    for (const item of items) {
      if (_cid) {
        // 如果有有效的房间号
        try {
          // 核心操作：把物品的详细信息拼成一段话，像写日记一样塞进向量数据库（AI 的记忆体）
          await storeVector(
            _cid,
            "Item: " +
              item.name +
              "\nType: " +
              item.type +
              "\nGrade: " +
              item.grade +
              "\nDesc: " +
              item.description,
            { type: "item", name: item.name, grade: item.grade },
          );
        } catch (e) {
          console.error(e);
        } // 报错了就在控制台打印一下，防止游戏崩溃
      }
    }
    // 执行完了，给 AI 回一句话，告诉它："我已经把这些东西登记在世界百科全书里啦！"
    return JSON.stringify({
      success: true,
      added: items.map((i) => i.name + " x" + i.count),
    });
  },
});

/**
 * 工具 2：生成 NPC（游戏角色）
 * 作用：当玩家走到一个新地方，AI 凭空捏造出一个王二麻子或者张天师时，用这个工具写入世界记忆。
 */
export const generateNpcTool = new DynamicStructuredTool({
  name: "Generate_NPC",
  description: "Generate NPC character and store in world knowledge base.", // 告诉 AI：这是把 NPC 存入世界知识库的工具
  schema: z.object({
    npcs: z.array(
      z.object({
        name: z.string(), // 名字，如"韩立"
        title: z.string().optional(), // 称号/尊称，选填。如"厉飞雨"、"跑跑尊者"
        realm: z.string(), // 境界，如"结丹期初期"
        alignment: AlignmentSchema, // 正道、魔道、中立
        sect: z.string(), // 所属门派，如"落云宗"
        personality: z.string(), // 性格特点，如"为人谨慎，见势不妙拔腿就跑"
        relationship: z.number(), // 玩家和他的好感度，数字表示（比如 0 是路人，100 是生死之交，-100 是不共戴天）
        description: z.string(), // 外貌或生平简介
      }),
    ),
  }),
  func: async ({ npcs }) => {
    for (const npc of npcs) {
      if (_cid) {
        try {
          // 把 NPC 的个人档案刻进 AI 的记忆石碑里
          await storeVector(
            _cid,
            "NPC: " +
              npc.name +
              "\nRealm: " +
              npc.realm +
              "\nDesc: " +
              npc.description,
            { type: "npc", name: npc.name },
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
    return JSON.stringify({ success: true, created: npcs.map((n) => n.name) });
  },
});

/**
 * 工具 3：生成地点/场景
 * 作用：AI 随手写出"你来到了一片神秘的黑木林，四周弥漫着毒雾"，它就需要调用这个工具把黑木林记录下来。
 */
export const generateLocationTool = new DynamicStructuredTool({
  name: "Generate_Location",
  description:
    "Generate a detailed location and store in world knowledge base. MUST include at least 1-2 bound_locations or connected regions. Every location must be placed in a clear geographical context.",
  schema: z.object({
    locations: z.array(
      z.object({
        name: z.string().describe("Location name in xianxia style"),
        region: z
          .string()
          .describe(
            "Continent or large region, e.g. 'Tiannan', 'Chaotic Star Sea'",
          ),
        danger_level: z
          .enum(["安全", "低危", "中危", "高危", "绝地"])
          .describe("Danger level"),
        description: z
          .string()
          .describe(
            "Brief description including environment, atmosphere, features (max 50 chars)",
          ),
        power_distribution: z
          .string()
          .describe(
            "Main factions (sects, families, demonic cultivators) and their relationships",
          ),
        level_range: z
          .string()
          .describe(
            "Common cultivator realm range in this area, e.g. 'Qi Refining to Nascent Soul'",
          ),
        rules: z
          .string()
          .describe(
            "Special rules, e.g. 'no combat allowed', 'demonic miasma everywhere'",
          ),
        peace_orno: z
          .enum(["和平", "冲突", "战争", "混乱"])
          .describe("Current situation: peace/conflict/war/chaos"),
        inhabitants: z
          .array(z.string())
          .describe("Key resident NPC names, use ['none'] if empty"),
        bound_items: z
          .array(z.string())
          .describe("Important items unique to this location"),
        bound_locations: z
          .array(z.string())
          .describe("Sub-areas or connected locations, at least 1-2 required"),
      }),
    ),
  }),
  func: async ({ locations }) => {
    for (const loc of locations) {
      if (_cid) {
        try {
          await storeVector(
            _cid,
            "Location: " +
              loc.name +
              "\nRegion: " +
              (loc.region || "unknown") +
              "\nDanger: " +
              loc.danger_level +
              "\nDesc: " +
              loc.description +
              "\nPowers: " +
              (loc.power_distribution || "none") +
              "\nLevels: " +
              (loc.level_range || "unknown") +
              "\nRules: " +
              (loc.rules || "none") +
              "\nSituation: " +
              (loc.peace_orno || "unknown") +
              "\nInhabitants: " +
              (loc.inhabitants || []).join(", ") +
              "\nItems: " +
              (loc.bound_items || []).join(", ") +
              "\nConnected: " +
              (loc.bound_locations || []).join(", "),
            { type: "location", name: loc.name },
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
    return JSON.stringify({
      success: true,
      created: locations.map((l) => l.name),
    });
  },
});

/**
 * 工具 4：生成修仙门派
 * 作用：天王老子又建新帮派了？AI 用这个工具在世界地图上戳一个门派据点。
 */
export const generateSectTool = new DynamicStructuredTool({
  name: "Generate_Sect",
  description:
    "When the plot requires,Generate sect and store in world knowledge base.",
  schema: z.object({
    sects: z.array(
      z.object({
        name: z.string(), // 门派名称，如"青云门"
        alignment: AlignmentSchema, // 门派立场（正/魔/中立）
        power_level: z.string(), // 势力强度，如"泰山北斗"、"不入流的小门派"
        master: z.string(), // 现任掌门人叫啥
        master_realm: z.string(), // 掌门人的修为，如"大乘期巅峰"
        description: z.string(), // 门派历史或简介
        specialties: z.string().optional(), // 门派擅长什么，选填。如"擅长炼剑"与"护短"
      }),
    ),
  }),
  func: async ({ sects }) => {
    for (const sect of sects) {
      if (_cid) {
        try {
          // 记录在修仙界势力榜上
          await storeVector(
            _cid,
            "Sect: " +
              sect.name +
              "\nAlignment: " +
              sect.alignment +
              "\nDesc: " +
              sect.description,
            { type: "sect", name: sect.name },
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
    return JSON.stringify({ success: true, created: sects.map((s) => s.name) });
  },
});

// ==============================================================================
// ========== 第二部分：背包操作工具 (真正的道具增减) ==========
//
// 这里的工具是真正和玩家的"口袋"挂钩的。增、删、吃。
// 细心的你会发现，这几个工具的 func 函数（执行体）里并没有真正去写复杂的数据库写入代码，
// 只是简单地返回了一个 JSON 字符串。
// 这是因为在很多 AI 架构里，这几个工具只负责让 AI 表达"我要做这个动作"的意图，
// 真正的背包加减逻辑会被外层的中间件拦截并处理。
// ==============================================================================

/**
 * 工具 5：把物品塞进玩家背包
 * 作用：打怪掉宝、师傅送礼、路边捡漏时，AI 必须调用这个，玩家才能真正拿到道具。
 */
export const backpackAddItemsTool = new DynamicStructuredTool({
  name: "Backpack_additems",
  description:
    "Add items to player backpack. MUST be called when player obtains items. Grade restriction: 天/地/玄/黄 grades ONLY for 丹药/法宝/材料/功法. 杂物/特殊物品 grade MUST be '无'.", // 警告 AI：玩家拿到东西时【必须】调用我！
  schema: z.object({
    items: z.array(
      z.object({
        name: z.string(), // 进包物品名
        type: z.string(),
        grade: z.string(),
        description: z.string(),
        count: z.number(), // 拿到了几个
        value: z.number(), // 值多少钱
      }),
    ),
  }),
  func: async ({ items }) =>
    JSON.stringify({
      success: true,
      action: "add",
      items: items.map((i) => i.name + " x" + i.count),
    }),
  // 返回给系统的信号：成功执行了"add（添加）"动作
});

/**
 * 工具 6：从玩家背包扣除物品
 * 作用：玩家买东西付账、遭遇盗贼被抢劫、或者把任务道具交给 NPC 时，AI 调用它来扣除物品。
 */
export const backpackReduceItemsTool = new DynamicStructuredTool({
  name: "Backpack_reduceitems",
  description: "Remove items from player backpack.",
  schema: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        count: z.number(), // 扣除什么，扣几个
      }),
    ),
  }),
  func: async ({ items }) =>
    JSON.stringify({
      success: true,
      action: "reduce",
      items: items.map((i) => i.name + " x" + i.count),
    }),
  // 返回给系统的信号：成功执行了"reduce（减少）"动作
});

/**
 * 工具 7：消耗/使用物品
 * 作用：玩家把丹药吃了，或者把灵符用了。
 * 备注：在代码逻辑上它和上面的"扣除物品"是一模一样的，只是在语意上是"消费/使用"。
 */
export const consumeItemTool = new DynamicStructuredTool({
  name: "Consume_Item",
  description: `Consume/use an item or channel spirit power. Supports dynamic mp_cost for flexible spirit power injection. items: items to consume from backpack. mp_cost: optional mana cost when channeling techniques/treasures. Player can declare injection ratio (e.g. '注入三成灵力' → mp_cost = base_cost × 30%). Supports 1%~100% flexible injection.`,
  schema: z.object({
    items: z
      .array(z.object({ name: z.string(), count: z.number() }))
      .optional(),
    mp_cost: z.number().optional(),
  }),
  func: async (args) => JSON.stringify({ success: true, ...args }),
});

// ==============================================================================
// ========== 第三部分：玩家状态属性修改器 ==========
//
// 这部分工具是整个修仙 RPG 的核心数值逻辑！
// 涵盖了血量（HP）、法力（MP）、心境、因果、功法、装备、天赋灵根等。
// 相当于直接去改玩家的"角色属性面板"。
// ==============================================================================

/**
 * 工具 8：修改基础属性（数值面板）
 * 说明书里写满了文案策划对 AI 的"血泪警告"和严格限制，这是为了防止 AI 乱改数值导致数值崩坏！
 */
export const modifyStatsTool = new DynamicStructuredTool({
  name: "Modify_Stats",
  // 下面这一大段 description 是写给 AI 的数值指南（非常精妙的 Prompt 提示词）：
  description: `Modify player core attributes. Use only when story events directly cause stat changes.
  hp_change: Combat injury -10 to -50. Heal pill +20 to +50. Poison/disease -5 to -15.  (血量变化：战斗受伤扣10~50；吃疗伤药加20~50；中毒生病扣5~15)
  mp_change: Cast spell -5 to -30. Meditate +5 to +15. (蓝量/法力变化：施法扣5~30；打坐恢复5~15)
  state_of_mind_change: ONLY positive +1~+2. 心境是人生阅历的积累，只增不减。+1=日常感悟小触动，+2=参透道理战胜心魔。Never set negative. (极度重要：心境只能加不能减！因为这是阅历，经历了就是经历了，不能是负数或0)
  fortune_change: +1~+3 for major good deeds or heaven's recognition. Cannot exceed 20. Rarely used. (气运/幸运值：做了惊天大善事或获得天道认可加1~3，上限20，极少使用)
  karma_change: +5 to +10 for saving lives/helping innocents. -5 to -10 for killing innocents/treachery. (因果/业报：救人加正因果，滥杀无辜或背叛扣因果，也就是变魔头)
  reputation_change: +10 to +30 for public victories/fame. -5 to -15 for public disgrace. (名声：打赢比武公开扬名加分，公开出丑被羞辱扣分)
  combat_power_change: Recalculate when realm or equipment changes. (战斗力：当境界突破或换了神装时，让 AI 重新估算并修改这个值)`,
  schema: z.object({
    // 所有的属性改变值都是 Optional（可选的）。也就是说，AI 如果只想扣血，就只传 hp_change，其他不用传。
    hp_change: z.number().optional(), // 血量当前值变化（可正可负）
    hp_max_change: z.number().optional(), // 血量上限值变化（比如吃了人参果，上限永久提升）
    mp_change: z.number().optional(), // 法力当前值变化
    mp_max_change: z.number().optional(), // 法力上限值变化
    spirit_change: z.number().optional(), // 精气神/精力变化
    age_change: z.number().optional(), // 年龄变化（修仙闭关一次可能过去10年，或者吃了驻颜丹减龄）
    combat_power_change: z.number().optional(), // 综合战力变化
    reputation_change: z.number().optional(), // 名声变化
    state_of_mind_change: z.number().optional(), // 心境感悟值变化
    fortune_change: z.number().optional(), // 气运变化
    karma_change: z.number().optional(), // 因果值变化
  }),
  func: async (args) => JSON.stringify({ success: true, deltas: args }), // 把 AI 传入的增量（deltas）打包返回，由外层系统真正去加减数据库
});

/**
 * 工具 9：修改修炼的功法/技能
 * 作用：玩家转修了更高级的功法，或者学会了新的御剑术。
 */
export const modifyTechniquesTool = new DynamicStructuredTool({
  name: "Modify_Techniques",
  description: "Modify player technique/cultivation skills.",
  schema: z.object({
    main: z.string().optional(), // 主修功法（比如更换为"青元剑诀"）
    add_combat: z.string().optional(), // 领悟了新的战斗招式（如"大庚剑阵"）
    remove_combat: z.string().optional(), // 忘却或废弃某项战斗招式
    movement: z.string().optional(), // 身法/轻功/遁术（如"罗烟步"）
    add_support: z.string().optional(), // 学会了辅助/副职业技能（如"基础炼丹术"）
    remove_support: z.string().optional(), // 移除某项辅助技能
  }),
  func: async (args) => JSON.stringify({ success: true, ...args }),
});

/**
 * 工具 11：修改天赋与特质
 * 作用：逆天改命！比如玩家在奇遇中眼睛瞎了，获得"盲眼"特质；或者洗髓成功，获得"天纵奇才"天赋。
 */
export const modifyTraitsTool = new DynamicStructuredTool({
  name: "Modify_Traits",
  description: "Modify player talents and traits.",
  schema: z.object({
    add_talents: z.array(z.string()).optional(), // 增加先天资质（如"重瞳"、"至尊骨"）
    remove_talents: z.array(z.string()).optional(), // 失去某些资质
    add_traits: z.array(z.string()).optional(), // 增加后天特质/性格标签（如"嗜酒如命"、"道心坚定"）
    remove_traits: z.array(z.string()).optional(), // 移除后天特质
  }),
  func: async (args) => JSON.stringify({ success: true, ...args }),
});

/**
 * 工具 12：修改精神状态、身份与大境界
 * 作用：当发生重大剧情（比如被灭门、或者成功筑基、改变修仙路线）时调用。
 */
export const modifyMentalTool = new DynamicStructuredTool({
  name: "Modify_Mental",
  description: `Modify player mental and social state. Call when story events affect the character's inner world or social standing.
  emotion: Set to the dominant emotion of the current scene (select from enum).
  mental_state: Free-text 1-sentence summary of current mental condition.
  state_of_mind_change: ONLY positive +1~+2. 心境只增不减，是人生阅历。+1=小事触动感悟，+2=参透道理战胜心魔。Never set negative or zero.
  reputation_change: +10~+30 for public victory/fame. -5~-15 for public disgrace/humiliation.
  realm: Set during character creation or breakthrough. Format like "练气期一层". (修仙大境界：比如‘练气期一层’、‘筑基期大圆满’)
  race/alignment/sect/spiritual_root: Set during character creation or major identity shifts.`, // 灵根、种族、门派、阵营等身份的初始化或大洗牌
  schema: z.object({
    emotion: EmotionSchema.optional(), // 当前场景主导情绪（必须从上面的枚举里挑）
    mental_state: z.string().optional(), // 精神状态文字描述（如"因痛失挚友，整日借酒消愁，神情有些恍惚"）
    reputation_change: z.number().optional(), // 名声改动
    state_of_mind_change: z.number().optional(), // 心境改动
    alignment: z.enum(["正道", "魔道", "中立"]).optional(), // 阵营跳槽
    sect: z.string().optional(), // 门派跳槽/被开除
    spiritual_root: z.string().optional(), // 灵根变化（如从"伪灵根"蜕变为"天灵根"）
    realm: z.string().optional(), // 境界大提升（如"金丹期一层"）
    race: z.string().optional(), // 种族变化（从"人类"变成"妖族"或"鬼修"）
  }),
  func: async (args) => JSON.stringify({ success: true, ...args }),
});

// ==============================================================================
// ========== 其他功能性工具 ==========
// ==============================================================================

/**
 * 工具 13：更新与特定 NPC 的人际关系
 * 作用：舔狗成功或者惹怒大佬。好感度在 -100 到 100 之间波动。
 */
export const updateRelationshipTool = new DynamicStructuredTool({
  name: "Update_Relationship",
  description: "Update relationship with NPC. Range: -100 to 100.",
  schema: z.object({
    npc_name: z.string(), // NPC 的名字
    change: z.number(), // 好感度增量。比如 +15（非常高兴）或者 -50（拔刀相向）
  }),
  func: async ({ npc_name, change }) =>
    JSON.stringify({ success: true, npc_name, change }),
});

/**
 * 工具 14：跳过/无事发生
 * 作用：玩家在客栈睡了一觉，或者在大街上闲逛了半天啥事也没遇上。
 * AI 会调用这个工具，并给出一个合理的借口（Reason），用来推进游戏时间。
 */
export const skipTool = new DynamicStructuredTool({
  name: "Skip",
  description: "Nothing happened.",
  schema: z.object({ reason: z.string() }), // 没发生事情的原因，如"路上很平静，只有清风拂面"
  func: async ({ reason }) => JSON.stringify({ action: "skip", reason }),
});

/**
 * 工具 15：改变玩家当前所在地点（跑图）
 * 作用：玩家御剑飞行或者步行挪窝。
 * 例如：从"青云门山脚"移动到了"坊市交易区"。
 */
export const changeLocationTool = new DynamicStructuredTool({
  name: "Change_Location",
  description: "Change player location.",
  schema: z.object({ location: z.string() }), // 新的目标地点名字
  func: async ({ location }) =>
    JSON.stringify({ success: true, new_location: location }),
});

/**
 * 工具 16：触发境界突破/渡劫判定
 * 作用：修仙小说里最精彩的"逆天改命，迎接雷劫"环节。
 * AI 判定玩家是否突破成功，并根据结果改写玩家的境界。
 */
export const breakthroughTool = new DynamicStructuredTool({
  name: "Check_Breakthrough",
  description: "Check realm breakthrough.",
  schema: z.object({
    result: z.enum(["SUCCESS", "FAIL"]), // 两个结果：SUCCESS（突破成功，可喜可贺）或 FAIL（突破失败，道行受损）
    new_realm: z.string().optional(), // 如果成功，新境界叫啥（如"元婴期初期"）
    realm_change: z.string().optional(), // 突破时的异象或文字描述（如"天空乌云密布，九道天雷轰然落下..."）
  }),
  func: async ({ result, new_realm }) => JSON.stringify({ result, new_realm }),
});

/**
 * 工具 17：写入游戏图鉴/万象百科（Codex）
 * 作用：类似于开放世界游戏里的"图鉴系统"。
 * 当玩家第一次认识某个重磅 NPC、听到某个远古宗门、或是看到奇特草药时，
 * AI 会写一条百科词条锁进图鉴里，方便玩家随时翻阅历史记录。
 */
export const writeCodexTool = new DynamicStructuredTool({
  name: "Write_Codex",
  description:
    "Add an entry to the codex. Call when player encounters a new NPC, location, item, or sect.", // 告诉 AI：遇到新的人、地方、物品或门派，赶紧来这建个档案
  schema: z.object({
    name: z.string(), // 图鉴条目的名字
    entry_type: z.enum(["npc", "location", "item", "sect"]), // 百科分类（人物、地点、物品、宗门）
    description: z.string(), // 详细的百科介绍
    metadata: z.record(z.string(), z.any()).optional(), // 附加隐藏数据，选填
  }),
  func: async (args) => {
    if (_cid) {
      try {
        // 依然是丢进向量数据库，格式化为带有 [Codex] 标签的内容，方便以后玩家输入"XX是谁来着？"时进行模糊搜索
        await storeVector(
          _cid,
          "Codex: " +
            args.name +
            " [" +
            args.entry_type +
            "]\n" +
            args.description,
          { type: "codex", name: args.name, entry_type: args.entry_type },
        );
      } catch (e) {
        console.error(e);
      }
    }
    return JSON.stringify({
      success: true,
      name: args.name,
      type: args.entry_type,
    });
  },
});

/**
 * 工具 18：写游戏日志/修仙传记（Journal）
 * 作用：这就像游戏里的"主线任务简报"或"前情提要"。
 * 注意：说明书强调了【不要每回合都调】，只有在故事刚开始、发生史诗级反转、或者一个章节/副本结束时才写。
 * 这样可以精简长效记忆，提炼出精彩的主线大纲。
 */
export const writeJournalTool = new DynamicStructuredTool({
  name: "Write_Journal",
  description:
    "Write a journal entry summarizing story events. Call when a story begins, a major twist occurs, or a story arc ends. Do NOT call every turn.",
  schema: z.object({
    title: z.string(), // 日志标题，如"血色禁地惊魂记"
    content: z.string(), // 精简的内容纪要
    entry_type: z
      .enum(["story_start", "major_twist", "story_end", "general"])
      .optional(), // 日志类型：序章开启、重大转折、完美谢幕、普通记录
  }),
  func: async ({ title, content, entry_type }) => {
    if (_cid) {
      try {
        // 记录在英雄传记/编年史中
        await storeVector(_cid, "Journal: " + title + "\n" + content, {
          type: "journal",
          title: title,
          entry_type: entry_type || "general",
        });
      } catch (e) {
        console.error(e);
      }
    }
    return JSON.stringify({ success: true, title: title });
  },
});

/**
 * 工具 19：搜索历史对话
 * 作用：当AI需要回忆之前发生过的剧情、NPC、物品或事件时，调用此工具模糊搜索历史记录。
 */
function isVectorItemWithMeta(
  x: unknown,
): x is { metadata?: { type?: string }; content?: string } {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  const meta = o.metadata;
  return (
    typeof meta === "object" &&
    meta !== null &&
    typeof (meta as any).type === "string"
  );
}
// ==============================================================================
// ========== 局面管理工具 (Situation Director) ==========
// ==============================================================================

export const updateSituationTool = new DynamicStructuredTool({
  name: "Update_Situation",
  description: `管理当前剧情局面的生命周期。局面是叙事的最小单元，每个局面有完整的发酵→高潮→收束→结束流程。

  【何时调用】
  - action='create': 当检测到新局面产生时（旧局面结束、玩家行为触发新冲突、伏笔引出新事件）
  - action='update_status': 当局面自然推进到下一阶段时（冲突升级、真相揭露、关键抉择做出）
  - action='end': 当局面已有明确结果时（冲突解决、玩家离开、关键NPC死亡、真相查明）
  - action='add_outcome': 当玩家行为导致出现新的可能结局时

  【重要原则】
  - 一个局面至少持续2-3轮对话才能推进阶段，禁止一回合内连续推进
  - 局面结束时必须填写actual_outcome
  - type说明: conflict=冲突战斗, exploration=探索发现, social=社交互动, opportunity=机缘奇遇, mystery=悬疑解谜`,
  schema: z.object({
    action: z.enum(["create", "update_status", "end", "add_outcome"]).describe("操作类型"),
    situation_id: z.string().optional().describe("要操作的局面ID（create时自动生成）"),
    // create 参数
    title: z.string().optional().describe("[create] 局面标题，如'赵虎的刁难'"),
    type: z.enum(["conflict", "exploration", "social", "opportunity", "mystery"]).optional().describe("[create] 局面类型"),
    trigger: z.string().optional().describe("[create] 触发原因"),
    npcs: z.array(z.string()).optional().describe("[create] 参与NPC名字列表"),
    player_goal: z.string().optional().describe("[create] 玩家在此局面中的目标（系统推断，不强制）"),
    possible_outcomes: z.array(z.string()).optional().describe("[create] 可能结局列表，尽可能多列几个(3-8个)"),
    linked_situation: z.string().optional().describe("[create] 关联的上一个局面ID"),
    // update_status 参数
    status: z.enum(["brewing", "climax", "resolution", "ended"]).optional().describe("[update_status/end] 新局面状态"),
    // end 参数
    actual_outcome: z.string().optional().describe("[end] 实际发生的结局"),
    // add_outcome 参数
    new_outcome: z.string().optional().describe("[add_outcome] 新增的可能结局描述"),
  }),
  func: async (args) => {
    if (args.action === "create") {
      const id = "sit-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      return JSON.stringify({
        success: true,
        action: "create",
        situation: {
          id,
          title: args.title,
          type: args.type || "conflict",
          trigger: args.trigger,
          npcs: args.npcs || [],
          player_goal: args.player_goal || "",
          possible_outcomes: args.possible_outcomes || ["其他可能结局（由AI后续补充）"],
          linked_foreshadowing: [],
          linked_situation: args.linked_situation || null,
          status: "brewing",
          startTurn: 0, // 由rule engine填入实际回合数
          updatedAt: Date.now(),
        },
      });
    }
    return JSON.stringify({ success: true, ...args });
  },
});

export const createForeshadowingTool = new DynamicStructuredTool({
  name: "Create_Foreshadowing",
  description: `埋下伏笔或回收已有伏笔。伏笔是跨局面的叙事线索，会在合适时机自然回收。

  【何时调用】
  - resolved=false: 埋下新伏笔。场景中出现了暂时无法解释的线索（神秘物品、可疑人物、未解之谜）
  - resolved=true: 回收伏笔。当前场景自然触及了之前埋下的线索，让它重新出现并推动剧情

  【重要】伏笔不要硬塞，只在场景自然允许时才回收。一个伏笔可以跨多个局面，不必急于回收。`,
  schema: z.object({
    foreshadowing_id: z.string().optional().describe("伏笔ID（新建时自动生成，回收时必填）"),
    title: z.string().optional().describe("[新建] 伏笔标题"),
    description: z.string().optional().describe("[新建] 伏笔描述，包含线索细节"),
    related_situation: z.string().optional().describe("[新建] 关联的当前局面ID"),
    resolved: z.boolean().default(false).describe("是否回收此伏笔"),
    resolve_note: z.string().optional().describe("[回收时] 回收说明，描述伏笔如何融入当前场景"),
  }),
  func: async (args) => {
    if (!args.resolved) {
      const id = "fs-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      return JSON.stringify({
        success: true,
        action: "create_foreshadowing",
        foreshadowing: {
          id,
          title: args.title,
          description: args.description,
          related_situation: args.related_situation || "",
          plantedTurn: 0,
          resolved: false,
        },
      });
    }
    return JSON.stringify({
      success: true,
      action: "resolve_foreshadowing",
      foreshadowing_id: args.foreshadowing_id,
      resolve_note: args.resolve_note,
    });
  },
});

export const searchHistoryTool = new DynamicStructuredTool({
  name: "Search_History",
  description:
    "Search past conversation history and game events. Use when you need to recall what happened before, who the player met, what items they obtained, or any past events. Query with keywords.",
  schema: z.object({
    query: z.string().describe("Search keywords for past events"),
    limit: z.number().optional().default(5).describe("Max results to return"),
  }),
  func: async ({ query, limit }) => {
    if (!_cid) return JSON.stringify({ success: false, results: [] });
    try {
      const results = await searchVectors(_cid, query, limit || 5);
      const filtered = results
        .filter(isVectorItemWithMeta)
        .filter(
          (r) =>
            r.metadata!.type === "summary" || r.metadata!.type === "history",
        )
        .map((r) => r.content);
      if (filtered.length === 0) {
        // 如果没找到特定历史，回退到通用搜索
        const all = results.map((r: any) => r.content);
        return JSON.stringify({ success: true, results: all });
      }
      return JSON.stringify({ success: true, results: filtered });
    } catch (e) {
      return JSON.stringify({ success: false, results: [] });
    }
  },
});

// ==============================================================================
// ========== 最终导出与辅助函数 ==========
// ==============================================================================

/**
 * 将上面定义的所有 17 个工具打包成一个大数组（工具箱）。
 * 稍后，这个大数组会被一股脑地塞给 AI。
 * AI 在回复玩家输入时，会开启"火眼金睛"，在这个数组里挑出最合适的 1 个或多个工具来配合使用。
 */
export const gameTools = [
  generateItemTool,
  generateNpcTool,
  generateLocationTool,
  generateSectTool,
  backpackAddItemsTool,
  backpackReduceItemsTool,
  consumeItemTool,
  modifyStatsTool,
  modifyTechniquesTool,
  modifyTraitsTool,
  modifyMentalTool,
  updateRelationshipTool,
  skipTool,
  changeLocationTool,
  breakthroughTool,
  writeJournalTool,
  writeCodexTool,
  searchHistoryTool,
  updateSituationTool,
  createForeshadowingTool,
];

/**
 * 辅助查找函数：根据名字从工具箱里抓取某个具体的工具。
 * 就像在工具箱里根据"扳手"或者"螺丝刀"的名字，把它抽出来使用。
 * @param name 工具的唯一标识字符串 (例如 'Generate_NPC')
 * @returns 返回对应的工具对象，如果没找到就返回 undefined
 */
export function findToolByName(
  name: string,
): DynamicStructuredTool | undefined {
  return gameTools.find((t) => t.name === name);
}
