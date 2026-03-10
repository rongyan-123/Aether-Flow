//======================== ai调用工具 ============================
const tools = [
  //查询背包
  {
    type: "function",
    function: {
      name: "Query_Backpack",
      description: `这是一个读取背包内物品的工具,当用户的行为和话语涉及到使用物品,就需要读取背包.`,
      parameters: {
        type: "object",
        required: ["read_or_no"],
        properties: {
          read_or_no: {
            type: "string",
            enum: ["yes"],
            description: "只需要判断是否填yes就行,判断是否读取背包数据",
          },
        },
      },
    },
  },
  //查询面板
  {
    type: "function",
    function: {
      name: "Query_PlayerStats",
      description: `这是一个读取用户面板的工具,当用户的行为和话语涉及到面板内的属性和功法等等,就需要读取面板.`,
      parameters: {
        type: "object",
        required: ["read_or_no"],
        properties: {
          read_or_no: {
            type: "string",
            enum: ["yes"],
            description: "只需要判断是否填yes就行,判断是否读取面板数据",
          },
        },
      },
    },
  },

  {
    //添加物品
    type: "function",
    function: {
      name: "Backpack_additems",
      description:
        "这是一个向背包中添加物品的工具(可批量添加),当用户获得(包括且不限于捡到,抢到,击杀获得等等)物品时,在背包数据中添加物品,绝对不能拆分成多次调用",
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
        "查询世界观,设定,功法,物品,法宝,丹药等等各种数据的工具,检测到用户询问:什么,啥,有什么用,介绍等等关键词时,使用当前工具给用户解惑,如果要查询多个词语,请务必多次使用",
      parameters: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            description: `当进行查找时,由于拥有rag检索,所以建议不拆分句子,而是直接查询整句`,
          },
        },
      },
    },
  },
  //跳过工具
  {
    type: "function",
    function: {
      name: "Skip",
      description:
        "当用户的需求只是查询信息、不需要修改数据或生成内容，或者查询结果里没有相关信息时，调用此工具表示跳过执行层，直接进入总结层",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "简短说明为什么跳过，必须基于查询结果",
          },
        },
        required: ["reason"],
      },
    },
  },

  //{}
  //ai修改个人面板
  //修改某些属性
  {
    type: "function",
    function: {
      name: "Player_changeAttribute",
      description: `这是一个修改用户基本属性的工具,请根据用户行为和选择,还有查询结果,自己思考如何修改,包括:
      当前年龄age,
      当前境界level,
      当前修为numerical_cultivation,
      当前灵根spiritual_root_type,
      当前灵根等级 spiritual_root_grade,
      灵力spiritual_power,
      根骨potential,
      气运fortune,
      悟性comprehension,
      `,
      parameters: {
        type: "object",
        required: [], //可选,没有要求
        properties: {
          age: {
            type: "number",
            description:
              "用户当前人物的年龄,根据用户选择导致的结果,事件发展,剧情发展,修炼时间等等,进行修改",
          },
          level: {
            type: "string",
            description: `当用户在炼气期时,达到对应数值就直接进阶,炼气十层,每200修为是一层,0-200是一层,200-400是二层,以此类推
              当用户在之后的境界时,同一境界内,不需要突破,比如筑基前期,中期,后期,圆满,也是直接进阶的,筑基从2000开始,10000结束,自行划分前中后期和圆满
              之后的金丹,元婴,化神,也都是你自己决定当前修为处于什么同一个大境界内的什么时期
              如果是大境界的突破,则需要非常详细的判断是否成功
              `,
          },
          numerical_cultivation: {
            type: "number",
            description:
              "当前修为数值，代表修炼积累的总量。根据事件、修炼、丹药等增加或减少。",
            minimum: 0,
          },
          spiritual_root_type: {
            type: "string",
            description:
              "灵根类型，例如：天灵根、变异灵根、双灵根、三灵根、伪灵根等。",
          },
          spiritual_root_grade: {
            type: "string",
            description:
              "灵根等级或品阶，如：一品、二品等，或者根据设定自定义。",
          },
          spiritual_power: {
            type: "number",
            description:
              "灵力值，代表当前可用的灵力总量，用于驱动功法、法术等。",
            minimum: 0,
          },
          potential: {
            type: "number",
            description: "根骨，代表修炼天赋和潜力，影响修炼速度和瓶颈突破。",
            minimum: 0,
          },
          fortune: {
            type: "number",
            description: "气运，影响奇遇、事件结果、突破成功率等。",
            minimum: 0,
          },
          comprehension: {
            type: "number",
            description: "悟性，影响学习功法、领悟技能的速度和深度。",
            minimum: 0,
          },
        },
      },
    },
  },

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

  //生成剧情
  {
    type: "function",
    function: {
      name: "Generate_Plot",
      description:
        "这是一个生成剧情的工具,要求符合起承转合的节奏,同时如果用户的选择会影响剧情发展走向,则必须重新修改剧情,调用此工具,根据用户的选择,修改剧情使其合理",
      parameters: {
        type: "object",
        required: ["Beginning", "Continuation", "Change", "SummingUp"],
        properties: {
          Beginning: {
            type: "string",
            description: `这是剧情的开端,要求:
            1,给一个用户当前需要的,而且无法实现的目标;
            2,立刻给用户制造危机
            `,
          },
          Continuation: {
            type: "string",
            description: `这是剧情的发展,要求:
            1,用户解决了刚刚的危机,获得了对应收获
            2,要对之后的剧情进行铺垫,伏笔
            3,要制造小爽点,比如打脸,众人震惊等等
            4,这里要稍微悠闲一段时间,不要立刻进入转折,给用户一段时间的放松剧情
            `,
          },
          Change: {
            type: "string",
            description: `这是剧情的转折,要求:
            1,本以为之前的小危机没事,结果引来了更大的危机,转折
            2,然后要给用户更大的希望
            3,同时之前的所有伏笔,在这里都要进行收回
            `,
          },
          SummingUp: {
            type: "string",
            description: `这是剧情的最后,要求:
            1,危机解除,用户变强,收获了很多东西
            2,然后要给用户一段较长时间的休憩,休闲剧情剧情
            3,同时为下一段剧情的开始铺垫,确保下次可以合理过渡
            `,
          },
        },
      },
    },
  },

  ///
  //检查境界突破
  {
    type: "function",
    function: {
      name: "Check_Breakthrough",
      description: `这是一个检查境界突破的工具,当用户在大境界突破时,
      即炼气期-筑基,筑基-金丹,金丹-元婴,元婴-化神时,调用此工具进行判断,看用户当前背包,面板,是否可以支撑突破
      具体的境界突破设定如下:
      {{
        练气进阶筑基:
    核心要求:达到练气大圆满(十层,修为达到2000)
    成功率：
    无筑基丹：0.1%（1000 人里 1 人）
    1 颗筑基丹：30%（100 人里 30 人）
    3 颗筑基丹：50%（100 人里 50 人）
    天灵根 + 3 颗筑基丹 + 聚灵阵：80% (此处看灵根和天赋等等)
    其他方式也可以增加成功率,譬如高阶修士护法,捡到各种天材地宝,坐落某阵法等等,此处不再赘述

    筑基进阶金丹:
    核心要求:达到筑基后期大圆满(修为达到10000)
    成功率：
    无结金丹：0.01%（10000 人里 1 人）
    1 颗结金丹：10%（100 人里 10 人）
    3 颗结金丹 + 高阶聚灵阵：25% 
    其他方式也可以增加成功率,譬如高阶修士护法,捡到各种天材地宝,坐落某阵法等等,此处不再赘述

    金丹进阶元婴:
    核心条件:达到金丹圆满(修为达到100000)
    可选增加突破概率的道具(一些经典道具,不是全部的,可能还有更多天材地宝):元婴丹 ×1、化婴草 ×3、地心乳 ×1,九转还魂丹、辟魔大阵、元婴老祖护持等等
    成功率：
    无元婴丹：0.001%（100000 人里 1 人  ）
    1 颗元婴丹 + 化婴草 ×3,地心乳 ×1：3%（100 人里 3 人）
    3 颗元婴丹 + 完整材料 + 护山大阵：10%
    其他方式也可以增加成功率,譬如高阶修士护法,捡到各种天材地宝,坐落某阵法等等,此处不再赘述

    元婴进阶化神:
    核心条件:达到元婴圆满(修为达到1000000)
    可选增加突破概率的道具(一些经典道具,不是全部的,可能还有更多天材地宝):化神丹 ×1、空间法则感悟,阵法,飞升台、空间灵宝、灵界坐标
    成功率：
    无化神丹：0.0001%（1000000 人里 1 人）
    1 颗化神丹 + 空间感悟：0.5%（200 人里 1 人）
    3 颗化神丹 + 飞升台：2%
    其他方式也可以增加成功率,譬如高阶修士护法,捡到各种天材地宝,坐落某阵法等等,此处不再赘述
      }}
      具体判断情况如下:
      第一优先级:是否满足突破核心条件(境界设定里面有写),如果不满足,就直接突破失败,突破概率0%
      第二优先级:是否拥有辅助类道具,比如丹药,阵法等等(境界设定里面有写),只是为了提高成功率,除开最基本的道具,每多拥有一件道具,增加5%的突破几率
      (一般来说,为了让用户体验良好,只要以上两个优先级都有,其实会让用户突破几率大幅度增高)

      `,
      properties: {
        result: {
          type: "string",
          description:
            "返回的是一个结果,说明用户是否成功突破,只需要给出结果即可,然后给出解释就行",
        },
      },
    },
  },
];

const layer1Names = [
  "Query_Data",
  "Skip",
  "Query_Backpack",
  "Query_PlayerStats",
];

const layer1Tools = tools.filter((tool) => {
  return layer1Names.includes(tool.function.name);
});

const layer2Names = [
  "Backpack_additems",
  "Skip",
  "Backpack_reduceitems",
  "Player_changeAttribute",
  "PlayerStats_AddTechnique",
  "Technique_Add",
  "Generate_Plot",
  "Check_Breakthrough",
];

const layer2Tools = tools.filter((tool) => {
  return layer2Names.includes(tool.function.name);
});

module.exports = { layer1Tools, layer2Tools, tools };
