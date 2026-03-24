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

  //添加物品
  {
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

  //删除物品
  {
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
      当前声望reputation,
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
              境界突破:根据前面查询的面板,突破工具,和用户行为,以及ai总结,决定是否更改为新的境界
              `,
          },
          reputation: {
            type: "string",
            description: `格式:无名小卒(0/1000)
            根据前面查询的面板和用户行为,以及ai总结,决定是否更改`,
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
        "这是一个根据前文,生成剧情的工具,要求符合起承转合的节奏,同时如果用户的选择会影响剧情发展走向,则必须重新修改剧情,调用此工具,根据用户的选择,修改剧情使其合理",
      parameters: {
        type: "object",
        required: ["Beginning", "Continuation", "Change", "SummingUp", "clue"],
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
          clue: {
            type: "string",
            description: `一个对后续可能出现的事物的解释,可以在这里提到后续需要生成的物品,人设,场景等等,为后续生成做铺垫`,
          },
        },
      },
    },
  },

  //生成物品
  {
    type: "function",
    function: {
      name: "Generate_Items",
      description:
        "根据场景、剧情、需求等生成一件修仙物品，并绑定到对应的人物、地点或势力。语言简洁，避免浪费token。",
      parameters: {
        type: "object",
        required: [
          "name",
          "look",
          "value",
          "level",
          "effect",
          "owner",
          "location",
          "plot_hint",
        ],
        properties: {
          name: {
            type: "string",
            description: "物品名称，修仙风格，符合物品特性。",
          },
          look: {
            type: "string",
            description: "外貌描写，不超过30字。",
          },
          value: {
            type: "string",
            description: "价值（灵石），格式：大约XXX-XXX灵石。",
          },
          level: {
            type: "string",
            description: `
            品阶,
            品阶设定参考：
            物品按天地玄黄分阶，每阶上中下三品。
            黄阶（炼气/筑基）、玄阶（金丹/元婴）、地阶（化神/灵界）、天阶（仙界）。
            下品,对应当前阶的前期,中品,对应中期,上品,对应后期
            填写格式如“天阶上品”。
    `,
          },
          effect: {
            type: "string",
            description: "用途、效果、适用条件.",
          },
          // 绑定字段（可选，但推荐关联）
          owner: {
            type: "string",
            description:
              "物品当前所有者（人物名或势力名），若无人持有则填“无主”。",
          },
          location: {
            type: "string",
            description: "物品所在区域（如地图名、宗门、洞府等）。",
          },
          plot_hint: {
            type: "string",
            description: "与剧情相关的伏笔或用途（可选）。",
          },
        },
      },
    },
  },

  //生成人设
  {
    type: "function",
    function: {
      name: "Generate_Character",
      description:
        "根据剧情生成一位修仙人物，绑定其背景、势力、所在地及关联物品。语言简洁，避免浪费token。",
      parameters: {
        type: "object",
        required: [
          "name",
          "look",
          "background",
          "personality",
          "combat_power",
          "status",
          "goal",
          "location",
          "affiliation",
          "items",
        ],
        properties: {
          name: {
            type: "string",
            description: "姓名，古风，符合性格特质。",
          },
          look: {
            type: "string",
            description: "外貌描写,请结合其他信息书写,注意区分男女。",
          },
          background: {
            type: "string",
            description: "家庭背景、过往历史，简洁且关联性格和行为逻辑。",
          },
          personality: {
            type: "string",
            description: "性格特质，几句话概括，关联背景。",
          },
          combat_power: {
            type: "string",
            description:
              "战力综合（境界、功法、技艺、武器等），简洁且符合身份。",
          },
          status: {
            type: "string",
            description: "身份地位，（如XX宗门掌门、散修等）。",
          },
          goal: {
            type: "string",
            description: "当前目标，服务剧情，关联性格经历。",
          },
          // 绑定字段
          location: {
            type: "string",
            description: "常驻地或当前所在区域（地图名）。",
          },
          affiliation: {
            type: "string",
            description: "所属势力（宗门、家族等）。",
          },
          items: {
            type: "array",
            items: { type: "string" },
            description: "随身携带或拥有的重要物品名称列表（可选）。",
          },
        },
      },
    },
  },

  //生成地图
  {
    type: "function",
    function: {
      name: "Generate_Location",
      description:
        "根据剧情生成一个修仙世界的地点（如宗门、秘境、城池等），绑定其势力、居民、规则及关联物品/人物。语言简洁。",
      parameters: {
        type: "object",
        required: [
          "name",
          "region",
          "danger_level",
          "description",
          "势力分布",
          "战力范围",
          "规则",
          "和平状态",
          "inhabitants",
          "bound_items",
          "bound_locations",
        ],
        properties: {
          name: {
            type: "string",
            description: "地点名称，修仙风格。",
          },
          region: {
            type: "string",
            description: "所在大陆或大区域（如天南、乱星海）。",
          },
          danger_level: {
            type: "string",
            enum: ["安全", "低危", "中危", "高危", "绝地"],
            description: "危险等级。",
          },
          description: {
            type: "string",
            description: "简要描述，包括环境、氛围、特征（不超过50字）。",
          },
          // 详细属性
          势力分布: {
            type: "string",
            description: "主要势力（宗门、家族、魔修等）及关系。",
          },
          战力范围: {
            type: "string",
            description: "此地常见修士的境界范围（如炼气～元婴）。",
          },
          规则: {
            type: "string",
            description: "特殊规则（如禁止斗法、魔气弥漫等）。",
          },
          和平状态: {
            type: "string",
            enum: ["和平", "冲突", "战争", "混乱"],
            description: "当前局势。",
          },
          // 绑定字段
          inhabitants: {
            type: "array",
            items: { type: "string" },
            description: "常驻或关键人物名称列表,哪怕写无,也不能为空",
          },
          bound_items: {
            type: "array",
            items: { type: "string" },
            description: "此地特有的重要物品名称列表（如镇宗之宝）。",
          },
          bound_locations: {
            type: "array",
            items: { type: "string" },
            description: "包含的子区域或关联地点（如秘境入口）。",
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

  //是否进入第二层叙事规划层判断
  {
    type: "function",
    function: {
      name: "judgment_of_proceed_2",
      description:
        "此工具用于在第一层进行判断,看看是否需要生成,修改剧情,当用户的意图中拥有主动的行为时,影响了剧情时,才需要调用此工具,说明需要进入第二层,如果用户只是询问和聊天,则不需要调用此工具",
      parameters: {
        type: "object",
        required: ["judgment"],
        properties: {
          judgment: {
            type: "string",
            enum: ["yes"],
          },
        },
      },
    },
  },

  ///

  //🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴游戏初始化ai专用

  //生成模板
  {
    type: "function",
    function: {
      name: "Init_Player",
      description: `这是一个生成开局模板的工具,将根据信息自动生成以下内容:
      第一层(面板):
      姓名,年龄,性别,背景描述,境界,修为,灵根类型,灵根等级,灵力,根骨,气运,悟性,天赋,功法,战技,身法
      请注意,此处所有条目,就算没有,也绝对要生成一个"无",不允许直接返回空
      第二层(背包):
      物品名称,物品价值,物品数量


      `,
      parameters: {
        type: "object",
        required: ["player_data", "player_inventory"],
        properties: {
          //面板
          player_data: {
            type: "object",
            description: "请在这里生成面板内容",
            properties: {
              name: { type: "string", description: "姓名" },
              age: { type: "number", description: "年龄" },
              gender: {
                type: "string",
                description: "性别",
                enum: ["男", "女"],
              },
              background: { type: "string", description: "背景描述" },
              level: { type: "string", description: "境界，如'炼气期一层'" },
              numerical_cultivation: {
                type: "string",
                description: "修为，格式'当前/上限'，如'0/200'",
              },
              spiritual_root_type: {
                type: "string",
                description: "灵根类型，如'火灵根'",
              },
              spiritual_root_grade: {
                type: "string",
                description: "灵根等级，如'三灵根'",
              },
              spiritual_power: {
                type: "string",
                description: "灵力，格式'当前/上限',如20/100",
              },
              potential: {
                type: "string",
                description: "根骨（0-20）,格式如:12/20",
                minimum: 0,
                maximum: 20,
              },
              fortune: {
                type: "string",
                description: "气运（0-20）,格式如:12/20",
                minimum: 0,
                maximum: 20,
              },
              comprehension: {
                type: "string",
                description: "悟性（0-20）,格式如:12/20",
                minimum: 0,
                maximum: 20,
              },
              talent: {
                type: "array",
                description: "天赋列表，每个元素为字符串,没有则填'无'",
                items: { type: "string" },
              },
              cultivation_technique: {
                type: "array",
                description:
                  "所会功法列表，每个元素包含 name 和 grade,没有则填'无'",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "功法名称" },
                    grade: {
                      type: "string",
                      description: "品阶，如'黄阶下品'",
                    },
                  },
                  required: ["name", "grade"],
                },
              },
              combat_technique: {
                type: "array",
                description:
                  "战技列表，每个元素包含 name、grade、level,没有则填'无'",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "战技名称" },
                    grade: {
                      type: "string",
                      description: "品阶，如'玄阶上品'",
                    },
                    level: {
                      type: "string",
                      description: "熟练度等级，如'初入'",
                      enum: ["初入", "小成", "大成", "圆满"],
                    },
                  },
                  required: ["name", "grade", "level"],
                },
              },
              movement_technique: {
                type: "array",
                description:
                  "身法列表，每个元素包含 name、grade、level,没有则填'无'",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "身法名称" },
                    grade: {
                      type: "string",
                      description: "品阶，如'玄阶中品'",
                    },
                    level: {
                      type: "string",
                      description: "熟练度等级，如'初入'",
                      enum: ["初入", "小成", "大成", "圆满"],
                    },
                  },
                  required: ["name", "grade", "level"],
                },
              },
              other_technique: {
                type: "array",
                description:
                  "其他法门列表（炼丹、炼器、阵法等），每个元素包含 name、grade、type,没有则填'无',请注意,这是法门,技术,不是物品",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "法门名称" },
                    grade: {
                      type: "string",
                      description: "品阶，如'黄阶中品'",
                    },
                    type: {
                      type: "string",
                      description: "类型，如'炼丹术'、'炼器术'等",
                    },
                  },
                  required: ["name", "grade", "type"],
                },
              },
            },
          },
          //背包
          player_inventory: {
            type: "array",
            description: "初始背包物品列表",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "物品名称" },
                value: {
                  type: "number",
                  description: "物品价值（灵石）",
                  minimum: 0,
                },
                mount: { type: "number", description: "物品数量", minimum: 1 },
              },
              required: ["name", "value", "mount"],
            },
          },
        },
      },
    },
  },
];

//================================================================
const layer1Names = [
  "Query_Data",
  "Skip",
  "Query_Backpack",
  "Query_PlayerStats",
  "judgment_of_proceed_2",
];

const layer1Tools = tools.filter((tool) => {
  return layer1Names.includes(tool.function.name);
});

//第二层工具
const layer2Names = ["Generate_Plot", "Skip"];

const layer2Tools = tools.filter((tool) => {
  return layer2Names.includes(tool.function.name);
});

//第三层工具
const layer3Names = [
  "Generate_Character",
  "Generate_Items",
  "Generate_Location",
  "Skip",
];

const layer3Tools = tools.filter((tool) => {
  return layer3Names.includes(tool.function.name);
});

const layer5Names = [
  "Backpack_additems",
  "Skip",
  "Backpack_reduceitems",
  "Player_changeAttribute",
  "PlayerStats_AddTechnique",
  "Technique_Add",
  "Check_Breakthrough",
];

const layer5Tools = tools.filter((tool) => {
  return layer5Names.includes(tool.function.name);
});

//初始化ai工具
const InitName = ["Init_Player"];

const InitTools = tools.filter((tool) => {
  return InitName.includes(tool.function.name);
});

module.exports = {
  layer1Tools,
  layer2Tools,
  layer3Tools,
  layer5Tools,
  InitTools,
  tools,
};
