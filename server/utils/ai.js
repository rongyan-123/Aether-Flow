const { pipeline, env } = require("chromadb-default-embed");
env.allowRemoteModels = false;
env.localModelPath = "D:/xiuxian/xiuxian/server/models";
const {
  PlayerData,
  backpack,
  history,
  query_backpack,
  query_playerStats,
} = require("../fs.js"); //一个点代表当前目录,两个点才是上级目录
//此处要注意,这里导入文件,会优先执行一次文件内部的所有顶层代码,如果有log,也会执行.
//举个例子,就算你ai.js里面没有写log,当执行ai.js时,依旧会先导入fs.js,然后再调用fs.js里面的打印语句,很反直觉,明明执行的是ai文件,却也会优先执行其他文件?
//import { queryName } from "@/StaticData/AllData";
//import { usePlayerStore } from "@/stores/player";
const {
  layer1Tools,
  layer2Tools,
  layer3Tools,
  layer5Tools,
} = require("./aitools");
const { ChromaClient } = require("chromadb");
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
const LLM = "gpt-4o-mini";
//const LLM = "doubao-seed-2-0-pro-260215";

// ==================== 核心请求函数 ====================
//分层如下:
//1,数据查询层:第一次发送api,调用查询工具,获取对应数据
//2,执行工具层:第二次发送api,根据数据选择接下来要执行的工具,比如添加物品,添加功法等等,以后的生成剧情也会在这里，战斗判断也会在这里
//3,面向用户层:第三次发送api,读取第一层的查询结果,还有第二层的工具返回结果,给用户做出最后的总结

//该函数拿到的是ai回复,类型是字符串
async function chatWithAI(userInput) {
  console.log("成功进入chatWithAI");
  console.log("用户问题", userInput);

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

  // 新增这行，看控制台打印了几次
  console.log(
    "=== chatWithAI 函数被触发 ===",
    "时间戳：",
    new Date().getTime(),
  );

  // console.log("🔴 面板原始数据：", realPlayerdata); // 看面板数据是不是真的有内容
  // console.log("🔴 最终给AI的系统提示词：", finalSystemPrompt2); // 看面板占位符到底有没有被替换掉

  // // 收集所有工具的执行结果,放在全局中使用
  const toolResult = [];
  //获取第一次查询结果
  const QueryResult = [];
  //突破情况
  const breakthrough = [];
  //剧情
  let Plot = "";
  //判断是否进入第二层生成剧情
  let Proceed = "";
  //🔴 1, 数据查询层
  try {
    console.log("🔴 1, 进入数据查询层.");

    //第一层ai提示词,仅使用工具:查询,判断突破
    const prompt = `
  【角色设定】
你是五层架构中的第一层,【查询与思考者】,你的**职责**是：分析用户意图,和使用各种工具对用户行为进行分析,以及查询相关设定和信息,给后续的二层和三层做信息铺垫

【核心任务】
1.  分析用户的当前行为、场景、意图；
2.  可以多次调用查询工具,已加入rag检索,所以建议直接查询整句话,不要拆开,然后可以多次查询,同时,请务必查询相关联的多个信息,
  从以下维度逐一判断是否需要查询，只要有不确定的信息，就必须调用查询工具：
    - 【场景】：用户当前所在的地点、环境设定；
    - 【物品】：用户提到的所有物品的价值、品阶、用途；
    - 【规则】：当前行为涉及的修仙界规则（坊市交易、杀人夺宝、突破等）；
    - 【设定】：用户提到的所有专有名词的设定；
    - 【行为】：用户执行的某个行为,所关联的所有事物;
3.  只要你认为缺少任何信息会影响后续判断，就必须调用查询工具，直到你认为信息足够为止。允许连续调用多次查询工具。
4.  如果检测到用户当前意图是突破,立刻调用[Check_Breakthrough]工具,同时也要查询相关信息
5.  如果用户的行为涉及到了背包内的物品,则必须调用[Query_Backpack]工具,读取背包
6.  如果实在没有任何查询和突破检查,没有任何回复,不要返回空,而是调用Skip:如果用户的发送对话,实在是让你无法调用任何工具,那就直接调用Skip工具就行,绝对不要返回空
7.  注意,此处要根据用户意图和行为,判断是否进入第二层生成剧情,具体可以查看工具judgment_of_proceed描述

【只允许调用的工具列表】
跳过:Skip
查询设定和物品描述等等:Query_Data
查询用户背包:Query_Backpack
查询用户面板:Query_PlayerStats
是否进入第二层叙事规划层judgment_of_proceed

【用户当前数据（仅用于理解上下文，绝对不能修改）】
---
用户原始输入：
${userInput}

世界观设定(底层逻辑):
${World_Rule}
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

❌ 错误示范1：
用户问题：“把燃血秘术加入我的面板”
你的行动：调用了 Backpack_additems 或 Technique_Add → 绝对禁止！

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
          console.log("当前查询:", toolArg.name);
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
          const result = query_backpack(); // 内部已经化为字符串了
          QueryResult.push(result);
        }
        if (toolname === "Query_PlayerStats") {
          console.log("调用读取面板工具中....");
          const result = query_playerStats(); // 内部已经化为字符串了
          QueryResult.push(result);
        }

        //判断是否进入第二层,第三层
        if (toolname === "judgment_of_proceed") {
          console.log("是否需要进入第二层:", toolArg.judgment);
          Proceed = toolArg.judgment;
          console.log("Proceed:", Proceed);
        }

        console.log("当前QueryResult内容:", QueryResult);
      }
      console.log("查询结束");
    }
  } catch (error) {
    console.log("第一层出错了", error);
    return "第一层处理失败，请稍后再试。";
  }

  //🔴 2, 叙事规划层
  if (Proceed === "yes") {
    try {
      console.log("🔴 2, 进入第二层,叙事规划层.");
      const level2_prompt = `
      【角色设定】
你是一位修仙世界的剧情架构师，任务是根据提供的上下文，调用Generate_Plot工具，生成一段符合起承转合结构的剧情大纲。同时,判断是否需要重新调用第三层生成对应物品和人设

【输入信息】
你将获得以下信息，必须作为生成剧情的唯一依据：
- 用户当前状态：背包、属性、位置、任务等。
- 最近剧情摘要（如果有）。
- 用户本次行动意图（由前一层分析得出，如“探索”、“修炼”、“战斗”等）。

【生成要求】
1. 剧情必须包含完整的四部分：开端（Beginning）、发展（Continuation）、转折（Change）、结局（SummingUp），每部分用最精炼的语言描述核心事件，避免任何修饰和多余描述。
2. 开端：直接点明用户当前需要但难以实现的目标，并立刻制造一个危机。
3. 发展：用户解决危机并获得收获；为后续埋伏笔；加入一个小爽点；保持一段相对放松的节奏。
4. 转折：引入一个更大的危机，同时回收之前的所有伏笔，并给用户新的希望。
5. 结局：危机解除，用户变强并收获；有一段休憩时间；为未来剧情留下铺垫。
6. 剧情必须与用户当前状态和意图紧密相关，所有事件应合理衔接。
7. 可在剧情中自然提及需要后续生成的物品、人物或场景（例如“遇到一只受伤的妖兽”、“发现一株灵草”），但无需详细描述，只需留下生成线索即可。
8. 生成完剧情,判断是否需要调用judgment_of_proceed_3,进入下一层生成对应道具,人设等等,判断依据:

【输出格式】
直接调用Generate_Plot工具，将各个个部分的文字填入对应参数。无需额外解释。

【用户当前数据（仅用于理解上下文，绝对不能修改）】
---
用户原始输入：
${userInput}

世界观设定(底层逻辑):
${World_Rule}

---

【示例】
用户输入：“我想去坊市看看有没有好东西。”
上下文：用户修为筑基中期，背包有500灵石，当前在青云宗。
生成的剧情可能如下：
- Beginning：你来到坊市，听闻今晚拍卖会将出现一枚筑基丹，正是你突破所需，但价格高达1000灵石，你囊中羞涩。突然，一个黑衣修士撞了你一下，你发现自己的灵石袋不见了！
- Continuation：你追上前去，施展身法将对方拦住，原来是个炼气期小贼。你夺回灵石，还从他身上搜出200灵石（收获）。此事传开，坊市摊主对你态度好转，愿意低价卖你一瓶聚气丹（小爽点）。你决定先买下聚气丹，再去筹集灵石。
- Change：当你准备离开坊市时，忽然听到远处传来爆炸声，一股魔气冲天而起——有魔修在坊市内作乱！你发现那魔修正是刚才小贼的同伙，他冲你冷笑，显然认出了你（伏笔回收）。
- SummingUp：你与魔修激战，凭借刚买的聚气丹临时提升灵力，最终将其击退（变强）。坊市管理者感谢你，奖励你500灵石，并邀请你参加明晚的拍卖会。你回到洞府休息，准备明天拍下筑基丹（休憩+铺垫）。
- clue:出现人物:小贼,魔修,管理者等等,出现物品:管理者给予的宝物,聚气丹,出现场景:坊市,拍卖会,

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
          const toolArg = tool.function.arguments;
          if (toolname === "Generate_Plot") {
            console.log("ai生成答案", toolArg);
            const newPlot = `起:${toolArg.Beginning}\n承:\n${toolArg.Continuation}\n转:\n${toolArg.Change}\n合:\n${toolArg.SummingUp}\n其余信息:${toolArg.clue}`;
            Plot = newPlot; // 替换为最新剧情
            //在工具的返回中加入一个日志
            toolResult.push(`剧情已根据用户行为更新：${Plot}`);
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

      const level3_prompt = `
      【角色】
你是修仙世界的【细节生成器】。你的唯一任务是根据第二层生成的剧情，调用相应的工具（Generate_Items、Generate_Character、Generate_Location）来创建剧情中需要的新物品、人物和地点。

【输入】
你将获得第二层生成的完整剧情（包含开端、发展、转折、结局四个部分）。剧情中可能暗示需要新的物品、人物或地点（例如“遇到一只受伤的妖兽”、“发现一株灵草”、“进入一座废弃洞府”）。

【任务】
1. 仔细阅读剧情，识别出哪些地方需要生成新的实体（物品、人物、地点）。
2. 为每个需要生成的实体调用对应的工具，一次调用只生成一个实体。可多次调用。
3. 在调用工具时，必须根据剧情上下文填写参数，确保生成的实体与剧情一致，并相互绑定：
   - **物品**：指定其主人（owner）、所在地（location）及可能的剧情伏笔（plot_hint）。
   - **人物**：指定其所在地（location）、所属势力（affiliation）、拥有的物品（items）。
   - **地点**：指定其居民（inhabitants）、特有物品（bound_items）、关联地点（bound_locations）。
4. 所有描述务必简洁，避免浪费token，只需填写必要信息。

【输出】
直接调用工具，不要输出任何其他内容。

【示例】
若剧情中提到“你在坊市遇到一位神秘老者，他手中拿着一枚古朴丹药”，则应调用：
- Generate_Character：生成老者，设定其 location 为“坊市”，可能拥有物品 items: ["古朴丹药"]。
- Generate_Items：生成丹药，设定其 owner 为老者，location 为“坊市”，并赋予 effect 等属性。

现在，基于以下剧情执行任务：
${Plot}`;
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

        for (const tool of level3_AiReply.tool_calls) {
          const toolname = tool.function.name;
          const toolArg = tool.function.arguments;
          if (toolname === "Generate_Character") {
            console.log("ai生成答案", toolArg);
            const newPlot = `起:${toolArg.Beginning}\n承:\n${toolArg.Continuation}\n转:\n${toolArg.Change}\n合:\n${toolArg.SummingUp}\n其余信息:${toolArg.clue}`;
            Plot = newPlot; // 替换为最新剧情
            //在工具的返回中加入一个日志
            toolResult.push(`剧情已根据用户行为更新：${Plot}`);
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

  //拿到第四层ai回复文本
  let level4_Replay = "";
  //🔴 4, 进入面向用户层
  try {
    const level4_prompt = `
    【角色】
你是修仙世界的【因果推演师】。你的职责是根据以下所有信息，推演用户行为的结果，并用最简洁的语言描述发生了什么，以及用户的状态（背包、面板等）发生了哪些变化。

【输入】
你将获得以下信息：
- **用户原始请求**：${userInput}
- **第一层查询结果**：${QueryResult}
- **第二层生成的剧情框架**：${Plot}（包含起承转合）
- **第三层生成的实体**：${{}}（物品、人设、地点的摘要列表，包含名称、所属、位置等）
- **当前世界状态**：用户背包{{backpack}}、面板{{player}}、所在位置{{location}}等
- **世界观底层逻辑**：${World_Rule}（参考用）

【任务】
1. **推演行为结果**：根据用户意图、剧情框架和当前状态，推演用户执行该行为后会发生什么。例如：
   - 若用户战斗，则推演胜负、受伤程度、消耗物品、获得战利品等。
   - 若用户探索，则推演发现新地点、遭遇事件、获得物品等。
   - 若用户修炼，则推演修为增长、突破可能、消耗灵石等。
2. **整合信息**：结合第三层生成的实体，判断哪些会被触发、使用或改变。
3. **输出一段简洁的描述**：用一两句话说明发生了什么，并明确指出用户状态的变化（如“修为+100，灵石-50，获得丹药一枚”）。描述要清晰，便于后续层理解并执行实际修改。

【规则】
- **必须基于输入信息**，不得凭空编造。
- **确保推演符合世界观**。
- **语言极其简洁**，避免任何修饰，只陈述事实和变化。
- **不调用工具**，只输出文本。

【示例】
用户请求：“我要击杀那个魔修。”
输入：用户修为筑基中期，背包有“飞剑”，剧情框架为“遇到魔修挑衅”，第三层生成了“魔修（金丹初期）”和“魔窟地点”。
输出：
你与金丹初期的魔修激战，不敌受伤，魔修遁入魔窟。你的灵力因战斗消耗减少50点。功法XXX获得了10点熟练度

  (注意,需要注意的参数请根据用户面板而输出对应数值) `;

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
        messages: level4_messages, //发送以下数据:历史记录,背包
        temperature: 0.7,
        //stream: true, //开启流式输出
        // tools: layer4Tools, //工具
        // tool_choice: "auto",
      }),
    };
    const level4_response = await fetch(API_URL, Aiconfiguration); //发送并收到回复

    const level4_data = await level4_response.json(); //转为json格式
    //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
    if (!level4_response.ok) {
      console.error("API 授权失败/请求错误：", level4_data.error);
      return "抱歉，API 请求失败（请换个模型）";
    }
    console.log(
      "第4次发送api结束,输入消耗token:",
      level4_data.usage.prompt_tokens,
    );
    console.log(
      "第4次发送api结束,输出消耗token:",
      level4_data.usage.completion_tokens,
    );
    console.log(
      "第4次发送api结束,总计消耗token:",
      level4_data.usage.total_tokens,
    );
    //拿到回复中的有效内容
    const AiReply = level4_data.choices[0].message;

    console.log("第4层ai回复:", AiReply.content);
    console.log("检查是否有 tool_calls：", AiReply.tool_calls);
    level4_Replay = AiReply.content;
  } catch (error) {
    console.log("第五层出错了", error);
    return "第五层处理失败，请稍后再试。";
  }

  //🔴 5, 工具执行层
  try {
    console.log("🔴 5, 进入工具执行层.");

    const level5_prompt = `
【角色设定】:你是五层架构中的第五层【最终执行者】。你的唯一职责是：基于第四层推演出的结果，严格从给定的工具列表中选择最合适的工具执行，并根据所有信息生成最终的自然语言回复。

【核心任务】
1.  仔细阅读下方的【第四层推演结果】【用户原始问题】【第一层查询结果】【可用工具列表】；
2.  从【第四层推演结果】中解析出需要修改的数据变化（如背包物品增减、面板属性变化、学习功法技艺、突破结果等）；
3.  根据解析出的变化，从【可用工具列表】中选择对应的工具执行（可能需要多次调用，例如同时添加物品和修改修为）；
4.  调用完所有必要工具后，根据推演结果、查询结果、工具执行情况等，生成一段符合修仙风格的最终回复，回复给用户。

【输入上下文】
---
【1. 第四层推演结果】
${level4_Replay}
---
【2. 用户原始问题】
${userInput}
---
【3. 第一层查询结果】
${QueryResult}
---
【4. 可用工具列表】
添加物品: Backpack_additems
删除物品: Backpack_reduceitems
跳过工具: Skip
修改面板属性: Player_changeAttribute
增加所会的功法: PlayerStats_AddTechnique
增加技艺: Technique_Add
判断突破是否成功: Check_Breakthrough
生成物品: Generate_Items
---

【强制执行规则】
1.  【必须基于第四层推演结果】：所有需要修改的数据必须来自推演结果，不得凭空编造；
2.  【参数准确】：调用工具时，参数要准确对应推演结果中描述的变化（如物品名称、数量、属性值等）；
3.  【多次调用】：如果推演结果涉及多个变化，需依次调用对应工具，不要合并或遗漏；
4.  【最后生成回复】：调用完所有工具后，必须生成一段最终回复，回复给用户；
5.  【回复风格】：
    - 称呼用户为「道友」；
    - 语言通俗易懂，适当加入修仙氛围；
    - 可适当在关键词处使用markdown标记（如**加粗**、高亮），增强可读性；
    - 不要暴露任何技术术语（如“工具”、“调用”、“函数”等）；
    - 回复应简洁自然，避免冗余。

【绝对禁止】
- 禁止在推演结果没有指明的情况下修改数据；
- 禁止选择不在列表中的工具；
- 禁止不生成回复。

【示例(只是参考,希望你自行优化)】
第四层推演结果：你与金丹初期的魔修激战，不敌受伤，魔修遁入魔窟。你的灵力因战斗消耗减少50点。
用户原始问题：我要击杀那个魔修。
你的行动：
- 调用 Backpack_reduceitems，参数：items: [{ name: "飞剑", value: 500, mount: 1 }]
- 调用 Player_changeAttribute，参数：: spiritual_power -50
最终回复：道友，你与那金丹初期的魔修一场激战，虽奋力拼杀，奈何境界悬殊，最终不敌受伤。你的**飞剑**在战斗中受损，灵力也因消耗而跌落**50点**。那魔修遁入魔窟，你需从长计议。

现在，请基于以上规则，根据实际输入执行任务。
`;

    // console.log("当前历史记录已经有:", history);

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
        messages: level5_messages, //发送以下数据:历史记录,背包
        temperature: 0.7,
        //stream: true, //开启流式输出
        tools: layer5Tools, //工具
        tool_choice: "auto", //自动选择调用,注意这里tool没有s的
      }),
    };
    //第二次发送
    console.log("第五次发送api");
    const response2 = await fetch(API_URL, Aiconfiguration);
    const level5_data = await response2.json();

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
            backpack.add(item); //每次遍历数组都只添加一个对象
          }
          console.log(`成功添加${count}件物品到背包!`);
          //由于是批量添加,所以ai返回的每一个数组里面,都要进行解析,看看它是否一口气返回了多个数组
          const returncontent = toolArg.items.map((item) => {
            return `- ${item.name} ×${item.mount},单件价值${item.value}`;
          });
          const returncontent2 = returncontent.join("\n");
          toolResult.push(`恭喜道友获得:\n${returncontent2}`);
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
            const useResult = backpack.reduce(item);
            return `- ${useResult}`; // 用- 开头，和添加的列表格式完全对齐
          });
          const returncontent2 = returncontent.join("\n");
          toolResult.push(`已使用物品:\n${returncontent2}`);
          console.log(`成功使用${count}件物品!`);
        }

        //  增加功法
        if (toolname === "PlayerStats_AddTechnique") {
          console.log("ai调用增加功法工具,增加:", toolArg.name);
          console.log("当前toolArg内容为:", toolArg);

          toolResult.push(PlayerData.add_Cultivation_Technique(toolArg));
        }

        //  增加技艺
        if (toolname === "Technique_Add") {
          console.log("ai调用增加技艺工具,增加:", toolArg.name);
          console.log("当前toolArg内容为:", toolArg);

          toolResult.push(PlayerData.add_Technique(toolArg));
        }

        //生成剧情
        if (toolname === "Generate_Plot") {
          console.log("进入剧情生成工具");
          const finia_plot =
            toolArg.Beginning +
            toolArg.Continuation +
            toolArg.Change +
            toolArg.SummingUp;
          Plot.push(finia_plot);
          console.log("最终剧情为:", finia_plot);
        }

        //突破判断
        if (toolname === "Check_Breakthrough") {
          console.log("进入突破工具");
          console.log("ai给出结果为", toolArg.result);
          breakthrough.push(toolArg.result);
        }

        //跳过
        if (toolname === "Skip") {
          console.log("进入跳过工具");
          console.log("ai给出原因为", toolArg.reason);
          toolResult.push("使用[跳过]工具,以下是ai给出的缘由", toolArg.reason);
          continue;
        }

        //突破
        if (toolname === "Check_Breakthrough") {
          console.log("进入突破检测工具");
          console.log("ai给出的突破结果为", toolArg.result);
          toolResult.push(
            "使用突破检测工具,以下是ai给出的缘由",
            toolArg.result,
          );

          //以下是具体操作数值
          //......
        }

        //生成物品
        if (toolname === "Generate_Items") {
          console.log("进入生成物品工具");
          console.log("物品名称:", toolArg.name);
        }
      }
      console.log("工具执行结束,一共使用工具次数:", count);
      console.log("toolResult==", toolResult);
    }
  } catch (error) {
    console.log("第四层出现错误", error);
    return "第四层处理失败，请稍后再试。";
  }
  return level4_Replay;
}

module.exports = { chatWithAI };
