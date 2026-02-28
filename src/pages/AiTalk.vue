<template>
  <!-- ✅ 外层容器保持不变 -->
  <div class="chat-container">
    <h1>AI 聊天</h1>
    <!-- 聊天消息区域 -->
    <div class="talk" ref="tobottom">
      <div class="message-item" v-for="item in history.data" :key="item.id">
        <!-- 用户消息：靠右 -->
        <div v-if="item.role === 'user'" class="message user">
          {{ item.content }}
        </div>

        <!-- AI 消息：靠左 -->
        <div v-else-if="item.role === 'assistant'" class="message assistant">
          <span v-html="parseMarkdown(item.content)"></span>
        </div>
      </div>
    </div>

    <!-- 输入框区域 -->
    <Ai_Input class="bottom"></Ai_Input>
  </div>
</template>

<script setup>
// ✅ 所有脚本逻辑完全保持不变！
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { marked } from "marked";
import { ref, watch, nextTick, onMounted, onActivated } from "vue";
const tobottom = ref(null);
const history = useChatHistoryStore();

//滚动逻辑
const scrollToBottom = () => {
  nextTick(() => {
    if (tobottom.value) {
      tobottom.value.scrollTop = tobottom.value.scrollHeight;
    }
  });
};

watch(
  () => history.data,
  () => {
    scrollToBottom();
  },
  { deep: true },
);

onMounted(() => {
  scrollToBottom();
});
onActivated(() => {
  scrollToBottom();
});

const parseMarkdown = (content) => {
  if (!content) return "";
  return marked.parse(content, { gfm: true });
};
</script>

<style scoped>
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 1. 整体容器：和之前面板风格统一的渐变背景 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  margin: 0;
  padding: 0;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

/* 2. 标题样式：和之前统一 */
h1 {
  text-align: center;
  padding: 18px;
  margin: 0;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

/* 3. 消息区域：优化滚动条和内边距 */
.talk {
  flex: 1;
  padding: 25px 20px;
  overflow-y: auto;
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.talk::-webkit-scrollbar {
  width: 6px;
}

.talk::-webkit-scrollbar-track {
  background: #f7fafc;
}

.talk::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.talk::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 4. 单条消息容器 */
.message-item {
  margin-bottom: 22px;
  width: 100%;
  overflow: hidden;
}

/* 5. 消息气泡通用样式：更柔和的阴影和圆角 */
.message {
  display: block;
  padding: 14px 20px;
  border-radius: 16px;
  max-width: 85%;
  font-size: 15px;
  line-height: 1.8;
  word-wrap: break-word;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
  transition: transform 0.1s ease;
}

/* 7. 用户消息：渐变蓝色，更柔和 */
.user {
  float: right;
  clear: both;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-top-right-radius: 4px;
}

/* 8. AI 消息：白色背景，左边框点缀 */
.assistant {
  float: left;
  clear: both;
  background-color: #ffffff;
  color: #2c3e50;
  border-top-left-radius: 4px;
  border-left: 3px solid #667eea;
}

/* 9. Markdown 解析样式优化：和整体风格统一 */
.assistant h1 {
  font-size: 19px;
  color: #2c3e50;
  margin: 0 0 12px 0;
  padding: 0 0 8px 0;
  border: none;
  border-bottom: 2px solid #667eea;
  text-align: left;
  background: none;
  box-shadow: none;
  font-weight: 600;
}

.assistant h2 {
  font-size: 17px;
  color: #34495e;
  margin: 10px 0 8px 0;
  padding: 0;
  font-weight: 600;
}

.assistant h3 {
  font-size: 16px;
  color: #34495e;
  margin: 8px 0 6px 0;
  padding: 0;
  font-weight: 500;
}

.assistant strong {
  font-weight: 600;
  color: #667eea;
}

.assistant em {
  color: #7f8c8d;
}

.assistant ul,
.assistant ol {
  padding-left: 22px;
  margin: 8px 0;
}

.assistant li {
  margin: 5px 0;
  color: #2c3e50;
}

.assistant code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
  color: #e74c3c;
}

.assistant pre {
  background: #2c3e50;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 10px 0;
}

.assistant pre code {
  background: none;
  color: #ecf0f1;
  padding: 0;
}

/* 10. 输入框区域：和之前面板风格统一 */
.bottom {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  padding: 15px 20px;
  border-top: 1px solid #e8e8e8;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
}
</style>
