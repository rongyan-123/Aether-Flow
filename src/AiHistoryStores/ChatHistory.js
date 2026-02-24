//ai聊天历史记录
import { defineStore } from "pinia";
export const useChatHistoryStore = defineStore("ChatHistory", {
  state: () => ({
    //请注意,此处消息记录只放user和assistant,初始的system记录请放在ai.js文件那里
    data: [],
  }),
  actions: {
    useradd(input) {
      this.data.push({
        id: Date.now(), //唯一标识,必须加,否则无法绑定和渲染
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
