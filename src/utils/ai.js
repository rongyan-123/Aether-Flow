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
const prompt = `你是修仙世界的AI助手,请严格根据我给你的数据回复，回复格式要古风修仙，比如称呼为道友,等等,请你自行判断和选取,但是不要文言文,通俗易懂即可,而且要模板化,但是绝对不要丢代码在content里面'
核心规则：
1. 你可以直接读取用户的背包,个人面板数据，绝对不能说无法访问/无法读取用户数据；
2. 绝对不能编造背包和面板里不存在的信息，所有回复必须严格基于用户所有数据；
3. 【强制规则】无论用户提到获得/使用多少个物品，，把所有物品都放在同一个items数组里，绝对不能拆分成多个工具调用；
4. 物品的value和mount参数如果用户没指定，你可以自行设定合理的正整数。
5. 处理用户请求时，**先返回自然语言回答（比如解释物品/回应需求），再调用对应的工具执行操作**；
5. 凡是用户询问的问题,检测到"何为","什么","啥"等等之类的问题词,都要调用查询工具
6. 当进行查找时,请必须将句子拆分,拆成单个词语和关键字进行查找,比如用户询问"结丹是多少修为",那么就提取"结丹"或"修为"等关键字,进行查找,绝对不能直接使用工具查询一整句话,绝对不能加入标点符号,绝对不能查找超过两个词语,只能查找一个,如果要查找多个,请多次调用工具

我已经把用户的数据放在了下方，
用户背包数据：{{backpack_DATA}}
用户个人面板数据:{{PlayerStats_DATA}}
          `;

// ==================== 核心请求函数 ====================
//该函数拿到的是ai回复,类型是字符串
export async function chatWithAI(userInput) {
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
  const finalSystemPrompt = prompt.replace("backpack_DATA", realbackpackdata);
  const finalSystemPrompt2 = finalSystemPrompt.replace(
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
        tool_choice: "auto", //自动选择调用,注意这里tool没有s的
      }),
    };

    const response = await fetch(API_URL, Aiconfiguration); //发送并收到回复

    // 👇 新增：打印完整响应信息
    console.log("=== 响应信息 ===");
    console.log("响应状态码：", response.status);
    console.log("响应头：", Object.fromEntries(response.headers.entries()));

    const data = await response.json(); //转为json格式
    // console.log("本次消耗token:", data.usage.completion_tokens);

    //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
    if (!response.ok) {
      console.error("API 授权失败/请求错误：", data.error);
      return "抱歉，API 请求失败（请换个模型）";
    }
    const AiReply = data.choices[0].message; //拿到回复中的有效内容

    //获取深度思考
    //const deepthink = AiReply.reasoning_content || "";

    console.log("ai第一次回复:", AiReply.content);

    console.log("3️⃣ 检查是否有 tool_calls：", AiReply.tool_calls);
    // // 收集所有工具的执行结果,放在全局中使用
    const toolResult = [];
    //====================== 解析工具 ==============================================
    //循环遍历ai使用的所有工具, 注意这里的tool是没有s的
    if (AiReply.tool_calls && AiReply.tool_calls.length > 0) {
      console.log("成功进入工具");
      let count = 0; //判断ai使用了多少次工具
      console.log(
        "ai使用的工具数量AiReply.tool_calls.length=",
        AiReply.tool_calls.length,
      ); //判断ai使用了多少次工具

      //遍历工具,进行使用
      for (const tool of AiReply.tool_calls) {
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
          //由于ai在调用工具时,content是空,所以只能手动生成回复,如果需要ai解析,后面就还要再fetch发送一次,有点浪费key,就算了
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

        //查询
        if (toolname === "Query_Data") {
          console.log("ai调用查询,查找:", toolArg.queryName);

          //去除无意义修饰词
          // const uselessWords = ["什么", "何为", "怎么", "多少", "是", "的", "吗", "呢"];

          if (queryName) {
            // queryItemName(toolArg.queryName);
            toolResult.push(`查询工具使用结果:${queryName(toolArg.queryName)}`);
            console.log("进入查询,结果如下:", queryName(toolArg.queryName));
          }

          console.log("查询结束");
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
      console.log("一共使用工具次数:", count);
      console.log("toolResult==", toolResult);
    }
    const prompt2 = `
    你是修仙世界中精通推演与答疑的【玄机子】。
【绝对核心规则（违反即重写）】
1. **唯一任务**：仅根据下方提供的信息,以及工具的回复,以及上次的ai回复,总结并生成一段自然流畅的修仙风格回复；
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
- 上一次ai回复(仅参考自然语言,若为空则不需要参考):{{AI_firstResponse}}

请直接生成你的回复：`;

    //把工具回复放到message2里面,准备再次发送给ai
    const toolResultStr = toolResult.join("\n\n");

    const finalSystemPrompt = prompt2.replace(
      "backpack_DATA",
      realbackpackdata,
    );
    const finalSystemPrompt2 = finalSystemPrompt.replace(
      "PlayerStats_DATA",
      realPlayerdata,
    );
    const finalSystemPrompt3 = finalSystemPrompt2.replace(
      "USER_QUESTION",
      userInput,
    );
    const finalSystemPrompt4 = finalSystemPrompt3.replace(
      "TOOL_RESULT",
      toolResultStr,
    );
    const finalSystemPrompt5 = finalSystemPrompt4.replace(
      "AI_firstResponse",
      AiReply.content,
    );

    //创建第二个messages
    const messages2 = [
      {
        id: 1,
        role: "system",
        content: finalSystemPrompt5,
      },
      ...history.data,
    ];

    if (data.choices && data.choices.length > 0) {
      //防御性编程
      console.log("🔵 第二次 API 调用：把工具结果发回给 AI...");

      //2.0,多轮工具对话
      const Aiconfiguration = {
        //配置对象
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          //这里还是不建议用deepseek-r1 ,它不会fc,回答会丢一堆代码
          model: "gpt-3.5-turbo",
          messages: messages2, //发送以下数据:新提示词,历史记录,背包,ai第一次回复,工具回复
          temperature: 0.7,
          //stream: true, //开启流式输出
        }),
      };
      //第二次发送给ai
      const response = await fetch(API_URL, Aiconfiguration); //发送并收到回复
      const data = await response.json(); //转为json格式
      //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
      if (!response.ok) {
        console.error("API 授权失败/请求错误：", data.error);
        return "抱歉，API 请求失败（请换个模型）";
      }
      const AiReply = data.choices[0].message; //拿到回复中的有效内容
      console.log("ai最终回复:", AiReply.content);
      return AiReply.content;
    } else {
      console.error("响应异常", data);
      return "抱歉,ai出错";
    }
  } catch (error) {
    console.error("出错了!!!", error);
  }
}
