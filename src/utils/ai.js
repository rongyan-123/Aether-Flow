import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { queryName } from "@/StaticData/AllData";
import { useInventoryStore } from "@/stores/Inventory";
import { usePlayerStore } from "@/stores/player";
import { tools } from "@/utils/aitools";
//chatGPT地址
// 原 API 地址
const API_URL = "https://api.chatanywhere.tech/v1/chat/completions";
// 换成备用地址（二选一）
//const API_URL = "https://api.chatanywhere.com.cn/v1/chat/completions";
// 或
// const API_URL = "https://api.openai-proxy.com/v1/chat/completions";

const API_KEY = "sk-bM1XLNYL7b3hchiNNtHoW7ZJFb4YTt4voQEZmrN2pB88HouC";
//=========================== ai提示词 ==========================

// ==================== 核心请求函数 ====================
//分层如下:
//1,数据查询层:第一次发送api,调用查询工具,获取对应数据
//2,执行工具层:第二次发送api,根据数据选择接下来要执行的工具,比如添加物品,添加功法等等,以后的生成剧情也会在这里，战斗判断也会在这里
//3,面向用户层:第三次发送api,总结以上所有工具回复,给用户做出最后的总结

//该函数拿到的是ai回复,类型是字符串
export async function chatWithAI(userInput) {
  const prompt = `【角色设定】
你是修仙世界的【古籍查阅使】，你的**唯一、绝对、不可更改的职责**是：仅根据用户的问题，调用【Query_Data】工具查询对应的世界观设定，绝对不做任何查询之外的事。

【核心任务（只有这一件事）】
1.  仔细阅读用户的问题；
2.  从用户问题中提取1-2个核心关键字；
3.  **必须、只能、优先**调用【Query_Data】工具进行查询；
4.  如果遇到许多问题,可以连续调用查询工具

【用户当前数据（仅用于理解上下文，绝对不能修改）】
---
用户背包数据：
{{backpack_DATA}}

用户个人面板数据：
{{PlayerStats_DATA}}

用户原始问题：
${userInput}
---

【强制执行规则（违反任何一条都视为失败）】
1.  【只能调用查询工具】：这一层你**唯一能调用的工具只有 Query_Data**，绝对不能调用 Backpack_additems、PlayerStats_AddTechnique、Technique_Add 等任何修改/添加类工具；
2.  【必须拆关键字查询】：提取用户问题中最核心的1-2个名词，不能查询整句话，不能加标点；
3.  【绝对禁止修改数据】：绝对不能有任何“添加物品”“加入面板”“修改修为”的想法或行为；
4.  【查询结果必须返回】：如果用户问了问题，必须调用 Query_Data，不能直接编造答案。

【绝对禁止】
- 禁止调用 Query_Data 以外的任何工具；
- 禁止有任何修改用户背包、面板数据的想法或行为；
- 禁止编造查询结果；
- 禁止在这一层直接解决用户的“添加/学习”需求，只负责查询信息。

【正反例子】
---
✅ 正确示范1：
用户问题：“燃血秘术是什么？”
你的行动：调用 Query_Data，参数 queryName=燃血秘术

✅ 正确示范2：
用户问题：“把燃血秘术加入我的面板”
你的行动：调用 Query_Data，参数 queryName=燃血秘术（注意：只查询，绝对不调用添加工具）

✅ 正确示范3：
用户问题：“你好”
你的行动：直接回复“道友你好，请问你想查询什么？”，不调用任何工具

❌ 错误示范1：
用户问题：“把燃血秘术加入我的面板”
你的行动：调用了 Backpack_additems 或 Technique_Add → 绝对禁止！

❌ 错误示范2：
用户问题：“结丹是多少修为”
你的行动：直接回答“结丹需要十万点修为”，没有调用 Query_Data → 绝对禁止！
---

现在，请基于以上所有规则，执行你的任务。
          `;
  // 新增这行，看控制台打印了几次
  console.log(
    "=== chatWithAI 函数被触发 ===",
    "时间戳：",
    new Date().getTime(),
  );
  const history = useChatHistoryStore(); //创建历史记录实例
  const backpack = useInventoryStore(); //创建背包实例
  const Player = usePlayerStore(); //创建用户个人面板实例
  const realbackpackdata = JSON.stringify(backpack.data, null, 2); //转化背包内数据为字符串
  const realPlayerdata = JSON.stringify(Player.$state, null, 2); //转化面板内数据为字符串,请注意,面板仓库里没有data,全是散的,放在state里面

  //每次发送请求都会更新一次(原理是每次都用replace替换prompt里面的数据),供ai同步读取
  const first_finalSystemPrompt = prompt.replace(
    "backpack_DATA",
    realbackpackdata,
  );
  const finalSystemPrompt2 = first_finalSystemPrompt.replace(
    "PlayerStats_DATA",
    realPlayerdata,
  );
  console.log("🔴 面板原始数据：", realPlayerdata); // 看面板数据是不是真的有内容
  console.log("🔴 最终给AI的系统提示词：", finalSystemPrompt2); // 看面板占位符到底有没有被替换掉

  //创建最终的message
  const messages = [
    {
      id: 1,
      role: "system",
      content: finalSystemPrompt2,
    },
    ...history.data,
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

        model: "gpt-3.5-turbo",
        messages: messages, //发送以下数据:历史记录,背包
        temperature: 0.7,
        //stream: true, //开启流式输出
        tools: tools, //工具
        type: "function",
        function: {
          name: "Query_Data",
        }, //第一层只能调用查询工具
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
      //遍历所有查询的内容
      for (const tool of AiReply.tool_calls) {
        const toolname = tool.function.name; //获取工具名字
        const toolArg = JSON.parse(tool.function.arguments); //获取ai返回的参数,此处parse是将JSON格式转为对象格式
        console.log("当前查询:", toolArg.name);
        if (toolname === "Query_Data") {
          QueryResult.push(queryName(toolArg.name));
        }
      }
      console.log("查询结束");
    }
    console.log("🔴 2, 进入工具执行层.");

    //重要!!!//将工具结果转为json格式,否则ai无法读取工具回复结果
    const tools_json = JSON.stringify(tools, null, 2);
    const prompt2 = `
【角色设定】:你是修仙世界的【工具执行官】，你的唯一职责是：基于已有的查询结果，严格从给定的工具列表中选择最合适的工具执行，绝对不能做任何超出工具范围的事。

【核心任务】
1.  仔细阅读下方的【查询结果】【用户原始问题】【可用工具列表】；
2.  严格基于【查询结果】，判断用户的需求是什么；
3.  从【可用工具列表】中选择**唯一最合适**的工具执行；
4.  如果需要跳过，就调用【Skip】工具。

【输入上下文】
---
【1. 查询结果（来自第一次API调用，你必须100%基于此判断，绝对不能编造）】
${QueryResult}
---
【2. 用户原始问题】
${userInput}
---
【3. 可用工具列表（你只能从这里选，绝对不能用别的，而且这里面的查询工具你也不需要用）】
${tools_json}
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

✅ 正确示范3：
【查询结果】：没有找到轻身术的信息
【用户问题】：把轻身术加入我的面板
你的行动：调用 Skip 工具，参数 reason="查询结果里没有找到轻身术的相关信息"
---

现在，请基于以上所有规则，执行你的任务。
`;
    //新message2
    const messages2 = [
      {
        id: 1,
        role: "system",
        content: prompt2,
      },
      ...history.data,
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

        model: "gpt-3.5-turbo",
        messages: messages2, //发送以下数据:历史记录,背包
        temperature: 0.7,
        //stream: true, //开启流式输出
        tools: tools, //工具
        tool_choice: "auto", //自动选择调用,注意这里tool没有s的
      }),
    };
    //第二次发送
    console.log("第二次发送api");
    const response2 = await fetch(API_URL, Aiconfiguration2);
    const data2 = await response2.json();
    // ✅ 防御性检查：先判断 choices 有没有、长度够不够
    if (!data2.choices || data2.choices.length === 0) {
      console.error("API 返回异常，没有 choices：", data);
      return "抱歉，玄机子刚刚推演出错了，请稍后再试...";
    }
    const AiReply2 = data2.choices[0].message; // 包含所有回复和工具使用情况
    console.log("消耗token:", data2.usage.total_tokens);

    // // 收集所有工具的执行结果,放在全局中使用
    const toolResult = [];
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

          toolResult.push(Player.add_Cultivation_Technique(toolArg));
        }

        //  增加技艺
        if (toolname === "Technique_Add") {
          console.log("ai调用增加技艺工具,增加:", toolArg.name);
          console.log("当前toolArg内容为:", toolArg);

          toolResult.push(Player.add_Technique(toolArg));
        }
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

【已知信息（如果用不到就自然忽略）】
- 用户背包内容:
{{backpack_DATA}}
- 用户当前面板：
  {{PlayerStats_DATA}}

【必须读取和总结,回复的信息】
- 用户原始请求(精准回复)：{{USER_QUESTION}}
- 工具返回的结果(必须读取)：{{TOOL_RESULT}}
- 根据用户问题,返回的查询结果(必须参考):${QueryResult}

请直接生成你的回复：`;

    //把工具回复放到message2里面,准备再次发送给ai
    const toolResultStr = toolResult.join("\n\n");

    // ✅ 链式调用 replace，一口气搞定，不用写 finalSystemPrompt1/2/3/4/5
    const finalSystemPrompt = prompt3
      .replace("backpack_DATA", realbackpackdata)
      .replace("PlayerStats_DATA", realPlayerdata)
      .replace("USER_QUESTION", userInput)
      .replace("TOOL_RESULT", toolResultStr);

    //创建第san个messages
    const messages3 = [
      {
        id: 1,
        role: "system",
        content: finalSystemPrompt,
      },
      ...history.data,
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
          model: "gpt-3.5-turbo",
          messages: messages3, //发送以下数据:新提示词,历史记录,背包,ai第一次回复,工具回复
          temperature: 0.7,
          //stream: true, //开启流式输出
        }),
      };
      //第三次发送给ai
      const response3 = await fetch(API_URL, Aiconfiguration3); //发送并收到回复
      const data3 = await response3.json(); //转为json格式
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
