//======================== ai调用工具 ============================
export const tools = [
  {
    //添加物品
    type: "function",
    function: {
      name: "Backpack_additems",
      description:
        "【只能调用一次】这是一个向背包中添加物品的工具(可批量添加),当用户获得(包括且不限于捡到,抢到,击杀获得等等)物品时,在背包数据中添加物品,绝对不能拆分成多次调用",
      parameters: {
        type: "object",
        required: ["items"], // 必填：必须传入物品数组
        properties: {
          // ==============================================
          // 第一层：表示这个工具需要传递的参数是一个数组
          // ==============================================
          items: {
            type: "array",
            description: "要添加的物品列表,必须包含所有物品,不得遗漏",
            // ==============================================
            // 第二层：数组里面的每一个值,都是一个对象,每一个对象包含三个属性
            // ==============================================
            items: {
              type: "object",
              required: ["name", "value", "mount"], // 单个物品的必填字段
              properties: {
                name: {
                  type: "string",
                  description: "物品的具体名字,必须是中文",
                },
                value: {
                  type: "number",
                  description: "单个此物品的具体价值,只能是正整数",
                  minimum: 1, //注意是minimum,别写错了
                },
                mount: {
                  type: "number",
                  description: "所有此物品的具体数量,只能是正整数",
                  minimum: 1,
                },
              },
            },
          },
        },
      }, //parameters括号
    },
  },
  {
    //删除物品
    type: "function",
    function: {
      name: "Backpack_reduceitems",
      description:
        "【只能调用一次】这是一个减少背包中物品的工具(可批量减少),当用户使用(包括且不限于使用,丢弃,贩卖等等)物品时,在背包数据中减少物品,绝对不能拆分成多次调用",
      parameters: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            description: "要减少的物品列表,必须包含所有物品,不得遗漏",
            items: {
              type: "object",
              required: ["name", "value", "mount"],
              properties: {
                name: {
                  type: "string",
                  description: "物品的具体名字,必须是中文",
                },
                value: {
                  type: "number",
                  description: "单个此物品的具体价值,只能是正整数",
                  minimum: 1, //注意是minimum,别写错了
                },
                mount: {
                  type: "number",
                  description: "所有此物品的具体数量,只能是正整数",
                  minimum: 1,
                },
              },
            },
          },
        },
      },
    },
  },

  //{}
  //ai搜索设定数据库
  //流程,ai提取用户想问的内容,直接返回对应的名字
  {
    type: "function",
    function: {
      name: "Query_Data",
      description:
        "查询世界观,设定,功法,物品,法宝,丹药等等各种数据的工具,检测到用户询问:什么,啥,有什么用,介绍等等关键词时,使用当前工具给用户解惑,如果要查询多个词语,请务必多次使用,而非单次",
      parameters: {
        type: "object",
        required: ["queryName"],
        properties: {
          queryName: {
            type: "string",
            description: `当进行查找时,请必须将句子拆分,拆成单个词语,或者关键字进行查找,比如用户询问"结丹是多少修为",那么就提取"结丹"或"修为"等关键字,进行查找,绝对不能直接使用工具查询一整句话,或多个词语,绝对不能加入标点符号,不要修饰词`,
          },
        },
      },
    },
  },

  //{}
  //ai修改个人面板
  //增加所会的功法
  {
    type: "function",
    function: {
      name: "PlayerStats_AddTechnique",
      description: `【最高优先级·强制规则】在做任何判断之前，必须先调用 Query_Data 工具，搜索该法门的相关信息,然后再调用这个工具！

【适用场景】仅当用户有提到「学习这本修炼功法」,或者其他学习行为时,调用此工具。

【明确边界】此工具只负责「长期修炼、提升修为」的法门，绝对不负责战斗、移动、辅助等技能。

【判断标准（按优先级）】
1. 【优先搜索】：先调用 Query_Data 搜索，根据搜索结果判断；
2. 【搜索不到时的标准】：修炼功法是指用于长期修炼、提升修为、增加灵力/修为上限的法门；
3. 【具体例子】：练气篇引导决、天衍觉、混元功、紫霞功等。

【绝对禁止】
- 禁止在没有调用 Query_Data 搜索的情况下自行判断；
- 禁止把战斗/移动/辅助技能当成修炼功法。`,
      parameters: {
        type: "object",
        required: ["name", "grade", "level"],
        properties: {
          name: {
            type: "string",
            description: "这是功法名字",
          },
          grade: {
            type: "string",
            description:
              "这是功法等级,共四级:天地玄黄,每一级里面各有三个品阶:上中下,书写时,这样写:天阶上品,玄阶下品,以此类推,品阶+小品阶的格式",
          },

          //后续要加属性就写在这里
        },
      },
    },
  },

  //增加技艺
  {
    type: "function",
    function: {
      name: "Technique_Add",
      description: `【最高优先级·强制规则】在做任何判断之前，必须先调用 Query_Data 工具，搜索该法门的相关信息,然后再调用这个工具！

  【适用场景】仅当用户有提到「学习」,或者其他学习行为时,调用此工具。

  【明确边界】此工具只负责「非修炼」的技能，绝对不负责长期修炼提升修为的法门。

  【判断流程（严格按顺序执行）】
  1. 【第一步：优先搜索】：必须先调用 Query_Data 工具，搜索该法门的相关信息；
  2. 【第二步：判断是功法还是技艺】：
    - 若搜索结果显示是「修炼功法」，不要调用此工具，去调用 PlayerStats_AddTechnique；
    - 若搜索结果显示是「技艺」，或搜索不到，继续下一步；
  3. 【第三步：判断技艺类型】：
    - 战技：用于战斗、攻击、防御的技能（例子：八极崩、大荒囚天指、铁布衫）；
    - 身法：用于速度、移动、躲避的技能（例子：踏雪无痕、轻身术、凌波微步）；
    - 其他：不属于战技和身法的，一律归为其他（例子：探测术、炼丹术、炼器术）。

  【绝对禁止】
  - 禁止在没有调用 Query_Data 搜索的情况下自行判断；
  - 禁止把长期修炼提升修为的法门当成技艺。`,
      parameters: {
        type: "object",
        required: ["type", "name", "grade", "level"],
        properties: {
          type: {
            type: "string",
            enum: ["战技", "身法", "其他法门"],
            description:
              "战技:战斗、攻击、防御, 身法:跟速度,移动,躲避等等有关, 其他法门:不属于战斗和身法的,都算作其他法门",
          },
          name: {
            type: "string",
            description: "战技的名字",
          },
          grade: {
            type: "string",
            description:
              "这是战技等级,共四级:天地玄黄,每一级里面各有三个品阶:上中下,书写时,这样写:天阶上品,玄阶下品,以此类推,品阶+小品阶的格式,依旧优先查询后再决定究竟是什么品阶",
          },
          level: {
            type: "string",
            enum: ["初入"],
            description: "默认等阶是初入,总计四个:初入,小成,大成,圆满",
          },
        },
      },
    },
  },
];
