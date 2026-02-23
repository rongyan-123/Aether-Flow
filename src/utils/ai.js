import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";

const API_URL = "https://api.chatanywhere.tech/v1/chat/completions";
const API_KEY = "sk-bM1XLNYL7b3hchiNNtHoW7ZJFb4YTt4voQEZmrN2pB88HouC";

//该函数拿到的是ai回复,类型是字符串
export async function chatWithAI() {
  const messages = useChatHistoryStore(); //直接调用历史记录
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
        messages: messages.data, //将历史记录直接提交,用户当前发的也包含在这里,具体实现放另一个文件
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
