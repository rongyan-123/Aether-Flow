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
import { useInventoryStore } from "@/stores/Inventory";
import { usePlayerStore } from "@/stores/player";
import { eventBus } from "@/utils/eventBus";
import { onMounted, onUnmounted, ref } from "vue";
const Chat = useChatHistoryStore();
const backpack = useInventoryStore();
const player = usePlayerStore();
const userInput = ref("");

//获取游戏开始时,用户选择的数据
let userInformation = "无";

onMounted(() => {
  eventBus.on("user-info-updated", handler);
});
onUnmounted(() => {
  eventBus.off("user-info-updated", handler);
});
//获取数据的回调函数
function handler(data) {
  console.log("数据传输成功:", data);
  userInformation = data;
}

//发送到后端的函数
async function sendHistory() {
  console.log("检查用户输入", userInformation);

  //非空检查
  const check = userInput.value.trim();
  if (!check) {
    alert("输入不能为空");
    return;
  }

  //先把当前用户输入的字符串,上传到历史记录,而且要渲染出当前对话,再统一发送给ai
  //先上传到历史记录
  Chat.useradd(userInput.value); //必须先在上面创建实例后,才能调用历史记录的pinia仓库里的方法

  //渲染对话在另一个界面进行,原理是只渲染历史记录就行,这里要做的就是往历史记录里面加东西,他会自动渲染的

  console.log("进入chatwithAI函数之前用户的问题:", userInput.value);
  //先拿个中间量保存用户输入
  const midInput = userInput.value;
  // 清空输入框,这样中间量就不会消失
  userInput.value = "";

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ midInput }),
    });
    const data = await response.json(); //需要await
    console.log("最终回复为:", data.final_res.reply);
    //将对应ai回复输送到历史记录中,为下次回答做准备
    Chat.assistantadd(data.final_res.reply);
    //更新背包和面板
    backpack.data = data.final_res.inventory;
    player.$state = data.final_res.PlayerData;
  } catch (error) {
    console.log(error);
  }
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
