import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { useInventoryStore } from "@/stores/Inventory";
//chatGPT地址
// 原 API 地址
const API_URL = "https://api.chatanywhere.tech/v1/chat/completions";
// 换成备用地址（二选一）
//const API_URL = "https://api.chatanywhere.com.cn/v1/chat/completions";
// 或
// const API_URL = "https://api.openai-proxy.com/v1/chat/completions";

const API_KEY = "sk-bM1XLNYL7b3hchiNNtHoW7ZJFb4YTt4voQEZmrN2pB88HouC";
//对话内容
const prompt = `你是修仙世界的AI助手玄机子,请严格根据我给你的数据回复，回复格式要古风修仙，比如称呼为道友,等等,请你自行判断和选取
我已经把用户的背包数据放在了下方，你可以直接使用这些数据回答用户的问题，绝对不要说你无法访问、无法读取用户数据。
请严格根据我给你的背包数据回复，不要编造不存在的物品。
用户背包数据：{{backpack_DATA}}
          `;

//======================== ai调用工具 ============================
const tools = [
  {
    type: "function",
    function: {
      name: "Backpack_additems",
      description:
        "这是一个向背包中添加物品的工具(可批量添加),当用户获得(包括不限于捡到,抢到,击杀获得等等)物品时,在背包数据中添加物品",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description:
              "要添加的物品列表(方便批量添加,但也可只添加一件),每个物品包含各自的字段",
            item: {
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
            required: ["name", "value", "mount"],
          },
        },
        required: ["items"], // 必填：必须传入物品数组
      }, //parameters括号
    },
  }, //tool
];

// ==================== 核心请求函数 ====================
//该函数拿到的是ai回复,类型是字符串
export async function chatWithAI() {
  const history = useChatHistoryStore(); //创建历史记录实例
  const backpack = useInventoryStore(); //创建背包实例

  const realbackpackdata = JSON.stringify(backpack.data, null, 2); //转化背包内数据为字符串

  //每次发送请求都会更新一次背包(原理是每次都用replace替换prompt里面的数据),供ai同步读取
  const finalSystemPrompt = prompt.replace("backpack_DATA", realbackpackdata);

  //创建最终的message
  const messages = [
    {
      id: 1,
      role: "system",
      content: finalSystemPrompt,
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
        //deepseek-r1, gpt-3.5-turbo , gpt-4o
        model: "deepseek-r1",
        messages: messages, //发送以下数据:历史记录,背包
        temperature: 0.7,
        tools: tools, //工具
        tool_choice: "auto", //自动选择调用,注意这里tool没有s的
      }),
    };

    const response = await fetch(API_URL, Aiconfiguration); //发送并收到回复

    const data = await response.json(); //转为json格式
    // console.log("本次消耗token:", data.usage.completion_tokens);

    //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
    if (!response.ok) {
      console.error("API 授权失败/请求错误：", data.error);
      return "抱歉，API 请求失败（可能是 Key 无效/过期）";
    }
    const AiReply = data.choices[0].message; //拿到回复中的有效内容

    //解析工具,注意这里的tool是没有s的,官方规定接口就是这个,没办法
    if (AiReply.tool_calls && AiReply.tool_calls.length > 0) {
      //循环遍历ai使用的所有工具
      console.log("成功进入工具");
      for (const tool of AiReply.tool_calls) {
        //获取工具名字
        const toolname = tool.function.name;
        //获取ai返回的参数,此处parse是将JSON格式转为对象格式
        const toolArg = JSON.parse(tool.function.arguments);

        //批量添加
        if (toolname === "Backpack_additems") {
          let count = 0;
          for (const item of toolArg.items) {
            count++;
            backpack.add(item);
          }
          console.log(`成功添加${count}件物品到背包!`);
          //由于ai在调用工具时,content是空,所以只能手动生成回复,如果需要ai解析,后面就还要再fetch发送一次,有点浪费key,就算了
          const returncontent = toolArg.items.map((item) => {
            return `- ${item.name} ×${item.mount},单件价值${item.value}`;
          });
          const returncontent2 = returncontent.join("\n");
          return `恭喜道友获得:\n${returncontent2}`;
        }
      }
    }

    if (data.choices && data.choices.length > 0) {
      //防御性编程
      const AiReply_content = AiReply.content; //拿到具体的文本内容
      console.log("ai回复:", AiReply_content);
      return AiReply_content; //将其返回给其他使用该函数的组件
    } else {
      console.error("响应异常", data);
      return "抱歉,ai出错";
    }
  } catch (error) {
    console.error("出错了!!!", error);
  }
}
