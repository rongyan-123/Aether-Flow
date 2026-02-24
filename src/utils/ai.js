import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { useInventoryStore } from "@/stores/Inventory";
const API_URL = "https://api.chatanywhere.tech/v1/chat/completions";
const API_KEY = "sk-bM1XLNYL7b3hchiNNtHoW7ZJFb4YTt4voQEZmrN2pB88HouC";
//对话内容
const prompt = `你是修仙世界的AI助手玄机子。
我已经把用户的背包数据放在了下方，你可以直接使用这些数据回答用户的问题，绝对不要说你无法访问、无法读取用户数据。
请严格根据我给你的背包数据回复，不要编造不存在的物品。
请严格根据我给你的背包数据回复，回复格式要古风修仙，比如称呼为道友,等等,请你自行判断和选取
用户背包数据：{{backpack_DATA}}
          `;

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
        model: "gpt-3.5-turbo",
        messages: messages, //发送以下数据:历史记录,背包
        temperature: 0.7,
      }),
    };

    const response = await fetch(API_URL, Aiconfiguration); //发送并收到回复

    const data = await response.json(); //转为json格式

    //判断 response.ok，先检查请求是否成功（比如 401 能提前发现）
    if (!response.ok) {
      console.error("API 授权失败/请求错误：", data.error);
      return "抱歉，API 请求失败（可能是 Key 无效/过期）";
    }

    if (data.choices && data.choices.length > 0) {
      //防御性编程
      const AiReply = data.choices[0].message.content; //拿到回复中的文本内容
      console.log("ai回复:", AiReply);
      return AiReply; //将其返回给其他使用该函数的组件
    } else {
      console.error("响应异常", data);
      return "抱歉,ai出错";
    }
  } catch (error) {
    console.error("出错了!!!", error);
  }
}
