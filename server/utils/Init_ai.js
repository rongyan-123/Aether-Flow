const { pipeline } = require("chromadb-default-embed");
const { InitTools } = require("./aitools");
const { ChromaClient } = require("chromadb");

//世界观设定
const World_Rule = `
    // ==============================================
// 一、核心基调（凡人流灵魂）
// ==============================================
// 这是一个天地不仁、弱肉强食、大道独行的修仙世界，没有天命之子，没有无偿善意，所有修士的唯一终极目标是「提升修为、延长寿元、飞升长生」。
// 修士行事核心准则：谨慎苟活为上，无利不起早，不沾无用因果，财不露白，不轻易暴露底牌，遇无把握的风险优先跑路，杀人夺宝是修仙界常态。

// ==============================================
// 二、境界&寿元铁则（核心数值体系）
// ==============================================
// 修为境界严格绑定寿元、战力，境界碾压一切，低阶修士在高阶修士面前毫无反抗之力（除非有逆天宝物），寿元耗尽必死，无任何例外。
// 
// 人界核心境界 | 核心特征 | 寿元上限
// 炼气期 | 引气入体，修仙入门，可使用低阶符箓、法器 | 100年
// 筑基期 | 道基稳固，可御器飞行，脱离凡俗，宗门中坚力量 | 200年
// 金丹期 | 丹田结丹，寿元大增，可开辟洞府，为宗门长老/一方霸主 | 500年
// 元婴期 | 金丹碎、元婴生，神魂不灭可夺舍重生，人界顶级战力，宗门宗主级 | 1000年
// 化神期 | 元婴化神，可破碎虚空，飞升灵界，人界天花板 | 2000年
// 
// *高阶境界（灵界/仙界）：炼虚→合体→大乘→渡劫→真仙→金仙→太乙→大罗→道祖，仅作背景，不做核心展开

// ==============================================
// 三、世界观绝对铁则（AI必须严格遵守）
// ==============================================
// 1. 因果铁则：万事皆有因果，沾因果必遭反噬，高阶修士极度避讳无用因果，不会无故出手帮人、不会随意树敌。
// 2. 功法铁则：功法/战技分「天、地、玄、黄」四阶，每阶分上、中、下三品，品阶越高威力越强、修炼难度越大，高阶功法被宗门/世家垄断，极其稀有，不可随意编造。
// 3. 善意铁则：修仙界无无偿善意，所有帮助、馈赠都标好了代价，无事献殷勤必有所图，不可生成“高阶修士无条件帮低阶修士”的内容。
// 4. 坊市铁则：坊市是修士通用交易场所，内有禁制禁止私斗，是唯一的安全交易区；出了坊市，无规则约束，杀人夺宝是常态。
// 5. 机缘铁则：所有机缘都伴随致命风险，秘境、古洞、遗迹中，死亡率远大于机缘获取率，不会有“天上掉馅饼”的机缘。

// ==============================================
// 四、核心资源&品阶体系
// ==============================================
// 1. 通用货币：灵石，分下品、中品、上品、极品，兑换比例1000:1，是修炼、交易、布阵的核心资源。
// 2. 核心道具：按品阶从低到高分为「法器→宝器→灵器→古宝→通天灵宝」，对应修士境界使用，高阶道具不可被低阶修士随意催动。
// 3. 辅助资源：丹药、符箓、阵法、妖兽材料，均按天地玄黄四阶分品，品阶越高效果越强、炼制难度越大，低阶修士不可随意获得高阶资源。

// ==============================================
// 五、世界基础架构
// ==============================================
// - 人界：修士核心活动范围，分天南、乱星海、大晋、慕兰草原等区域，最高修为上限为化神期，化神后可飞升灵界。
// - 灵界：人界飞升后的高阶世界，灵气更浓郁，修为上限更高，分多个大族、天渊、魔界等区域。
// - 仙界：修仙界最终层级，道祖为天花板，掌控天地法则。
    `;
//chatGPT地址
// 原 API 地址
const API_URL = "https://api.chatanywhere.tech/v1/chat/completions";
// 换成备用地址（二选一）
//const API_URL = "https://api.chatanywhere.com.cn/v1/chat/completions";
// 或
// const API_URL = "https://api.openai-proxy.com/v1/chat/completions";
//豆包:
//2.0
//const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
//const API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses";

////
const API_KEY = "sk-bM1XLNYL7b3hchiNNtHoW7ZJFb4YTt4voQEZmrN2pB88HouC";

//豆包key
//const API_KEY = "feb774e9-0893-403e-81bf-16f969eae728";
//=========================== ai模型 ==========================
//支持founction_calling功能的模型:
//[200额度]:
// gpt-3.5-turbo, gpt-4o-mini , gpt-4.1-mini, gpt-4.1-nano
// gpt-5-mini , gpt-5-nano
//[30额度]:
// deepseek-v3   ,  deepseek-v3-2-exp
//[5额度]:
//gpt-5.2、gpt-5.1、gpt-5   gpt-4o、gpt-4.1

//不支持fc功能的模型,只能用来纯思考,别用就行:
//deepseek-r1   (一天30次)
const LLM = "gpt-3.5-turbo";
//const LLM = "doubao-seed-2-0-pro-260215";

//===================================================================
async function Init_AI(userInformation) {
  //rag检索准备,此处是查询函数
  console.log("正在加载模型...");
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/bge-small-zh-v1.5",
  );
  console.log("模型加载完成");
  //此处是chromaDB向量数据库的服务器
  console.log("正在加载rag向量数据库");
  const client = new ChromaClient({ path: "http://localhost:1111" });
  //此处是集合(修仙设定)
  const collection = await client.getCollection({ name: "cultivation" });
  console.log("rag向量数据库已完成");
  console.log("成功进入Init_AI");
  console.log("用户信息为:", userInformation);
  try {
    console.log("🔴 1, 进入世界初始化.");
    const prompt = `
    【角色设定】
你是一位修仙世界的【开局生成器】。用户即将开始新的修仙之旅，你需要根据用户提供的基础信息，生成三个不同风格、各具特色的人物开局模板，供用户选择。
每个模板将决定用户的初始背景、背包物品和基础面板。同时生成的背景等等,要符合底层世界观${World_Rule}
    【参考信息】
  用户信息：${JSON.stringify(userInformation, null, 2)}
  【核心任务】
1,调用三次工具Init_Player, 生成三个修仙开局模板，每个模板需包含以下要素：
  模板名称：简洁概括，例如“散修开局”、“宗门弟子”、“世家子弟”、“魔修后裔”、“机缘眷顾”等，需体现该模板的核心特点。
  背景描述：用一段话（约30-50字）简述该模板的出身、初始处境和故事背景，为后续剧情埋下伏笔。
  初始背包：包含若干物品，每个物品应有名称、价值（以灵石为单位，整数）、数量（整数）。物品需符合修仙世界观，如法器、丹药、材料、灵石等，数量和价值需合理，避免开局过于强大或贫瘠。
  初始面板：包含以下基础属性，数值需符合修仙设定且彼此协调,具体可查看工具.
  境界：起始境界，通常为炼气期某一层（如“炼气期一层”）。
  修为：格式为“当前值/上限值”，例如“0/200”（炼气期每层200修为）。请注意,这里尽量低,越低越好
  灵根类型：如“天灵根”、“变异灵根”、“双灵根”、“三灵根”、“伪灵根”等，需符合模板背景。
  灵根等级：如“一品”、“二品”或更具体的品阶，若无则填“无”。
  灵力：格式“当前值/上限值”，例如“100/100”。
  根骨：数值范围0-20，影响修炼速度和突破成功率。  
  气运：数值范围0-20，影响机缘和事件结果。
  悟性：数值范围0-20，影响功法学习速度和熟练度。
  可选额外属性：如功法、战技、身法等，但非必须，可酌情添加。
2,根据对应背景background,调用工具Generate_Location,生成用户所在的初始地点
  【注意事项】
1, 调用三次 Init_Player 工具，每次传入一个完整的模板。player_data 必须包含所有指定字段（姓名、年龄、性别等），
2, player_inventory 必须是非空数组。
3, 每次调用时，必须完整提供以下字段：
  - player_data: 包含 name, age, gender, background, level, cultivation, spiritual_root_type, spiritual_root_grade, spiritual_power, potential, fortune, comprehension, talent, technique, combat_skill, movement_skill
  - player_inventory: 一个非空数组，每个物品包含 name, value, mount
  注意：所有字段都必须有值，不得省略。
4,调用Generate_Location时,一定要确保和Init_Player同步,不要出现角色背景中的地点和创建的地点不同这种情况

  【可使用的工具】
初始化面板和背包Init_Player
生成地图Generate_Location

【生成要求】
多样性：三个模板应各有侧重，例如一个偏战斗、一个偏修炼、一个偏机缘，或一个散修、一个宗门、一个世家等，确保用户有不同选择。
平衡性：所有属性值应合理，避免出现极端不平衡（如一个模板开局即有顶级法宝），但可以有适当差异以体现风格。
世界观一致性：所有物品、属性、背景必须符合修仙世界的基本逻辑，不得出现现代或科幻元素。
语言风格：描述语言需通俗易懂，带有修仙氛围，但无需过于文言。
  `;
    //创建最终的message
    const messages = [
      {
        id: 1,
        role: "system",
        content: prompt,
      },
    ];
    //创建配置对象
    const Aiconfiguration = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM,
        messages: messages,
        temperature: 0.7,
        tools: InitTools,
        tool_choice: "auto",
      }),
    };

    const response = await fetch(API_URL, Aiconfiguration);
    if (!response) {
      console.error("");
    }
    const data = await response.json();

    console.log("第一次发送api结束,输入消耗token:", data.usage.prompt_tokens);
    console.log(
      "第一次发送api结束,输出消耗token:",
      data.usage.completion_tokens,
    );
    console.log("第一次发送api结束,总计消耗token:", data.usage.total_tokens);

    const AiReply = data.choices[0].message;
    //AI文本回复
    const Aicontent = AiReply.content;
    console.log("Ai文本回复为", Aicontent);

    //AI返回工具
    const Aitools = AiReply.tool_calls;

    //总返回结果
    let result = [];
    if (Aitools && Aitools.length > 0) {
      console.log("进入开局初始化工具");
      let count = 0;
      for (const tool of Aitools) {
        const toolname = tool.function.name;
        const toolArg = JSON.parse(tool.function.arguments);
        count++;
        //
        if (toolname === "Init_Player") {
          console.log("成功进入初始化面板");
          console.log("当前是第", count, "次调用Init_Player工具");

          console.log("Ai生成的面板", toolArg.player_data);
          console.log("Ai生成的背包", toolArg.player_inventory);
          if (!toolArg.player_data || !toolArg.player_inventory) {
            console.error("无效的模板参数，跳过");
            continue;
          }
          result.push({
            player_data: toolArg.player_data,
            player_inventory: toolArg.player_inventory,
          });
        }
        //创建地图
        if (toolname === "Generate_Location") {
          console.log("成功进入地图创建");
          console.log("当前地图为:", toolArg);
          const level3_description = `地点名称:\n${toolArg.name}\n所在区域:\n${
            toolArg.region
          }\n危险等级:\n${toolArg.danger_level}\n简要描述:\n${
            toolArg.description
          }\n势力分布:\n${toolArg.power_distribution}\n战力范围:\n${
            toolArg.level_range
          }\n特殊规则:\n${toolArg.rules}\n和平状态:\n${
            toolArg.peace_orno
          }\n常驻人物列表:\n${JSON.stringify(
            toolArg.inhabitants,
          )}\n此地特有物品列表:\n${JSON.stringify(
            toolArg.bound_items,
          )}\n关联地点列表:\n${JSON.stringify(toolArg.bound_locations)}\n`;

          const Map = {
            id: `Map_${Date.now()}`,
            name: toolArg.name,
            description: level3_description,
            metadata: {
              power_distribution: toolArg.power_distribution,
            },
          };
        }
      }
    }

    return result;
    ///结束
  } catch (error) {
    console.log("Init_AI 错误详情:", error);
  }
}
module.exports = { Init_AI };
