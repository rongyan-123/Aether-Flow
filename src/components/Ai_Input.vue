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

  //先把当前用户输入的字符串,上传到历史记录,而且要渲染出当前对话,再统一发送给ai

  //渲染对话在另一个界面进行,原理是只渲染历史记录就行,这里要做的就是往历史记录里面加东西,他会自动渲染的

  console.log("进入chatwithAI函数之前用户的问题:", userInput.value);
  //先拿个中间量保存用户输入
  const midInput = userInput.value;
  // 清空输入框,这样中间量就不会消失
  userInput.value = "";

  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ midInput }),
  });
  ///流式输出
  //拿到二进制数据,getReader是'流'的专属函数,只要是这种数据流,都可以访问getReader,与SSE端口无关
  const reader = await response.body.getReader();
  //解码器,作用是解析reader这个二进制的数据
  const decoder = new TextDecoder();
  // 👇收集完整AI回复
  let fullAIText = "";
  //避免报错
  let running = true;
  while (running) {
    //read()是一个异步函数,返回的是promise,作用是持续读取数据,没数据就等待,直到结束
    //返回值就两个,done和value
    const { done, value } = await reader.read();
    if (done) {
      console.log("流式传输结束");
      // 👇 传输完成，调用后端第五层
      try {
        const res = await fetch("http://localhost:3000/api/run-layer5", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullText: fullAIText }),
        });
        const data = await res.json();
        console.log("✅ 第五层执行结果(此处应该是背包和面板)：", data);
        console.log("直接替换前端的背包和面板");
        backpack.setBackpackData(data.backpack.data);
        player.$state = data.PlayerData;
      } catch (err) {
        console.error(
          "❌ 调用第五层失败(错误可能不一定在第五层,也可能在这前端)：",
          err,
        );
      }
      break;
    }
    //解析二进制数据,最后的stream是指流式输出
    const chunk = decoder.decode(value, { stream: true });

    //将输出按照特定解析分开
    const packet = chunk.split("\n\n");
    for (const item of packet) {
      //排除空选项
      if (!item.trim()) continue;
      //判断前6个字符是否正确
      if (item.startsWith("data: ")) {
        const content = item.slice(6);
        console.log("流式传输中:", content);

        //我们自己的业务逻辑：判断是不是结束标记
        if (content === "[DONE]") {
          console.log("收到我们自己定义的结束标记，不处理了");
          continue;
        }
        try {
          // 6. 【关键第三步】现在 content 是纯 JSON 了，可以 parse 了
          const data = JSON.parse(content);

          // 7. 提取出真正的文本内容（不同大模型 API 的路径可能略有不同）
          // 通常是在 choices[0].delta.content 这里
          const contents = data.choices?.[0]?.delta?.content || "";

          if (contents) {
            console.log("提取到的文本:", contents);
            // 8. 推给前端（记得也要加 data: 前缀和 \n\n 后缀）
            //res.write(`data: ${contents}\n\n`);
            // 👇 拼接完整文本
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
