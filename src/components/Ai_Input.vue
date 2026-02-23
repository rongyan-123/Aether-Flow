<template>
  <div class="input-container">
    <input
      v-model="userInput"
      type="text"
      placeholder="请输入文本"
      @keyup.enter="sendHistory"
    />
    <button @click="sendHistory">发送</button>
  </div>
</template>

<script setup>
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { chatWithAI } from "@/utils/ai";
import { ref } from "vue";
const Chat = useChatHistoryStore();
const userInput = ref("");
async function sendHistory() {
  //非空检查
  const check = userInput.value.trim();
  if (!check) {
    alert("输入不能为空");
    return;
  }

  //先把当前用户输入的字符串,上传到历史记录,而且要渲染出当前对话,再统一发送给ai
  //先上传到历史记录
  Chat.useradd(userInput.value); //必须先在上面创建实例后,才能调用里面的方法

  //渲染对话在另一个界面进行,原理是只渲染历史记录就行,这里要做的就是往历史记录里面加东西,他会自动渲染的

  // 清空输入框
  userInput.value = "";

  //用 await 等待 chatWithAI 执行完成，拿到真正的 AI 回复字符串
  const aiReply = await chatWithAI();

  //调用ai,开始读取历史记录,并输出对应回复
  Chat.assistantadd(aiReply);
}
</script>

<style scoped>
/* 核心：强制横向布局，绝对不换行 */
.input-container {
  width: 100%;
  display: flex;
  flex-direction: row; /* 强制横向排列 */
  align-items: center;
  flex-wrap: nowrap; /* 关键：禁止换行，按钮不会掉下去 */
  gap: 12px;
  padding: 12px 16px;
  box-sizing: border-box;
}

/* 输入框：自动占满剩余空间，不会挤压按钮 */
.input-container input {
  flex: 1;
  min-width: 0; /* 关键：解决flex布局里输入框不收缩的问题 */
  height: 44px;
  padding: 0 16px;
  border: 1px solid #e0e0e0;
  border-radius: 22px;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-container input:focus {
  border-color: #007aff;
}

/* 发送按钮：固定尺寸，禁止被压缩 */
.input-container button {
  flex-shrink: 0; /* 关键：按钮不会被挤压变形/换行 */
  width: 80px;
  height: 44px;
  padding: 0;
  background-color: #007aff;
  color: #ffffff;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color 0.2s;
}

.input-container button:hover {
  background-color: #0056b3;
}
</style>
