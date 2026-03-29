const { PlayerData, StateMachina } = require("D:/xiuxian/xiuxian/server/fs");
const { World_Rule } = require("./ai");

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
      description: `查询世界观,设定,功法,物品,法宝,丹药等等各种数据的工具,检测到用户询问:什么,啥,有什么用,介绍等等关键词时,使用当前工具给用户解惑,如果要查询多个词语,请务必多次使用
        【核心任务】
1.  分析用户的当前行为、场景、意图；
2.  可以多次调用查询工具,已加入rag检索,所以建议直接查询整句话,不要拆开,然后可以多次查询,同时,请务必查询相关联的多个信息,
查询工具Query_Data一定是最高优先级调用的工具,调用其他工具前,一定要搭配调用查询工具Query_Data
(只有一种情况不需要调用查询工具,那就是用户回复的是无意义的动作,比如开始游戏,但如果是战斗或者攻击,还是要调用查询的,因为其虽然是动作,但是有意义,需要判断双方实力等等)
  从以下维度逐一判断是否需要查询，只要有不确定的信息，就必须调用查询工具：
    - 【场景】：用户当前所在的地点、环境设定；
    - 【物品】：用户提到的所有物品的价值、品阶、用途；
    - 【规则】：当前行为涉及的修仙界规则（坊市交易、杀人夺宝、突破等）；
    - 【设定】：用户提到的所有专有名词的设定；
    - 【行为】：用户执行的某个行为,所关联的所有事物;
3.  只要你认为缺少任何信息会影响后续判断，就必须调用查询工具，直到你认为信息足够为止。允许连续调用多次查询工具。
4.  如果实在没有任何查询和突破检查,没有任何回复,不要返回空,而是调用Skip:如果用户的发送对话,实在是让你无法调用任何工具,那就直接调用Skip工具就行,绝对不要返回空

        `,
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
      description: `这是一个根据前文,生成剧情的工具,要求符合起承转合的节奏,同时如果用户的选择会影响剧情发展走向,则必须重新修改剧情,调用此工具,根据用户的选择,修改剧情使其合理.
      【输入信息】
      你将获得以下信息，必须作为生成剧情的唯一依据：
      - 用户当前背景Init_Plot
      - 最近剧情摘要Plot（如果有,放在下面了）。
      - 用户本次行动userinput
      - 整体逻辑(世界观设定)
      - 查询结果,包括用户背包和面板
      - 当前地点,环境StateMachina.now_location

      【生成要求】
0. *极度重要*:如果用户此次行为对剧情并无影响,没有什么重大决定,则调用Skip工具跳过,如仅仅是买个东西,就没必要修改原大纲
1. 剧情必须包含完整的四部分：开端（Beginning）、发展（Continuation）、转折（Change）、结局（SummingUp），每部分用最精炼的语言描述核心事件，避免任何修饰和多余描述。
2. 开端：直接点明用户当前需要但难以实现的目标，并立刻制造一个危机。
3. 发展：用户解决危机并获得收获；为后续埋伏笔；加入一个小爽点；保持一段相对放松的节奏。
4. 转折：引入一个更大的危机，同时回收之前的所有伏笔，并给用户新的希望。
5. 结局：危机解除，用户变强并收获；有一段休憩时间；为未来剧情留下铺垫。
6. 剧情必须与用户当前状态和意图紧密相关，所有事件应合理衔接。
7. 可在剧情中自然提及需要后续生成的物品、人物或场景（例如“遇到一只受伤的妖兽”、“发现一株灵草”），但无需详细描述，只需留下生成线索即可。
8. 如果时用户背景Init_Plot:${
        PlayerData.background
      }不为空,则你的行为逻辑将有所改变,你将生成一段更符合背景Init_Plot的开端剧情,只使用正叙,不要倒叙,不要插叙,请注意,目的只有一个,迅速让用户代入,让用户爽


9.如果原流程中就有剧情Plot:${JSON.stringify(
        StateMachina.Plot,
        null,
        2,
      )},请在此基础上进行修改或拓展,而非重新创建一段全新剧情,如果为空,才重新根据背景Init_Plot创建
10. 请仔细阅读用户面板和背包,确保剧情导致的数据变化,能对得上面板,比如境界不能错,面板写的是炼气期三层,你却在剧情中误将其当作五层等等
11. 生成的剧情中，人物境界必须符合当前地点StateMachina.now_location的战力范围。默认为战力范围为角色境界-1至角色境界+1这个范围,比如筑基期,那就是从练气到金丹期都有,不过越高等级的人物越少.若需出现更高境界的人物，请说明其来此地的合理理由（如隐居、受伤、路过）。
12. 生成的剧情中,npc的行为逻辑等等,都要符合当前地点的规则,行事风格等等,比如宗门内禁止斗法,私自战斗,而黑市则经常有抢劫,黑吃黑等等
13. 核心新增：剧情四阶段必须严格绑定对应修仙流派风格（根据Init_Plot或用户行为匹配最优流派），禁止脱离流派写通用剧情，具体要求见各阶段详细说明.
14. 开局禁忌：开端禁止直接触发战斗，危机需贴合流派核心冲突（如羞辱、排挤、资源剥夺等），战斗仅作为后续阶段的可选冲突，而非开局必选项。

【可用信息】
---
用户原始输入（判断用户行为对剧情的影响）：
${StateMachina.userInput}
查询结果(包括背包,面板等等)
${StateMachina.QueryResult}
当前地点(没有则尊崇默认规则):
${JSON.stringify(StateMachina.now_location, null, 2)}
---

        以下是一些基本的剧情流派和风格,可以参考着写:
        生成的剧情要开头强情绪,此处给出几个开头风格,请务必参考,选出最符合原背景的一条:
      a.废柴流：主角资质极差，遭宗门/家族抛弃，后获奇遇逆袭成神。
      b.退婚流：主角被未婚妻当众退婚，受尽羞辱，发奋修炼，最终强势打脸。
      c.扮猪吃虎流：主角表面平庸普通，实则隐藏实力，关键时刻一鸣惊人，震惊全场。
      d.豪强回归流：曾是顶级势力嫡系，因故流落凡间，多年后强势归来，夺回属于自己的一切。
      e.种田流：不热衷战斗，专注炼丹、炼器、种药等辅助职业，靠技术和商业积累资本，壮大势力。
      f.奇遇流：意外发现仙人遗迹、秘宝或神兽幼崽，获得逆天传承，从此踏上强者之路。
      g.打脸流：主角被轻视、嘲笑、排挤，却在关键时刻展现实力，让所有看不起他的人目瞪口呆。
      h.家破人亡流：一夜之间宗门被灭、家族覆灭，主角背负血海深仇，踏上复仇之路。
      i.复仇流：主角曾被至交/同门陷害，身败名裂，今朝归来，誓要讨回公道。
      j.替身流：主角被当作他人的替身，终有一天揭竿而起，挣脱枷锁，活成自己。
      k.背锅流：主角无辜替人背黑锅，被世人唾弃，历经磨难后真相大白，还自己清白。
      l.师徒背叛流：主角为师父/门派奉献一切，却被无情抛弃，后另有机缘，终让背叛者悔不当初。
      m.赘婿翻身流：主角入赘世家，受尽白眼，一朝崛起，让整个家族仰望。
      n.被逐出师门流：主角因“资质平庸”被赶出山门，后凭借毅力与机缘，成就远超师门。
      o.宿敌流：主角与命中宿敌从少年斗到中年，一路相爱相杀，最终一决高下。  
      请别忘记,此处要结合原背景Init_Plot,二次创作的
        【逻辑铁则】
      - 所有人物行为必须符合其境界、实力和身份。高境界对低境界有压制，低境界不可能主动挑衅高境界，更不可能“试图夺取”。
      - 重大事件（如金丹期修士获胜、邀请主角）必须有合理铺垫或动机。
      - 战斗结果必须基于实力对比，不能出现以弱胜强（除非有特殊法宝或机缘，需在剧情中明确说明）。
      - 人物动机要清晰，不能无缘无故做出不合常理的行为。
      - 具体逻辑请务必遵照底层逻辑(世界观设定):${World_Rule}
  `,
      parameters: {
        type: "object",
        required: ["Beginning", "Continuation", "Change", "SummingUp", "clue"],
        properties: {
          Beginning: {
            type: "string",
            description: `这是剧情的开端,要求:
          1,给一个用户当前需要的,而且无法实现的目标;
          2,立刻给用户制造危机
          3. 必须【强情绪开头】，直接给用户无法实现的目标 + 制造危机(危机不一定是战斗,也可以是各种负面,包括压迫,嘲讽,任务等等,具体可以参考流派,流派里面写的都是危机)
          4. *强制*:严格贴合选中的修仙流派(废柴/退婚/扮猪吃虎等)定制开局，目标与危机完全匹配流派核心矛盾
          5. *强制*:禁止开局直接安排战斗冲突，优先使用流派对应的羞辱、排挤、轻视、困境、不公等强情绪危机
          6. *强制*:100%结合用户Init_Plot背景，让流派开局与用户身份、处境完全贴合
            `,
          },
          Continuation: {
            type: "string",
            description: `这是剧情的发展,要求:
          1,用户解决了刚刚的危机,获得了对应收获
          2,要对之后的剧情进行铺垫,伏笔
          3,要制造小爽点,比如打脸,众人震惊等等
          4,这里要稍微悠闲一段时间,不要立刻进入转折,给用户一段时间的放松剧情
          5. *强制*:解决危机的方式、爽点设计、放松剧情均严格贴合对应修仙流派
          6. *强制*:伏笔与流派主线（逆袭/复仇/打脸/成长）深度绑定，不设置无关伏笔
          7. *强制*:放松剧情符合流派场景逻辑（如宗门流派在宗门内休憩，黑市流派在坊市闲逛）
            `,
          },
          Change: {
            type: "string",
            description: `这是剧情的转折,要求:
          1,本以为之前的小危机没事,结果引来了更大的危机,转折
          2,然后要给用户更大的希望
          3,同时之前的所有伏笔,在这里都要进行收回
          4. 保持情绪张力，符合修仙节奏
          5. *强制*:大危机严格对应流派核心矛盾（如退婚流引来了未婚妻家族施压，废柴流引来了宗门长老的驱逐）
          6. *强制*:给予的希望与流派逆袭/成长主线直接挂钩，符合流派逻辑
          7. *强制*:禁止强行安排战斗转折，优先使用阴谋、身份曝光、势力打压、机缘显现等流派式转折
            `,
          },
          SummingUp: {
            type: "string",
            description: `这是剧情的最后,要求:
          1,危机解除,用户变强,收获了很多东西
          2,然后要给用户一段较长时间的休憩,休闲剧情剧情
          3,完美收尾当前流派剧情
          4,同时为下一段剧情的开始铺垫,确保下次可以合理过渡
          5. *强制*:成长、收获、实力提升完全匹配流派爽点逻辑，不脱离流派设定
          6. *强制*:休憩场景、休闲内容严格贴合流派与当前地点规则
          7. *强制*:收尾闭环当前阶段流派剧情，下一段剧情铺垫延续流派主线，不突兀跳转
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
          "power_distribution",
          "level_range",
          "rules",
          "peace_orno",
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
          power_distribution: {
            type: "string",
            description: "主要势力（宗门、家族、魔修等）及关系。",
          },
          level_range: {
            type: "string",
            description: "此地常见修士的境界范围（如炼气～元婴）。",
          },
          rules: {
            type: "string",
            description: "特殊规则（如禁止斗法、魔气弥漫等）。",
          },
          peace_orno: {
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

  //修改状态机:地图
  {
    type: "function",
    function: {
      name: "Current_Location",
      description:
        "更新玩家当前所在地图。当剧情中明确玩家移动到新地点时，调用此工具。",
      parameters: {
        type: "object",
        required: ["location"],
        properties: {
          location: {
            type: "string",
            description:
              "新地点的名称（必须与已生成的地图名称一致，如“XX地点坊市”、“青云宗”）",
          },
        },
      },
    },
  },

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

      注意,各个信息的生成不要乱来,而是要互相关联,互相有联系,如一个普普通通的散修,不可能拥有逆天功法,如天级功法,或者是一个灵根中没有火属性的人,他不能学会火系功法,以此类推

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
              background: {
                type: "string",
                description: `背景描述,要求如下:
                1, 尽量参考以下流派,生成一个可以吸引用户的背景,当然,也可以自己想:
      a.废柴流：主角资质极差，遭宗门/家族抛弃，后获奇遇逆袭成神。
      b.退婚流：主角被未婚妻当众退婚，受尽羞辱，发奋修炼，最终强势打脸。
      c.扮猪吃虎流：主角表面平庸普通，实则隐藏实力，关键时刻一鸣惊人，震惊全场。
      d.豪强回归流：曾是顶级势力嫡系，因故流落凡间，多年后强势归来，夺回属于自己的一切。
      e.种田流：不热衷战斗，专注炼丹、炼器、种药等辅助职业，靠技术和商业积累资本，壮大势力。
      f.奇遇流：意外发现仙人遗迹、秘宝或神兽幼崽，获得逆天传承，从此踏上强者之路。
      g.打脸流：主角被轻视、嘲笑、排挤，却在关键时刻展现实力，让所有看不起他的人目瞪口呆。
      h.家破人亡流：一夜之间宗门被灭、家族覆灭，主角背负血海深仇，踏上复仇之路。
      i.复仇流：主角曾被至交/同门陷害，身败名裂，今朝归来，誓要讨回公道。
      j.替身流：主角被当作他人的替身，终有一天揭竿而起，挣脱枷锁，活成自己。
      k.背锅流：主角无辜替人背黑锅，被世人唾弃，历经磨难后真相大白，还自己清白。
      l.师徒背叛流：主角为师父/门派奉献一切，却被无情抛弃，后另有机缘，终让背叛者悔不当初。
      m.赘婿翻身流：主角入赘世家，受尽白眼，一朝崛起，让整个家族仰望。
      n.被逐出师门流：主角因“资质平庸”被赶出山门，后凭借毅力与机缘，成就远超师门。
      o.宿敌流：主角与命中宿敌从少年斗到中年，一路相爱相杀，最终一决高下。  
                
      生成的功法,战技,技艺(身法,和其他法门),背包物品等等的设定参考:
      "## 基本概念\n修仙界中，任何具有特殊效用的物品（包括功法、丹药、法宝、符箓、阵法等）均按“天地玄黄”四阶划分品级，每阶又细分为上、中、下三品。品阶越高，物品蕴含的灵力越精纯、威力越强、效果越显著，同时对使用者的修为境界要求也越高。\n\n## 品阶划分\n- **黄阶**：基础品阶，对应炼气、筑基期修士使用。黄阶下品多为入门级物品，黄阶中品适用于练气中期，黄阶上品可达练气后期,筑基前期。\n- **玄阶**：进阶品阶，对应筑基,金丹修士使用。玄阶下品可满足筑基期后期需求，玄阶中品适用于筑基中期，玄阶上品可达金丹初期左右。\n- **地阶**：高阶品阶，对应金丹期及元婴修士使用。地阶下品可匹配金丹中后期，地阶中品适用于金丹后期，地阶上品可达化神初期。\n- **天阶**：顶级品阶，对应化神修士使用。\n\n## 品阶与境界对应关系\n- 黄阶物品：炼气期可催动，筑基期可发挥全部威力。\n- 玄阶物品：筑基期可催动，金丹期可发挥全部威力。\n- 地阶物品：金丹期可催动，元婴修士可发挥全部威力。\n- 天阶物品：元婴及以上境界可催动。\n\n## 各类型物品品阶特点\n- **功法**：品阶决定修炼速度、灵力上限、附带神通等。高阶功法往往有特殊修炼条件。\n- **丹药**：品阶决定药力、丹毒含量、适用境界。高阶丹药可突破瓶颈、延年益寿。\n- **法宝**：品阶决定攻击/防御威力、灵性、成长性。\n- **符箓**：品阶决定法术威力、范围、持续时间。\n- **阵法**：品阶决定覆盖范围、困杀能力、持久性。\n\n## 注意事项\n- 低阶修士无法使用高阶物品，强行使用会导致反噬。\n- 同阶物品中，上品比下品价值高数倍甚至数十倍。\n- 某些特殊物品可能突破常规品阶限制，但极为罕见。"

                `,
              },
              level: {
                type: "string",
                description:
                  "境界，如'炼气期一层',一般开局请尽量低,一层或者二层,绝对不要超过炼气期五层,越低越好",
              },
              numerical_cultivation: {
                type: "string",
                description: `修为，格式'当前/上限'，如'0/200',参考:
                ## 基本概念\n境界乃修士吸纳天地灵气、淬炼自身、感悟大道后达成的实力层级，是修仙界衡量一切实力的核心标准。境界每提升一阶，修士的灵力总量、肉身强度、神魂力量、寿元上限都会迎来质的飞跃，低阶修士在高阶修士面前几乎无反抗之力，唯有逆天灵宝或禁忌功法可勉强弥补差距。\n\n## 境界等级划分\n### 人界（基础境界）\n- 炼气期：0～2000修为，每200修为为一层，共十层。寿元上限100年。\n- 筑基期：2000～10000修为，分前期、中期、后期、圆满。寿元上限200年。\n- 金丹期：10000～100000修为，分前期、中期、后期、圆满。寿元上限500年。\n- 元婴期：100000～1000000修为，分前期、中期、后期、圆满。寿元上限1000年。\n- 化神期：1000000～10000000修为，分前期、中期、后期、圆满。寿元上限2000年，圆满可破碎虚空飞升灵界。\n\n### 灵界（进阶境界）\n- 炼虚期 → 合体期 → 大乘期 → 渡劫期，渡劫成功可飞升仙界。寿元随境界大幅增长，大乘期近乎与天地同寿。
                `,
              },
              spiritual_root_type: {
                type: "string",
                description:
                  "灵根类型，如'火灵根',具体是其具有几种元素类型,一般来说,是5种,金木水火土,但是也有变异灵根,常见属性为雷、冰、风、暗等,这个概率约为百分之一,你自己看着生成",
              },
              spiritual_root_grade: {
                type: "string",
                description:
                  "灵根等级，如'三灵根',如果灵根只有一个元素,是天灵根,如果有两个元素,等级是地灵根,如果有三个元素,叫三灵根,如果有四个,或者五个元素了,那就是杂灵根,也叫伪灵根",
              },
              spiritual_power: {
                type: "string",
                description:
                  "灵力，格式'当前/上限',如20/100,请注意,这里的上限一定是100,改变的只是前面的数字罢了",
              },
              potential: {
                type: "string",
                description:
                  "根骨（0-20）,格式如:12/20,代表角色的天赋,这个比较随机,不过世家子弟,一般有很好的天材地宝,所以根骨好一点,以此类推,请参考其角色背景生成",
                minimum: 0,
                maximum: 20,
              },
              fortune: {
                type: "string",
                description:
                  "气运（0-20）,格式如:12/20,代表角色运气,这个纯随机,没有任何因素的改变的",
                minimum: 0,
                maximum: 20,
              },
              comprehension: {
                type: "string",
                description:
                  "悟性（0-20）,格式如:12/20,代表角色学习速度,一般来说,越是孤立之人,其悟性就越高,也参考背景来生成吧",
                minimum: 0,
                maximum: 20,
              },
              talent: {
                type: "array",
                description: `天赋列表，每个元素为字符串,没有则填'无',起名请不要带"天赋"二字,要有逼格一点,然后天赋,具体就是这个人有什么样的资质,也得参考背景,如剑道的宗门子弟,也许有剑道天赋等等,也得结合其功法和战技等等各种属性进行生成,联系其余属性,多思考,天赋也可生成不止一种`,
                items: { type: "string" },
              },
              cultivation_technique: {
                type: "array",
                description: `【主修/辅修功法列表】修仙核心体系，决定修炼速度、道基、境界上限；
                  同一修士仅允许1门主修功法，辅修不超过2门；
                  无功法则填
                  [{ "name": "无", "grade": "无", "type": "无", "attribute": "无", "core_effect": "无", "proficiency": "无", "adaptation": "无" }]`,
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description:
                        "功法名称（古风逼格，不含‘功法’二字，如：青元诀、焚天诀、混元经）",
                    },
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
                    name: {
                      type: "string",
                      description:
                        "战技名称（古风逼格，不含‘战技’二字，如：焚天掌、裂地拳、霸王刀法）",
                    },
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
                    name: {
                      type: "string",
                      description:
                        "身法名称（古风逼格，不含‘身法’二字，如：轻身术、不动涟漪、缩地成寸）",
                    },
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
                  "其他法门列表（炼丹、炼器、阵法,其他所有功能的法门等），各个属性没有则填'无',请注意,这是法门,技术,不是物品,如'探测术','驯兽术'等等其他非战斗,身法法门,请结合背景等等参数综合填写,一般来说,每个修士都普遍会一些,比如感知危机的探测术,隐匿气息的匿踪术,还有特殊宗门如万兽宗,也许会驯兽术等等,请仔细思考",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description:
                        "法门名称（古风逼格，不含‘法门’二字，如：沼泽术(用来将土地化为沼泽)、点石成金、炼丹术）",
                    },
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

//第五层
const layer5Names = [
  "Backpack_additems",
  "Skip",
  "Backpack_reduceitems",
  "Player_changeAttribute",
  "PlayerStats_AddTechnique",
  "Technique_Add",
  "Check_Breakthrough",
  "Current_Location",
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
