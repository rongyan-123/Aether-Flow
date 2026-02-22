import { ref } from "vue";

const API_URL = "https://api.chatanywhere.tech/v1/chat/completions";
const API_KEY = "sk-bM1XLNYL7b3hchiNNtHoW7ZJFb4YTt4voQEZmrN2pB88HouC";

const messages = [
  {
    role: "system",
    content:
      "你是一个ai读取机器,将会根据用户提示,读取到你能读取的所有数据,然后输出",
  },
  {
    role: "user",
    content: "来读取一下背包里面的东西",
  },
];

export async function chatWithAI(messages) {
  try {
  } catch (error) {
    console.error("出错了!!!", error);
  }
}
