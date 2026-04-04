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
    assistantadd() {
      this.data.push({
        id: Date.now(),
        role: "assistant",
        content:
          "道友请稍安勿躁,正在推演世界,包括剧情,设定,人设,地图等等,可能需要1-2分钟",
        loading: true,
        isThinking: false,
        thinkingText: "",
      });
    },
    assistantChange(content) {
      //对象,是可以直接用参数引用的,修改它,同样会改变原对象,跟指针差不多
      const lastMsg = this.data[this.data.length - 1];
      //拿到历史记录的最后一条,然后将它的content,一点点替换
      //不过在此之前,要先把原来里面的文本全部清空,而且是只清理一次
      if (lastMsg.loading === true) {
        lastMsg.content = "";
        lastMsg.loading = false;
      }
      lastMsg.content += content;
    },
    deepThinking(reasoning) {
      //读取最后一个数组
      const lastMsg = this.data[this.data.length - 1];
      //改变其深度思考的状态
      lastMsg.isThinking = true;
      lastMsg.thinkingText += reasoning; // 流式拼接思考内容
    },

    //输出历史记录
    showuser() {},
  },
  //持久化存储
  //persist:true
});
