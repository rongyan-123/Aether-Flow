const { pipeline, env } = require("chromadb-default-embed");
const { ChromaClient } = require("chromadb");
const {
  layer1Tools,
  layer2Tools,
  layer3Tools,
  layer5Tools,
} = require("./aitools");
//关闭自动寻找模型地址
env.allowRemoteModels = false;
//下载到本地的embedding模型
env.localModelPath = "D:/xiuxian/xiuxian/server/models";
const {
  query_backpack,
  query_playerStats,
  addItem,
  reduceItem,
  add_Cultivation_Technique,
  add_Technique,
  Add_AiItems,
  query_AiItems,
  query_StateMachina,
  ChangePlot,
  AddMaps,
  ChangeLocation,
  ChangeUserInput,
  AddQueryResult,
  assistantadd,
  useradd,
  query_history,
} = require("../fs.js"); //一个点代表当前目录,两个点才是上级目录
const eventBus = require("./eventBus");
//此处要注意,这里导入文件,会优先执行一次文件内部的所有顶层代码,如果有log,也会执行.
//举个例子,就算你ai.js里面没有写log,当执行ai.js时,依旧会先导入fs.js,然后再调用fs.js里面的打印语句,很反直觉,明明执行的是ai文件,却也会优先执行其他文件?
//import { queryName } from "@/StaticData/AllData";
//import { usePlayerStore } from "@/stores/player";
// 1. 全局变量：只加载一次
let embedder;
let collection;
const initRAG = async () => {
  //rag检索准备,此处是查询函数
  console.log("正在加载模型...");
  embedder = await pipeline("feature-extraction", "Xenova/bge-small-zh-v1.5");
  console.log("模型加载完成");
  const client = new ChromaClient({ path: "http://localhost:1111" });
  //此处是集合(修仙设定)
  collection = await client.getCollection({ name: "cultivation" });
  console.log("rag向量数据库已完成");
};

//此处是chromaDB向量数据库的服务器
console.log("正在加载rag向量数据库");

//chatGPT地址
// 原 API 地址
//const API_URL = "https://api.chatanywhere.tech/v1/chat/completions";
// 换成备用地址（二选一）
//const API_URL = "https://api.chatanywhere.com.cn/v1/chat/completions";
// 或
// const API_URL = "https://api.openai-proxy.com/v1/chat/completions";
//豆包:
//2.0
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
//const API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses";

////
//const API_KEY = "sk-bM1XLNYL7b3hchiNNtHoW7ZJFb4YTt4voQEZmrN2pB88HouC";

//豆包key
const API_KEY = "";
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
//const LLM = "gpt-3.5-turbo";
const LLM = "doubao-seed-2-0-pro-260215";

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

// ==================== 核心请求函数 ====================
//分层如下:
//1,数据查询层:第一次发送api,调用查询工具,获取对应数据
//2,执行工具层:第二次发送api,根据数据选择接下来要执行的工具,比如添加物品,添加功法等等,以后的生成剧情也会在这里，战斗判断也会在这里
//3,面向用户层:第三次发送api,读取第一层的查询结果,还有第二层的工具返回结果,给用户做出最后的总结

//该函数拿到的是ai回复,类型是字符串
async function chatWithAI(userInput, Game_start) {
  console.time();
  console.log("成功进入chatWithAI");
  console.log("用户问题", userInput);
  //存入历史记录
  useradd(userInput);
  ChangeUserInput(userInput);
  // 新增这行，看控制台打印了几次
  console.log(
    "=== chatWithAI 函数被触发 ===",
    "时间戳：",
    new Date().getTime(),
  );

  // console.log("🔴 面板原始数据：", realPlayerdata); // 看面板数据是不是真的有内容
  // console.log("🔴 最终给AI的系统提示词：", finalSystemPrompt2); // 看面板占位符到底有没有被替换掉

  // // 收集所有工具的执行结果,放在当前回复中使用
  const toolResult = [];
  //获取第一次查询结果
  const QueryResult = [];
  // //突破情况
  // const breakthrough = [];
  //状态机实例
  const StateMachina = await query_StateMachina();
  const history = await query_history();
  const backpack = await query_backpack();
  const PlayerData = await query_playerStats();
  const AiItems = await query_AiItems();
  //判断是否进入第二层生成剧情
  let Proceed = "";
  //🔴 1, 数据查询层
  try {
    console.log("🔴 1, 进入数据查询层.");
    eventBus.emit("ai-progress", "layer1", "正在查询世界观与设定...");

    //第一层ai提示词,仅使用工具:查询,判断突破
    const prompt = `
  【角色设定】
你是五层架构中的第一层,【查询与思考者】,你的**职责**是：分析用户意图,和使用各种工具对用户行为进行分析,以及查询相关设定和信息,给后续的二层和三层做信息铺垫

【核心任务】
7.  注意,此处要根据用户意图和行为,判断是否进入第二层生成剧情,具体可以查看工具judgment_of_proceed描述
8.  如果历史记录为空,建议调用judgment_of_proceed工具生成开头剧情
9. 当此值Game_start:${Game_start}为false时,一定要调用judgment_of_proceed,同时此刻必须调用查询背包和面板的工具!

【只允许调用的工具列表】
跳过:Skip
查询设定和物品描述等等:Query_Data
查询用户背包:Query_Backpack
查询用户面板:Query_PlayerStats
是否进入第二层叙事规划层judgment_of_proceed_2


【用户当前数据（仅用于理解上下文，绝对不能修改）】
---
用户原始输入：
${userInput}
---

【绝对禁止】
- 禁止有任何修改用户背包、面板数据的想法或行为；
- 禁止编造查询结果；
- 禁止在这一层直接解决用户的“添加/学习”需求，只负责查询信息。
- 绝对禁止返回完全空值,用Skip工具替换空值

【正反例子】
---
✅ 正确示范1：
用户问题：“燃血秘术是什么？”
你的行动：调用 Query_Data，参数 queryName=燃血秘术是什么？

✅ 正确示范2：
用户问题：“把燃血秘术加入我的面板”
你的行动：调用 Query_Data，参数 queryName=把燃血秘术加入我的面板 或 queryName=燃血秘术（注意：只查询，绝对不调用添加工具）

✅ 正确示范3：
用户问题：“我现在要做某某事情”
你的行动：调用 Query_Data,查询当前场景,剧情,相关人设,物品,设定等等,提供足够的信息给后续

✅ 正确示范4：
用户问题：“我现在要突破”
你的行动：调用Check_Breakthrough和Query_Data,直接进行突破判断,同时也要查询一些相关信息给后续的ai解读

❌ 错误示范2：
用户问题：“结丹是多少修为”
你的行动：直接回答“结丹需要十万点修为”，没有调用 Query_Data → 绝对禁止！

❌ 错误示范3：
用户问题：“我现在要跟他战斗”
你的行动：直接回答“好的,战斗开始,他朝你冲来”，没有查询设定,人设,世界观,场景,npc行为逻辑,剧情等等
---

现在，请基于以上所有规则，执行你的任务。
          `;

    //创建最终的message
    const messages = [
      {
        id: 1,
        role: "system",
        content: prompt,
      },
      ...history.chatHistory,
    ];
    const Aiconfiguration = {
      //配置对象
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM,
        messages: messages, //发送以下数据:历史记录,背包
        temperature: 0.7,
        //stream: true, //开启流式输出
        tools: layer1Tools, //工具
        tool_choice: "auto",
      }),
    };

    const response = await fetch(API_URL, Aiconfiguration); //发送并收到回复

    const data = await response.json(); //转为json格式

    //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
    if (!response.ok) {
      console.error("API 授权失败/请求错误：", data.error);
      return "抱歉，API 请求失败（请换个模型）";
    }
    console.log("第一次发送api结束,输入消耗token:", data.usage.prompt_tokens);
    console.log(
      "第一次发送api结束,输出消耗token:",
      data.usage.completion_tokens,
    );
    console.log("第一次发送api结束,总计消耗token:", data.usage.total_tokens);
    //拿到回复中的有效内容
    const AiReply = data.choices[0].message;

    console.log("第一层ai回复:", AiReply.content);
    console.log("检查是否有 tool_calls：", AiReply.tool_calls);

    //开始第一次查询
    if (AiReply.tool_calls && AiReply.tool_calls.length > 0) {
      console.log("成功进入查询");
      //遍历所有工具
      for (const tool of AiReply.tool_calls) {
        const toolname = tool.function.name; //获取工具名字
        const toolArg = JSON.parse(tool.function.arguments); //获取ai返回的参数,此处parse是将JSON格式转为对象格式
        console.log("当前工具:", toolname);
        console.log("当前ai返回的参数:", toolArg);

        //rag检索
        if (toolname === "Query_Data") {
          console.log("进入rag检索工具");
          console.log("当前查询语句:", toolArg.name);
          //此处output已经拿到转为向量后的文本了
          const output = await embedder(toolArg.name, {
            pooling: "mean",
            normalize: true,
          });
          //但是还是要转为js数组,最终这个embeddings就是要查询的向量,由于是二维,[[0.1, 0.2, ...]],所以必须加个[0]
          const embeddings = output.tolist()[0];

          const mid = await collection.query({
            queryEmbeddings: [embeddings],
            nResults: 3,
          });
          const querySetting_Result = mid.documents[0] || ["无"];
          console.log("查询到:", querySetting_Result);

          QueryResult.push(
            `查询结果如下${JSON.stringify(querySetting_Result)}`,
          );
        }

        //查询背包和面板
        if (toolname === "Query_Backpack") {
          console.log("调用读取背包工具中....");

          QueryResult.push(`背包如下:${JSON.stringify(backpack, null, 2)}`);
        }
        if (toolname === "Query_PlayerStats") {
          console.log("调用读取面板工具中....");

          QueryResult.push(`面板如下:${JSON.stringify(PlayerData, null, 2)}`);
        }

        //判断是否进入第二层,第三层
        if (toolname === "judgment_of_proceed_2") {
          console.log("是否需要进入第二层:", toolArg.judgment);
          Proceed = toolArg.judgment;
          console.log("Proceed:", Proceed);
        }
      }
      console.log("查询结束");
      console.log("当前QueryResult内容:", QueryResult);
      AddQueryResult(QueryResult);
      console.log("QueryResult已经成功放入状态机中");
    }
  } catch (error) {
    console.log("第一层出错了", error);
    return "第一层处理失败，请稍后再试。";
  }

  //🔴 2, 叙事规划层
  if (Proceed === "yes") {
    try {
      console.log("🔴 2, 进入第二层,叙事规划层.");
      eventBus.emit("ai-progress", "layer2", "正在生成专属剧情...");

      const level2_prompt = `
      【角色设定】
你是一位修仙世界的剧情架构师，任务是根据提供的上下文,还有用户行为,用户数据，调用Generate_Plot工具，生成新剧情或修改原剧情Plot,最终得到一段符合起承转合结构的剧情大纲。


【输出格式】
直接调用Generate_Plot工具，将各个个部分的文字填入对应参数。无需额外解释。

【可用信息】
---
用户原始输入（判断用户行为对剧情的影响）：
${userInput}
查询结果(包括背包,面板等等)
${QueryResult}
当前地点(没有则尊崇默认规则):
${JSON.stringify(StateMachina.now_location, null, 2)}
---

【示例】
✅ 正确示例（符合逻辑铁则）：
用户输入：“我想去坊市看看有没有好东西。”
上下文：用户修为筑基中期，背包有500灵石，当前在青云宗。
生成的剧情可能如下：
- Beginning：你来到坊市，听闻今晚拍卖会将出现一枚筑基丹，正是你突破所需，但价格高达1000灵石，你囊中羞涩。突然，一个黑衣修士撞了你一下，你发现自己的灵石袋不见了！
- Continuation：你追上前去，施展身法将对方拦住，原来是个炼气期小贼。你夺回灵石，还从他身上搜出200灵石（收获）。此事传开，坊市摊主对你态度好转，愿意低价卖你一瓶聚气丹（小爽点）。你决定先买下聚气丹，再去筹集灵石。
- Change：当你准备离开坊市时，忽然听到远处传来爆炸声，一股魔气冲天而起——有魔修在坊市内作乱！你发现那魔修正是刚才小贼的同伙，他冲你冷笑，显然认出了你（伏笔回收）。
- SummingUp：你与魔修激战，凭借刚买的聚气丹临时提升灵力，最终将其击退（变强）。坊市管理者感谢你，奖励你500灵石，并邀请你参加明晚的拍卖会。你回到洞府休息，准备明天拍下筑基丹（休憩+铺垫）。
- clue:出现人物:小贼,魔修,管理者等等,出现物品:管理者给予的宝物,聚气丹,出现场景:坊市,拍卖会,

❌ 错误示例（违反境界碾压）：
- Beginning：你在灵谷发现一株千年灵草，但一头金丹期妖兽守护在一旁。一个炼气期小修士竟冲上去想抢夺，被妖兽一爪拍飞。（这里小修士主动挑战金丹妖兽，不符合逻辑）
- 修正：应改为小修士远远观望，不敢靠近。

现在，请根据用户的最新输入和当前上下文，生成合适的剧情并调用工具。`;

      const level2_messages = [
        {
          id: 1,
          role: "system",
          content: level2_prompt,
        },
        ...history.chatHistory,
      ];
      const level2_Aiconfiguration = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: LLM,
          messages: level2_messages, //发送以下数据:历史记录,背包
          temperature: 0.7,
          //stream: true, //开启流式输出
          tools: layer2Tools, //工具
          tool_choice: "auto",
        }),
      };
      console.log("当前实体已经有:", AiItems);
      console.log("准备第二次发送api");
      const level2_response = await fetch(API_URL, level2_Aiconfiguration);

      const level2_data = await level2_response.json(); //转为json格式

      //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
      if (!level2_response.ok) {
        console.error("第二层 API 授权失败/请求错误：", level2_data.error);
        return "抱歉,第二层API 请求失败（请换个模型）";
      }
      console.log(
        "第二层发送api结束,输入消耗token:",
        level2_data.usage.prompt_tokens,
      );
      console.log(
        "第二层发送api结束,输出消耗token:",
        level2_data.usage.completion_tokens,
      );
      console.log(
        "第二层发送api结束,总计消耗token:",
        level2_data.usage.total_tokens,
      );
      const level2_AiReply = level2_data.choices[0].message; //拿到回复中的有效内容
      console.log("第二层Ai回复为", level2_AiReply.content);
      console.log("第二层Ai调用工具为", level2_AiReply.tool_calls);

      if (level2_AiReply.tool_calls && level2_AiReply.tool_calls.length > 0) {
        console.log("成功进入第二层ai工具执行");

        for (const tool of level2_AiReply.tool_calls) {
          const toolname = tool.function.name;
          const toolArg = JSON.parse(tool.function.arguments);
          if (toolname === "Generate_Plot") {
            console.log("ai生成答案", toolArg);
            //const newPlot = `起:${toolArg.Beginning}\n承:\n${toolArg.Continuation}\n转:\n${toolArg.Change}\n合:\n${toolArg.SummingUp}\n其余信息:${toolArg.clue}`;
            ChangePlot(toolArg);
            // 替换为最新剧情
            // 在工具的返回中加入一个日志
            toolResult.push(
              `剧情已根据用户行为更新：${JSON.stringify(
                StateMachina.Plot,
                null,
                2,
              )}`,
            );
          }
        }
      } else {
        console.log("抱歉,第二层,没有调用工具");
      }
    } catch (error) {
      console.log("第二层出现错误", error);
      return "第二层处理失败，请稍后再试。";
    }
  }

  //🔴 3, 动态细节层
  if (Proceed === "yes") {
    try {
      console.log("🔴 3, 进入第三层,动态细节层.");
      eventBus.emit("ai-progress", "layer3", "正在生成动态世界...");

      const level3_prompt = `
      【角色】
你是修仙世界的【细节生成器】。你的核心任务有两个,
1,是根据第二层生成的剧情,和已经存在的实体数组new_items，决定是否生成新实体,
2,如果需要生成,则调用相应的工具（Generate_Items、Generate_Character、Generate_Location）来创建剧情中需要的新物品、人物和地点。如果实体数组里面已经有很多相关的数据,则不需要重复生成,直接调用Skip工具跳过


【输入】
1, 你将获得第二层生成的完整剧情（包含开端、发展、转折、结局四个部分）。剧情中可能暗示需要新的物品、人物或地点（例如“遇到一只受伤的妖兽”、“发现一株灵草”、“进入一座废弃洞府”）。
2, 已经存在的实体数组,如果很多实体已经存在,或是剧情中没什么重大新变量,则不需要生成,直接跳过skip就行


【任务(详细版)】
1. 仔细阅读剧情，识别出哪些地方需要生成新的实体（物品、人物、地点）。
2. 为每个需要生成的实体调用对应的工具，一次调用只生成一个实体。可多次调用。
3. 在调用工具时，必须根据剧情上下文填写参数，确保生成的实体与剧情一致，并相互绑定：
   - **物品**：指定其主人（owner）、所在地（location）及可能的剧情伏笔（plot_hint）。
   - **人物**：指定其所在地（location）、所属势力（affiliation）、拥有的物品（items）。
   - **地点**：指定其居民（inhabitants）、特有物品（bound_items）、关联地点（bound_locations）。
4. 所有描述务必简洁，避免浪费token，只需填写必要信息。
5. 如果实体数组new_items中已经存在许多跟剧情相关的实体,则不用重复生成了,但是剧情如果出现new_items中没有提及到的新实体,那就生成
6. 所有实体必须拥有具体名称,不能含糊,不能用某个词语概括,比如古朴丹药,你就要自己根据其用处,想一个名字
7. 所有实体尽量符合剧情,要有相关联系

【输出】
直接调用工具，不要输出任何其他内容。

【工具】
生成npc:Generate_Character
生成物品:Generate_Items
生成地点:Generate_Location
跳过:Skip

【可用信息】
已经生成的实体:${AiItems}
---------------------------
剧情:${JSON.stringify(StateMachina.Plot, null, 2)}


【示例】


反例:
若剧情中提到“你在坊市遇到一位神秘老者，他手中拿着一枚古朴丹药”，则应调用：
- Generate_Character：生成老者，设定其 location 为“坊市”，可能拥有物品 items: ["古朴丹药"]。
- Generate_Items：生成丹药，设定其 owner 为老者，location 为“坊市”，并赋予 effect 等属性。

正确示例:
要有具体名字,不能含糊概括
- Generate_Character：生成老者名字name:XXX，设定其 location 为“XXX处的坊市”，可能拥有物品 items: ["大力丹(或其他)"]。
- Generate_Items：生成丹药，设定其 owner 为老者name:XXX，location 为“XXX处的坊市”，并赋予 effect 等属性。

`;
      const level3_messages = [
        {
          id: 1,
          role: "system",
          content: level3_prompt,
        },
        ...history.chatHistory,
      ];
      const level3_Aiconfiguration = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: LLM,
          messages: level3_messages, //发送以下数据:历史记录,背包
          temperature: 0.7,
          //stream: true, //开启流式输出
          tools: layer3Tools, //工具
          tool_choice: "auto",
        }),
      };

      console.log("第三层,准备发送api");
      const level3_response = await fetch(API_URL, level3_Aiconfiguration);

      const level3_data = await level3_response.json(); //转为json格式

      //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
      if (!level3_response.ok) {
        console.error("第三层 API 授权失败/请求错误：", level3_data.error);
        return "抱歉,第三层API 请求失败（请换个模型）";
      }
      console.log(
        "第三层发送api结束,输入消耗token:",
        level3_data.usage.prompt_tokens,
      );
      console.log(
        "第三层发送api结束,输出消耗token:",
        level3_data.usage.completion_tokens,
      );
      console.log(
        "第三层发送api结束,总计消耗token:",
        level3_data.usage.total_tokens,
      );
      const level3_AiReply = level3_data.choices[0].message; //拿到回复中的有效内容
      console.log("第三层Ai回复为", level3_AiReply.content);
      console.log("第三层Ai调用工具为", level3_AiReply.tool_calls);

      if (level3_AiReply.tool_calls && level3_AiReply.tool_calls.length > 0) {
        console.log("成功进入第三层ai工具执行");

        //开始遍历工具
        for (const tool of level3_AiReply.tool_calls) {
          const toolname = tool.function.name;
          const toolArg = JSON.parse(tool.function.arguments);
          // console.log("生成前检查集合");
          // console.log("collection:", collection);

          //生成人设
          if (toolname === "Generate_Character") {
            console.log("进入生成人设工具");
            //console.log("ai生成结果为:", toolArg);
            const level3_description = `名字:\n${toolArg.name}\n外貌:\n${toolArg.look}\n
            背景和过往历史:\n${toolArg.background}\n
            性格特质:\n${toolArg.personality}\n战力:\n${toolArg.combat_power}\n
            身份:\n${toolArg.status}\n目标:\n${toolArg.goal}\n常驻地或当前所在区域（地图名）:\n${toolArg.location}
            所属势力:\n${toolArg.affiliation}\n随身携带或拥有的重要物品名称列表:\n${toolArg.items}\n`;
            const Character = {
              id: `character_${Date.now()}`,
              name: toolArg.name,
              description: level3_description,
              metadata: {
                combat_power: toolArg.combat_power,
                location: toolArg.location,
                affiliation: toolArg.affiliation,
                items:
                  toolArg.items && toolArg.items.length > 0
                    ? toolArg.items
                    : ["无"], // 如果有 items 字段
              },
            };

            //生成向量
            const vector = (
              await embedder(Character.description, {
                pooling: "mean",
                normalize: true,
              })
            ).tolist()[0];
            console.log("成功生成向量");

            await collection.add({
              ids: [Character.id],
              embeddings: [vector],
              metadatas: [Character.metadata],
              documents: [Character.description],
            });
            console.log("成功放入向量数据库");

            //console.log("此为ai生成的人设:", level3_description);

            //只将名字放入实体数组
            Add_AiItems(toolArg.name);
            //在工具的返回中加入一个日志
            toolResult.push(`第三层,已生成新角色：${level3_description}`);
          }

          //生成物品
          if (toolname === "Generate_Items") {
            console.log("进入生成物品工具");
            // console.log("ai生成结果为:", toolArg);
            const level3_description = `物品名称:\n${toolArg.name}\n物品外貌描写:\n${toolArg.look}\n
            价值:\n${toolArg.value}\n品阶:\n${toolArg.level}\n
            来历、用途、效果、适用条件，可含剧情伏笔:\n${toolArg.effect}\n
            物品当前所有者:\n${toolArg.owner}\n物品所在区域（地图名）:\n${toolArg.location}
            与剧情相关的伏笔或用途:\n${toolArg.plot_hint}\n`;
            const Item = {
              id: `Item_${Date.now()}`,
              name: toolArg.name,
              description: level3_description,
              metadata: {
                owner: toolArg.owner,
                location: toolArg.location,
                plot_hint: toolArg.plot_hint,
              },
            };

            //生成向量
            const vector = (
              await embedder(Item.description, {
                pooling: "mean",
                normalize: true,
              })
            ).tolist()[0];
            console.log("成功生成向量");

            await collection.add({
              ids: [Item.id],
              embeddings: [vector],
              metadatas: [Item.metadata],
              documents: [Item.description],
            });
            console.log("成功放入向量数据库");

            //console.log("此为ai生成的物品:", level3_description);

            //只将名字放入实体数组
            Add_AiItems(toolArg.name);
            //在工具的返回中加入一个日志
            toolResult.push(`第三层,已生成新物品：${level3_description}`);
          }

          //生成地图
          if (toolname === "Generate_Location") {
            console.log("进入生成地图工具");
            // console.log("ai生成结果为:", toolArg);
            const level3_description = `地点名称:\n${
              toolArg.name
            }\n所在区域:\n${toolArg.region}\n危险等级:\n${
              toolArg.danger_level
            }\n简要描述:\n${toolArg.description}\n势力分布:\n${
              toolArg.power_distribution
            }\n战力范围:\n${toolArg.level_range}\n特殊规则:\n${
              toolArg.rules
            }\n和平状态:\n${
              toolArg.peace_orno
            }\n常驻人物列表:\n${JSON.stringify(
              toolArg.inhabitants,
            )}\n此地特有物品列表:\n${JSON.stringify(
              toolArg.bound_items,
            )}\n关联地点列表:\n${JSON.stringify(toolArg.bound_locations)}\n`;
            const newMap = {
              id: `Item_${Date.now()}`,
              name: toolArg.name,
              description: level3_description,
              metadata: {
                // 处理空数组：如果为空或未定义，则替换为 ["无"]
                inhabitants:
                  toolArg.inhabitants && toolArg.inhabitants.length > 0
                    ? toolArg.inhabitants
                    : ["无"],
                bound_items:
                  toolArg.bound_items && toolArg.bound_items.length > 0
                    ? toolArg.bound_items
                    : ["无"],
                bound_locations:
                  toolArg.bound_locations && toolArg.bound_locations.length > 0
                    ? toolArg.bound_locations
                    : ["无"],
                power_distribution: toolArg.power_distribution || "未知", // 字符串字段可设默认值
              },
            };

            //生成向量
            const vector = (
              await embedder(newMap.description, {
                pooling: "mean",
                normalize: true,
              })
            ).tolist()[0];
            console.log("成功生成向量");
            console.log("Map 对象:", newMap);
            console.log("Map.id:", newMap.id);
            console.log("ids 数组:", [newMap.id]);
            await collection.add({
              ids: [newMap.id],
              embeddings: [vector],
              metadatas: [newMap.metadata],
              documents: [newMap.description],
            });
            console.log("成功放入向量数据库");

            //console.log("此为ai生成的地图:", level3_description);
            //存入地图数据,存整个对象,而非单纯的名字
            AddMaps(toolArg);
            //只将名字放入实体数组
            Add_AiItems(toolArg.name);
            //在工具的返回中加入一个日志
            toolResult.push(`第三层,已生成新地图：${level3_description}`);
          }
        }
      } else {
        console.log("抱歉,第三层,没有调用工具");
      }
    } catch (error) {
      console.log("第三层出错了", error);
      return "第三层处理失败，请稍后再试。";
    }
  }

  //🔴 4, 进入面向用户层
  try {
    console.log("🔴 4, 进入面向用户层");
    eventBus.emit("ai-progress", "layer4", "正在生成回复...");

    const level4_prompt = `
   【角色】
   你是五层架构中的第四层:【因果推演师】。你的职责是根据以下所有信息，推演用户行为的结果，并生成一段面向用户的修仙风格回复。回复中必须自然、清晰地描述所有发生的变化（如获得/消耗物品、修为增减、受伤、突破等），让用户能感受到世界的反馈，同时为第五层提供足够的信息。

【输入】
- **用户原始请求**：${userInput}
- **第一层查询结果**：${QueryResult}
- **第二层生成的剧情框架**：${JSON.stringify(StateMachina.Plot, null, 2)}
- **第三层生成的实体**：${toolResult}（物品、人设、地点的摘要列表）
- **世界观底层逻辑**：${World_Rule}

【推演规则】
1. 根据用户意图、剧情框架和当前状态，推演行为结果（胜负、受伤程度、获得/消耗物品、修为变化、突破结果等）。
2. 所有推演必须基于输入信息，符合世界观，不得凭空编造。
3. 如果是在剧情中,尽量不要直接给出全部剧情,而是只给出一个瞬间,或者一个节点结果,不能直接给出用户整个剧情,要引导他进入剧情体验,这是状态机,描述当前角色所在的剧情节点:${
      StateMachina.current_Plot
    }
4(核心).  **逻辑校验**：首先检查第二层剧情框架是否与世界观底层逻辑一致，特别是以下核心规则：
   - **境界碾压**：高一个大境界的修士对低境界有绝对压制，低阶修士不可能主动挑衅或对抗高阶修士（除非有特殊道具或背景，且必须在剧情中明确说明）。
   - **实力匹配**：战斗结果必须基于双方实力对比，不能出现以弱胜强的不合理情况。
   - **因果连贯**：人物行为应有合理动机，事件之间要有因果关系。
   - **设定一致**：所有出现的物品、人物、地点必须符合已有设定（如法宝品阶、丹药功效等）。

   如果发现剧情存在明显违背世界观的设定（例如炼气期小修士试图抢夺金丹期修士的灵草），你必须以世界观为准，重新推演合理的结果，并在回复中体现实际发生的合理情况（例如“那炼气期小修士冲上去，被金丹期修士随手一挥便重伤倒地”）。不得盲目跟随剧情中的不合理元素。
5. 如果用户有某种需求,请在下一段剧情中加入对应的需求,而不是当场拟定一个剧情让用户参与,这样太假了,毫无铺垫,毫无代入感,这个时候你可以根据搜索结果阐述和解释一下他的需求,而非直接拟定剧情
6. 绝对不自己拟定剧情,没有出现的剧情不要乱加,最多只允许修改原剧情中的一些变量,细节.
7. 如果此值Game_start:${Game_start}为false,你的回复语句则需要有所改变,说明游戏在启动阶段,你需要改为符合开头的回复:
  a(最重要),开头先给出场景描写,然后迅速接入剧情,把生成的剧情拆分,让用户进入到当前剧情中,让用户做选择,代入感要强
  b,你需要告诉用户目前是什么状况,起到引导作用
8. 如果剧情Plot和面板背包数据等等,信息不同步,需要你进行纠正,比如境界出现bug,面板是炼气期3层,结果剧情中是炼气期6层,需要你纠正
9. 如果用户的行动导致地点变化，请在推演结果中明确用‘你来到了XXX’或‘你离开XXX前往YYY’这样的句子描述。

【输出要求】
- 生成一段修仙风格的自然语言回复。
- 回复中必须明确提及所有发生的变化（如灵力消耗、物品使用、状态改变），必须具体，以便第五层解读。
- 语言生动形象，用大白话，带古风但不要文言文。
- 不要出现任何技术术语（如“数值”、“API”、“工具”等）。
- 所有实体,以及重要的东西,必须使用html的各种标签进行修饰!随意使用,包括加粗,改颜色,改为h1标题格式等等,让文字看起来更易读
- **输出格式必须严格遵循小说式分段：**
  - 每个短句或每个场景切换，都要独立成段。
  - 关键转折、情绪爆发、重要信息、选项说明，必须单独成行。
  - 段落之间用空行隔开，营造呼吸感。
  - 参考下面的排版风格(也需要你自行发挥,不要无脑复制)：
道友，你此番为求突破炼气一层的修炼资源，特意赶来正在招新的玄剑门碰机缘。

刚走到山门处，就撞上了值守的外门弟子赵磊。

那赵磊面生横肉，看见你腰间悬着的苍穹剑眼睛瞬间就直了。

他一口唾沫啐在脚边，嗤笑道：

“散修也配来我玄剑门碰运气？识相的把你手里的剑留下，爷爷我还能给你留个全尸！”

话音未落, 他已经抽了腰间低阶铁剑朝你劈来。

你如今只有炼气一层的修为，灵力远不如他。

此刻灵力只剩五成，背包里还有5枚炼气丹、10枚初级灵石，赖以傍身的法器只有这柄苍穹剑。

硬接他一剑少说也要半残，眼看剑锋就要落到你肩头，避无可避！

  - 故事开头必须从0开始,不许插叙!比如突然插入战斗,主角处境等等,一切都要从零开始!比如主角睁开眼,引入眼帘的是XXXX,代入感才强
  - 不要一上来就丢出战斗等等,不用那么快进入剧情,起承转合之前,还需要有一个铺垫,描述角色现在在哪
  - 当你需要转折剧情的时候,比如从铺垫->起,可以这样写:"当你正疑惑自己在哪时,一道声音打断你的思绪(后接剧情中的'起')"


【示例】
用户请求：“我要击杀那个魔修。”
输入：用户修为筑基中期，背包有“飞剑”，剧情生成了“魔修（金丹初期）”。
输出：
道友，你与那金丹初期的魔修在荒野相遇，一场激战就此展开。你催动飞剑，剑光如虹，奈何对方境界高出你许多，硬撼之下，你渐感不支。魔修一掌击中你胸口，你气血翻涌，修为略有跌落，飞剑也灵光暗淡，受损不轻。最终你拼尽全力逃脱，魔修遁入身后魔窟，你需从长计议。

（注：此回复隐含了修为减少、飞剑受损、魔修逃脱等变化，第五层可从“修为略有跌落”推断需减少修为，从“飞剑受损”推断需减少飞剑物品。）

现在，请根据实际输入生成推演结果。`;

    //创建messages
    const level4_messages = [
      {
        id: 1,
        role: "system",
        content: level4_prompt,
      },
      ...history.chatHistory,
    ];
    const Aiconfiguration = {
      //配置对象
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM,
        messages: level4_messages,
        temperature: 0.7,
        stream: true, //开启流式输出
        // tools: layer4Tools, //工具
        // tool_choice: "auto",
      }),
    };
    const level4_response = await fetch(API_URL, Aiconfiguration); //发送并收到回复

    //再返回,此时第五层才执行,不耽误返回时间
    console.timeEnd();
    //此处必须返回第四层的流,而非解析后的值
    return level4_response.body;
  } catch (error) {
    console.log("第四层出错了", error);
    return "第四层处理失败，请稍后再试。";
  }
}

//🔴 5, 工具执行层
async function layer5(level4_Replay, userInput) {
  try {
    const backpack = await query_backpack();
    const PlayerData = await query_playerStats();
    console.log("🔴 5, 进入工具执行层.");

    const level5_prompt = `
【角色设定】:你是五层架构中的第五层【最终执行者】。你的唯一职责是：基于第四层推演出的结果，严格从给定的工具列表中选择最合适的工具执行

【核心任务】
1.  仔细阅读下方的【第四层推演结果】【用户原始问题】【第一层查询结果】【可用工具列表】；
2.  从【第四层推演结果】中解析出需要修改的数据变化（如背包物品增减、面板属性变化、学习功法技艺、突破结果等）；
3.  根据解析出的变化，从【可用工具列表】中选择对应的工具执行（可能需要多次调用，例如同时添加物品和修改修为）；
4.  有些信息也许比较隐晦,需要你多多思考,比如有时候出现"增加些许灵石",你可以自行判断增加多少.
5.  请注意推敲+分辨第四层的用词,究竟有没有给出绝对的陈述句,比如"消耗","使用"等等此类绝对的动词,如果只是询问用户,"如果","若"此类假设语句,那么说明此句话没有消耗物品,那么你就继续阅读下一句,注意分辨用词
6.  读取所有信息后,如果发现,角色的地图有所改变,请调用工具Current_Location,仔细阅读前文,找到一个最有可能的当前地图即可,这一点主要是修改角色状态机,保证其所处地点时刻正确,其他ai不会读取出错


【输入上下文】
---
【1. 第四层推演结果】
${level4_Replay}
---
【2. 用户原始问题】
${userInput}
---
【3. 背包和面板】
背包:${backpack}
面板:${PlayerData}


【4. 可用工具列表】
添加物品: Backpack_additems
删除物品: Backpack_reduceitems
跳过工具: Skip
修改面板属性: Player_changeAttribute
增加所会的功法: PlayerStats_AddTechnique
增加技艺: Technique_Add
判断突破是否成功: Check_Breakthrough
生成物品: Generate_Items
修改当前角色所处的地图:Current_Location

---

【强制执行规则】
1.  【必须基于第四层推演结果】：所有需要修改的数据必须来自推演结果，不得凭空编造；
2.  【参数准确】：调用工具时，参数要准确对应推演结果中描述的变化（如物品名称、数量、属性值等）；
3.  【多次调用】：如果推演结果涉及多个变化，需依次调用对应工具，不要合并或遗漏；


【绝对禁止】
- 禁止在推演结果没有指明的情况下修改数据；
- 禁止选择不在列表中的工具；

【示例(只是参考,希望你自行优化)】
第四层推演结果：你与金丹初期的魔修激战，不敌受伤，魔修遁入魔窟。你的灵力因战斗消耗减少50点。
用户原始问题：我要击杀那个魔修。
你的行动：
- 调用 Backpack_reduceitems，参数：items: [{ name: "飞剑", value: 500, mount: 1 }]
- 调用 Player_changeAttribute，参数：: spiritual_power -50

现在，请基于以上规则，根据实际输入执行任务。
`;

    //先把第四层回复存入后端的数据库
    assistantadd(level4_Replay);

    //新message2
    const level5_messages = [
      {
        id: 1,
        role: "system",
        content: level5_prompt,
      },
      ...history.chatHistory,
    ];
    const Aiconfiguration = {
      //配置对象
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
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

        model: LLM,
        messages: level5_messages,
        temperature: 0.7,
        //stream: true, //开启流式输出
        tools: layer5Tools, //工具
        tool_choice: "auto", //自动选择调用,注意这里tool没有s的
      }),
    };

    console.log("第五次发送api");
    let response2;
    let level5_data;
    try {
      response2 = await fetch(API_URL, Aiconfiguration);
      level5_data = await response2.json();
    } catch (err) {
      console.error("第五层 fetch 网络错误:", err);
    }
    console.log("第5次API完整响应:", JSON.stringify(level5_data, null, 2)); // 先打印，看实际返回

    const AiReply2 = level5_data.choices[0].message; // 包含所有回复和工具使用情况
    console.log("第5层ai回复:", AiReply2.content);
    console.log("检查是否有 tool_calls：", AiReply2.tool_calls);
    console.log(
      "第5次发送api结束,输入消耗token:",
      level5_data.usage.prompt_tokens,
    );
    console.log(
      "第5次发送api结束,输出消耗token:",
      level5_data.usage.completion_tokens,
    );
    console.log(
      "第5次发送api结束,总计消耗token:",
      level5_data.usage.total_tokens,
    );

    //====================== 解析工具 ==============================================
    //循环遍历ai使用的所有工具, 注意这里的tool是没有s的
    if (AiReply2.tool_calls && AiReply2.tool_calls.length > 0) {
      console.log("成功进入工具执行阶段");
      let count = 0; //判断ai使用了多少次工具
      console.log(
        "ai使用的工具数量AiReply.tool_calls.length=",
        AiReply2.tool_calls.length,
      ); //判断ai使用了多少次工具

      //遍历工具,进行使用
      for (const tool of AiReply2.tool_calls) {
        count++;
        const toolname = tool.function.name; //获取工具名字
        console.log("当前使用工具名字:", toolname);

        const toolArg = JSON.parse(tool.function.arguments); //获取ai返回的参数,此处parse是将JSON格式转为对象格式
        console.log("AI返回的完整物品数组：", toolArg.items); //检查ai返回的物品数组

        //批量添加
        if (toolname === "Backpack_additems") {
          let count = 0;
          for (const item of toolArg.items) {
            count++;
            addItem(item); //每次遍历数组都只添加一个对象
          }
          console.log(`成功添加${count}件物品到背包!`);
          //由于是批量添加,所以ai返回的每一个数组里面,都要进行解析,看看它是否一口气返回了多个数组
          const returncontent = toolArg.items.map((item) => {
            return `- ${item.name} ×${item.mount},单件价值${item.value}`;
          });
          console.log("已添加:", returncontent);
        }
        //批量减少背包物品
        if (toolname === "Backpack_reduceitems") {
          let count = 0;
          //原for循环
          // const returncontent = []; //暂时存储减少物品后返回的结果,之后再统一丢进toolResult
          // for (const item of toolArg.items) {
          //   count++;
          //   returncontent.push(backpack.reduce(item));
          //   console.log(returncontent);
          // }
          //简写:
          const returncontent = toolArg.items.map((item) => {
            count++;
            // 拿到reduce方法返回的结果，包装成和添加一致的列表项
            const useResult = reduceItem(item);
            return `- ${useResult}`; // 用- 开头，和添加的列表格式完全对齐
          });
          console.log(`获得:`, returncontent);

          console.log(`成功使用${count}件物品!`);
        }

        //  增加功法
        if (toolname === "PlayerStats_AddTechnique") {
          console.log("ai调用增加功法工具,增加:", toolArg.name);
          console.log("当前toolArg内容为:", toolArg);

          add_Cultivation_Technique(toolArg);
        }

        //  增加技艺
        if (toolname === "Technique_Add") {
          console.log("ai调用增加技艺工具,增加:", toolArg.name);
          console.log("当前toolArg内容为:", toolArg);

          add_Technique(toolArg);
        }

        // //突破判断
        // if (toolname === "Check_Breakthrough") {
        //   console.log("进入突破工具");
        //   console.log("ai给出结果为", toolArg.result);
        //   breakthrough.push(toolArg.result);
        // }

        //跳过
        if (toolname === "Skip") {
          console.log("进入跳过工具");
          console.log("ai给出原因为", toolArg.reason);
          console.log("使用[跳过]工具,以下是ai给出的缘由", toolArg.reason);
          continue;
        }

        //状态机:地图
        if (toolname === "Current_Location") {
          console.log("进入修改地图状态机的工具");
          console.log("修改的新地图为:", toolArg.location);
          ChangeLocation(toolArg.location);
        }

        //突破
        if (toolname === "Check_Breakthrough") {
          console.log("进入突破检测工具");
          console.log("ai给出的突破结果为", toolArg.result);

          //以下是具体操作数值
          //......
        }
      }
      const PlayerData = query_playerStats();
      const backpack = query_backpack();
      console.log("工具执行结束,一共使用工具次数:", count);
      console.log(
        "当前位置是后端ai第五层,先检查第五层背包和面板是否有误,先看背包:",
        backpack,
      );
      console.log("这个是面板:", PlayerData);

      return { backpack, PlayerData };
    }
  } catch (error) {
    console.log("当前位置,后端ai,第五层出现错误", error);
    return "第五层处理失败，请稍后再试。";
  }
}

module.exports = {
  chatWithAI,
  layer5,
  initRAG,
  getEmbedder: () => embedder,
  getCollection: () => collection,
  World_Rule,
};
