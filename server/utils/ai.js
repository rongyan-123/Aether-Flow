const { PlayerData, backpack, history, query_backpack } = require("../fs.js"); //一个点代表当前目录,两个点才是上级目录
//此处要注意,这里导入文件,会优先执行一次文件内部的所有顶层代码,如果有log,也会执行.
//举个例子,就算你ai.js里面没有写log,当执行ai.js时,依旧会先导入fs.js,然后再调用fs.js里面的打印语句,很反直觉,明明执行的是ai文件,却也会优先执行其他文件?

//import { queryName } from "@/StaticData/AllData";
//import { usePlayerStore } from "@/stores/player";
const { layer1Tools, layer2Tools } = require("./aitools");
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

//
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
const LLM = "doubao-seed-2-0-pro-260215";

// ==================== 核心请求函数 ====================
//分层如下:
//1,数据查询层:第一次发送api,调用查询工具,获取对应数据
//2,执行工具层:第二次发送api,根据数据选择接下来要执行的工具,比如添加物品,添加功法等等,以后的生成剧情也会在这里，战斗判断也会在这里
//3,面向用户层:第三次发送api,总结以上所有工具回复,给用户做出最后的总结

//该函数拿到的是ai回复,类型是字符串
async function chatWithAI(userInput) {
  console.log("成功进入chatWithAI");
  console.log("用户问题", userInput);

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

  //第一层ai提示词,仅使用工具:查询,判断突破
  const prompt = `
  【角色设定】
你是三层架构中的第一层,【查询与思考者】,你的**职责**是：分析用户意图,和使用各种工具对用户行为进行分析,以及查询相关设定和信息,给后续的二层和三层做信息铺垫

【核心任务】
1.  分析用户的当前行为、场景、意图；
2.  从以下维度逐一判断是否需要查询，只要有不确定的信息，就必须调用查询工具：
    - 【场景】：用户当前所在的地点、环境设定；
    - 【物品】：用户提到的所有物品的价值、品阶、用途；
    - 【规则】：当前行为涉及的修仙界规则（坊市交易、杀人夺宝、突破等）；
    - 【设定】：用户提到的所有专有名词的设定；
    - 【行为】：用户执行的某个行为,所关联的所有事物;
3.  可以多次调用查询工具，查询多个不同的关键字,如果查询,必须拆关键字查询提取用户行为中最核心的几个名词，不能查询整句话，不能加标点,可以多次查询。
4.  只要你认为缺少任何信息会影响后续判断，就必须调用查询工具，直到你认为信息足够为止。允许连续调用多次查询工具。
5.  如果检测到用户当前意图是突破,立刻调用[Check_Breakthrough]工具,同时也要查询相关信息
6.  如果用户的行为涉及到了背包内的物品,则必须调用[Query_Backpack]工具,读取背包
7.  如果实在没有任何查询和突破检查,没有任何回复,不要返回空,而是调用Skip:如果用户的发送对话,实在是让你无法调用任何工具,那就直接调用Skip工具就行,绝对不要返回空

【只允许调用的工具列表】
跳过:Skip
查询设定和物品描述等等:Query_Data
查询用户背包:Query_Backpack
查询用户面板:Query_PlayerStats
判断突破是否成功:Check_Breakthrough

【用户当前数据（仅用于理解上下文，绝对不能修改）】
---
用户原始问题：
${userInput}

世界观设定(底层逻辑):
${World_Rule}
---

【注意事项（违反任何一条都视为失败）】
1.  【如果查询,必须拆关键字查询】：提取用户行为中最核心的几个名词，不能查询整句话，不能加标点,可以多次查询；
2.  【绝对禁止修改数据】：绝对不能有任何“添加物品”“加入面板”“修改修为”的想法或行为；
3.  【查询结果必须返回】：如果用户有任何行为，必须调用 Query_Data,查询对应关联的事物，不能直接编造答案。


【绝对禁止】
- 禁止有任何修改用户背包、面板数据的想法或行为；
- 禁止编造查询结果；
- 禁止在这一层直接解决用户的“添加/学习”需求，只负责查询信息。
- 绝对禁止返回完全空值,用Skip工具替换空值

【正反例子】
---
✅ 正确示范1：
用户问题：“燃血秘术是什么？”
你的行动：调用 Query_Data，参数 queryName=燃血秘术

✅ 正确示范2：
用户问题：“把燃血秘术加入我的面板”
你的行动：调用 Query_Data，参数 queryName=燃血秘术（注意：只查询，绝对不调用添加工具）

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
  // 新增这行，看控制台打印了几次
  console.log(
    "=== chatWithAI 函数被触发 ===",
    "时间戳：",
    new Date().getTime(),
  );

  const realbackpackdata = JSON.stringify(backpack, null, 2); //转化背包内数据为字符串
  const realPlayerdata = JSON.stringify(PlayerData, null, 2); //转化面板内数据为字符串,请注意,面板仓库里没有data,全是散的,放在state里面

  //每次发送请求都会更新一次(原理是每次都用replace替换prompt里面的数据),供ai同步读取
  const first_finalSystemPrompt = prompt.replace(
    "backpack_DATA",
    realbackpackdata,
  );
  const finalSystemPrompt2 = first_finalSystemPrompt.replace(
    "PlayerStats_DATA",
    realPlayerdata,
  );
  // console.log("🔴 面板原始数据：", realPlayerdata); // 看面板数据是不是真的有内容
  // console.log("🔴 最终给AI的系统提示词：", finalSystemPrompt2); // 看面板占位符到底有没有被替换掉

  //创建最终的message
  const messages = [
    {
      id: 1,
      role: "system",
      content: finalSystemPrompt2,
    },
    ...history.chatHistory,
  ];

  try {
    //🔴 1, 数据查询层
    console.log("🔴 1, 进入数据查询层.");
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

    // 👇 新增：打印完整响应信息
    console.log("=== 响应信息 ===");
    console.log("响应状态码：", response.status);
    console.log("响应头：", Object.fromEntries(response.headers.entries()));
    console.log("用户问题:", userInput);

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
    const AiReply = data.choices[0].message; //拿到回复中的有效内容

    //获取深度思考
    //const deepthink = AiReply.reasoning_content || "";
    //获取第一次查询结果
    const QueryResult = [];
    console.log("ai第一次回复:", AiReply.content);
    console.log("检查是否有 tool_calls：", AiReply.tool_calls);
    //检测ai传的工具返回值
    // console.log("以下是ai传的查询参数");
    // for (const tool of AiReply.tool_calls) {
    //   const toolArg = JSON.parse(tool.function.arguments);
    //   console.log("当前查询:", toolArg.name);
    // }

    //开始第一次查询
    if (AiReply.tool_calls && AiReply.tool_calls.length > 0) {
      console.log("成功进入查询");
      //遍历所有工具
      for (const tool of AiReply.tool_calls) {
        const toolname = tool.function.name; //获取工具名字
        const toolArg = JSON.parse(tool.function.arguments); //获取ai返回的参数,此处parse是将JSON格式转为对象格式
        console.log("当前工具:", toolname);
        console.log("当前ai返回的参数:", toolArg);
        // if (toolname === "Query_Data") {
        //    console.log("当前查询:", toolArg.name);
        //   QueryResult.push(queryName(toolArg.name));
        // }
        //查询背包和面板
        if (toolname === "Query_Backpack" && toolArg.read_ro_no === "yes") {
          console.log("调用读取背包工具中....");
          QueryResult.push(query_backpack());
        }
        if (toolname === "Query_PlayerStats" && toolArg.read_ro_no === "yes") {
          console.log("调用读取面板工具中....");
          QueryResult.push(query_backpack());
        }
      }
      console.log("查询结束");
    }
    console.log("🔴 2, 进入工具执行层.");

    const prompt2 = `
【角色设定】:你是三层架构中的第二层【工具执行官】，你的唯一职责是：基于前一层已有的查询结果，严格从给定的工具列表中选择最合适的工具执行，绝对不能做任何超出工具范围的事。

【核心任务】
1.  仔细阅读下方的【查询结果】【用户原始问题】【可用工具列表】；
2.  严格基于【查询结果】，判断用户的需求是什么；
3.  从【可用工具列表】中选择**唯一最合适**的工具执行；
4.  如果实在没有工具使用,那就跳过，就调用【Skip】工具。

【输入上下文】
---
【1. 查询结果（来自第一次API调用，你必须100%基于此判断，绝对不能编造）】
${QueryResult}
---
【2. 用户原始问题】
${userInput}
---
【3. 可用工具列表】
添加物品Backpack_additems
删除物品Backpack_reduceitems
跳过工具Skip
修改面板属性Player_changeAttribute
增加所会的功法PlayerStats_AddTechnique
增加技艺功法Technique_Add
生成剧情Generate_Plot
---

【强制执行规则（违反任何一条都视为失败）】
1.  【必须基于查询结果】：所有判断必须100%来自【查询结果】；
2.  【参数必须来自查询结果】：工具的所有参数必须优先从【查询结果】里提取；
3.  【需要跳过就调用Skip】：如果用户的需求只是查询信息，或者查询结果里没有相关信息，就调用【Skip】工具。

【绝对禁止】
- 禁止编造【查询结果】里没有的信息；
- 禁止选择【可用工具列表】里没有的工具；
- 禁止跨工具调用（功法/战技/物品必须严格区分）；
- 禁止在这一层直接回复用户，必须调用工具。

【正反例子】
---
✅ 正确示范1：
【查询结果】：燃血秘术是其他法门，黄阶上品
【用户问题】：把燃血秘术加入我的面板
你的行动：调用 Technique_Add 工具

✅ 正确示范2：
【查询结果】：练气篇引导决是修炼功法，黄阶下品
【用户问题】：给我介绍一下练气篇引导决
你的行动：调用 Skip 工具，参数 reason="用户只是查询信息，不需要修改数据"
---

现在，请基于以上所有规则，执行你的任务。
`;

    console.log("当前历史记录已经有:", history);

    //新message2
    const messages2 = [
      {
        id: 1,
        role: "system",
        content: prompt2,
      },
      ...history.chatHistory,
    ];
    const Aiconfiguration2 = {
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
        messages: messages2, //发送以下数据:历史记录,背包
        temperature: 0.7,
        //stream: true, //开启流式输出
        tools: layer2Tools, //工具
        tool_choice: "auto", //自动选择调用,注意这里tool没有s的
      }),
    };
    //第二次发送
    console.log("第二次发送api");
    const response2 = await fetch(API_URL, Aiconfiguration2);
    const data2 = await response2.json();
    console.log("第二次API完整响应:", JSON.stringify(data2, null, 2)); // 先打印，看实际返回
    if (!data2.choices || data2.choices.length === 0) {
      console.error("第二次API返回异常，没有choices:", data2);
      // 这里可以返回一个友好的错误信息，或者尝试使用 Skip 的 fallback
      return "抱歉，玄机子暂时无法回应，请稍后再试。";
    }

    const AiReply2 = data2.choices[0].message; // 包含所有回复和工具使用情况
    console.log("第二次发送api结束,输入消耗token:", data2.usage.prompt_tokens);
    console.log(
      "第二次发送api结束,输出消耗token:",
      data2.usage.completion_tokens,
    );
    console.log("第二次发送api结束,总计消耗token:", data2.usage.total_tokens);

    // // 收集所有工具的执行结果,放在全局中使用
    const toolResult = [];

    //剧情
    const Plot = [];

    //突破情况
    const breakthrough = [];
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
        if (toolname === "Skip") {
          console.log("跳过执行层，原因:", toolArg.reason || "无");
          // 什么都不用做，直接跳过
          continue;
        }

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
        }
        //
      }
      console.log("工具执行结束,一共使用工具次数:", count);
      console.log("toolResult==", toolResult);
    }

    //🔴 3, 进入面向用户层

    const prompt3 = `
    你是修仙世界中精通推演与答疑的【玄机子】。
【绝对核心规则（违反即重写）】
1. **唯一任务**：仅根据下方提供的信息,以及工具的回复,查询的结果,总结并生成一段自然流畅的修仙风格回复；
2. **绝对禁止**： 
   - 禁止出现任何代码、JSON、工具调用、API、函数、参数等技术词汇；
   - 禁止提及“工具”“系统”“调用”“执行”等相关概念；
   - 禁止编造任何下方输入中没有的信息；
   - 禁止主动要求用户提供额外信息（除非明确提示信息不全）；
   - 禁止修改和创造任意新内容,此处仅总结信息;
   - 禁止为了语句流畅、篇幅简短，省略、精简原文中的任何细节内容。
3. **回复风格**：
   - 称呼用户为「道友」；
   - 语言通俗易懂，不要使用晦涩的文言文；
   - 可适当加入修仙氛围的表述，但不要过于冗余；
   - 不要提及你是 AI，不要暴露任何非修仙世界的设定。
   - 回答中,可适当在句子中的关键词处加上markdown语法的标记,变蓝,变红等等,让用户看得更清楚,这里你自行决定,尽量多一些,最好每一句都有一个
4. **注意事项**：
   - 如果有查询设定等操作,绝对要把设定尽量转述,不要遗漏任何内容
   - 剧情的发展必须要参考,同时也需要结合查询结果,工具返回结果,背包,个人面板等等信息,将剧情的bug进行修改,比如名字对不上(你就改为用户的名字),物品没有在数据库中出现(换一个物品)等等,所有bug和不合理的地方都要修改,然后告知用户发生了什么,剧情不要一口气给用户,而是任何一个选择,都要让用户进行
   - 以上所有回复,生成内容,修改后的剧情,剧情中人物行动逻辑,包括用户自己的选择,都必须遵照世界观,绝对不可以脱离世界观而独立存在

【已知信息（如果用不到就自然忽略）】
- 用户背包内容:
{{backpack_DATA}}
- 用户当前面板：
  {{PlayerStats_DATA}}
- 世界观(底层逻辑)
${World_Rule}
- 用户突破结果(如果有)
${breakthrough}

【必须读取和总结,回复的信息】
- 用户原始请求(精准回复)：{{USER_QUESTION}}
- 工具返回的结果(必须读取)：{{TOOL_RESULT}}
- 根据用户问题,返回的查询结果(必须参考):${QueryResult}
- 必须遵循的剧情发展:${Plot}

请直接生成你的回复：`;

    //把工具回复放到message2里面,准备再次发送给ai
    const toolResultStr = toolResult.join("\n\n");

    // ✅ 链式调用 replace，一口气搞定，不用写 finalSystemPrompt1/2/3/4/5
    const finalSystemPrompt = prompt3
      .replace("backpack_DATA", realbackpackdata)
      .replace("PlayerStats_DATA", realPlayerdata)
      .replace("USER_QUESTION", userInput)
      .replace("TOOL_RESULT", toolResultStr);

    //创建第3个messages
    const messages3 = [
      {
        id: 1,
        role: "system",
        content: finalSystemPrompt,
      },
      ...history.chatHistory,
    ];
    if (data2.choices && data2.choices.length > 0) {
      //防御性编程
      console.log("🔴 3, 进入面向用户层.");

      //2.0,多轮工具对话
      const Aiconfiguration3 = {
        //配置对象
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          //这里还是不建议用deepseek-r1 ,它不会fc,回答会丢一堆代码
          model: LLM,
          messages: messages3, //发送以下数据:新提示词,历史记录,背包,ai第一次回复,工具回复
          temperature: 0.7,
          //stream: true, //开启流式输出
        }),
      };
      //第三次发送给ai
      const response3 = await fetch(API_URL, Aiconfiguration3); //发送并收到回复
      const data3 = await response3.json(); //转为json格式
      console.log(
        "第三次发送api结束,输入消耗token:",
        data3.usage.prompt_tokens,
      );
      console.log(
        "第三次发送api结束,输出消耗token:",
        data3.usage.completion_tokens,
      );
      console.log("第三次发送api结束,总计消耗token:", data3.usage.total_tokens);
      const AiReply3 = data3.choices[0].message; //拿到回复中的有效内容
      //判断 response3.ok，先检查请求是否成功（比如 401 能提前发现）
      if (!response3.ok) {
        console.error("API 授权失败/请求错误：", data.error);
        return "抱歉，API 请求失败（请换个模型）";
      }

      console.log("ai最终回复:", AiReply3.content);
      return AiReply3.content;
    } else {
      console.error("响应异常", data);
      return "抱歉,ai出错";
    }
  } catch (error) {
    console.error("出错了!!!", error);
  }
}

module.exports = { chatWithAI };
