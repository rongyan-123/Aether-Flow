//ai聊天历史记录
import { defineStore } from "pinia";

export const useChatHistoryStore = defineStore("ChatHistory", {
  state: () => ({
    data: [
      {
        id: 1, //唯一标识,必须加,否则无法绑定和渲染
        role: "system", //身份,system表示是ai的初始设定,assistant代表是ai发的,user代表是用户发的
        content: "你是一个友好的 AI 助手，请用简洁的语言回答用户的问题。", //对话内容
      },
    ],
  }),
  actions: {
    useradd(input) {
      this.data.push({
        id: Date.now(),
        role: "user",
        content: input,
      });
    },
    assistantadd(input) {
      this.data.push({
        id: Date.now(),
        role: "assistant",
        content: input,
      });
    },

    //输出历史记录
    showuser() {},
  },
  //持久化存储
  //persist:true
});
