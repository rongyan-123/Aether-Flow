<template>
  <div class="input-bar">
    <div class="input-wrapper">
      <input
        v-model="userInput"
        type="text"
        placeholder="道友，请输入你想说的话..."
        @keyup.enter="sendHistory"
        class="text-input"
      />
      <button
        @click="sendHistory"
        :disabled="!userInput.trim()"
        :class="['send-btn', { active: userInput.trim() }]"
      >
        <svg viewBox="0 0 24 24" fill="none" class="send-icon">
          <path
            d="M5 12h14M12 5l7 7-7 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    <p class="input-hint">Enter 发送 · Shift+Enter 换行</p>
  </div>
</template>

<script setup>
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { useInventoryStore } from "@/stores/Inventory";
import { usePlayerStore } from "@/stores/player";
import { eventBus } from "@/utils/eventBus";
import { onMounted, onUnmounted, ref } from "vue";
import { defineEmits } from "vue";
const Chat = useChatHistoryStore();
const backpack = useInventoryStore();
const player = usePlayerStore();
const userInput = ref("");
const emit = defineEmits(["loading-Text"]);
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
const BASE_URL = "/api";
//发送到后端的函数
async function sendHistory() {
  console.log("检查用户输入", userInformation);
  //先上传到历史记录
  Chat.useradd(userInput.value); //必须先在上面创建实例后,才能调用历史记录的pinia仓库里的方法
  //选择后,立刻更新历史记录,出现一个消息框
  Chat.assistantadd();
  emit("loading-Text");
  //非空检查
  const check = userInput.value.trim();
  if (!check) {
    alert("输入不能为空");
    return;
  }

  console.log("进入chatwithAI函数之前用户的问题", userInput.value);
  const midInput = userInput.value;
  userInput.value = "";

  const response = await fetch(BASE_URL + "/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ midInput }),
  });
  const reader = await response.body.getReader();
  const decoder = new TextDecoder();
  let fullAIText = "";
  let running = true;
  while (running) {
    const { done, value } = await reader.read();
    if (done) {
      console.log("流式传输结束");
      try {
        const res = await fetch(BASE_URL + "/run-layer5", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullText: fullAIText }),
        });
        const data = await res.json();
        console.log("✅ 第五层执行结果(此处应该是背包和面板)", data);
        console.log("直接替换前端的背包和面板");
        backpack.setBackpackData(data.backpack.data);
        player.state = data.PlayerData;
      } catch (err) {
        console.error(
          "❌ 调用第五层失败(错误可能不一定在第五层,也可能在这前端)",
          err,
        );
      }
      break;
    }
    const chunk = decoder.decode(value, { stream: true });
    const packet = chunk.split("\n\n");
    for (const item of packet) {
      if (!item.trim()) continue;
      if (item.startsWith("data: ")) {
        const content = item.slice(6);
        console.log("流式传输中:", content);
        if (content === "[DONE]") {
          console.log("收到我们自己定义的结束标记，不处理了");
          continue;
        }
        try {
          const data = JSON.parse(content);
          const contents = data.choices?.[0]?.delta?.content || "";
          if (contents) {
            console.log("提取到的文本:", contents);
            fullAIText += contents;
            Chat.assistantChange(contents);
          }
        } catch (parseError) {
          console.error("解析 JSON 失败:", parseError, "原始字符串:", content);
        }
      }
    }
  }
  console.log("最终回复为:", fullAIText);
}
</script>

<style scoped>
.input-bar {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  padding: 6px 8px 6px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: #999;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
}

.text-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1a1a1a;
  background: transparent;
  padding: 10px 0;
  font-family: inherit;
}

.text-input::placeholder {
  color: #aaa;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  padding: 0;
}

.send-btn.active {
  background-color: #1a6dff;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(26, 109, 255, 0.3);
}

.send-btn.active:hover {
  background-color: #0052d9;
}

.send-icon {
  width: 18px;
  height: 18px;
}

.input-hint {
  text-align: center;
  font-size: 11px;
  color: #bbb;
  margin-top: 8px;
  letter-spacing: 0.5px;
}
</style>
