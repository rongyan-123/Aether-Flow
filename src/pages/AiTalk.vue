<template>
  <!-- ✅ 外层容器保持不变 -->
  <div class="chat-container">
    <h1>AI 聊天</h1>

    <!-- 初始化界面容器 -->
    <div v-show="GameStart.game_start === true" class="flex-container">
      <Information_Input @input-user="Game_start" />
    </div>

    <div v-if="GameStart.select === true" class="flex-container">
      <user_selected @user-selected="select_model"></user_selected>
    </div>

    <!-- 聊天界面容器 -->
    <div v-show="GameStart.ai_input === true" class="flex-container">
      <div class="talk" ref="tobottom">
        <div class="message-item" v-for="item in history.data" :key="item.id">
          <!-- 用户消息：靠右 -->
          <div v-if="item.role === 'user'" class="message user">
            {{ item.content }}
          </div>

          <!-- AI 消息：靠左 -->
          <div v-else-if="item.role === 'assistant'" class="message assistant">
            <!-- 🔥 新增：可折叠深度思考框（修仙主题：天道推演） -->
            <div v-if="item.thinkingText" class="thinking-box">
              <div class="thinking-header" @click.stop="toggleThinking(item)">
                <!-- 🔥 修复2：用函数调用，加 .stop 阻止冒泡 -->

                <span class="thinking-title">🔮 天道推演过程</span>
                <span class="thinking-toggle">
                  {{ item.showThinking ? "收起推演" : "查看推演" }}
                </span>
              </div>
              <transition name="fade">
                <!-- ✅ 修复逻辑：只受控于 showThinking，isThinking 只控制初始展开 -->
                <div v-show="item.showThinking" class="thinking-content">
                  {{ item.thinkingText }}
                </div>
              </transition>
            </div>

            <!-- 原有剧情内容 -->
            <span v-html="parseMarkdown(item.content)"></span>

            <!-- ✅ 保留：带旋转加载图标的状态提示 -->
            <transition name="fade">
              <div v-if="item.loading" class="ai-loading-bar">
                <div class="loading-spinner"></div>
                <span class="loading-text">{{ loadingText }}</span>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 输入框区域 -->
      <Ai_Input class="bottom" @loading-Text="handleChatEvent"></Ai_Input>
    </div>
  </div>
</template>

<script setup>
// ✅ 所有脚本逻辑完全保持不变！
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { useGameStart } from "@/stores/Game_Start";
import { marked } from "marked";
import { ref, watch, nextTick, onMounted, onActivated } from "vue";
const tobottom = ref(null);
let loadingText = ref("");
const history = useChatHistoryStore();
//false true
const GameStart = useGameStart();

//SSE切换接口函数
let eventSource = null;

function connectSSE() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  eventSource = new EventSource("http://localhost:3000/api/stream");
  eventSource.addEventListener("layer1", (e) => {
    loadingText.value = e.data;
  });
  // 第二层
  eventSource.addEventListener("layer2", (e) => {
    loadingText.value = e.data;
  });
  // 第三层
  eventSource.addEventListener("layer3", (e) => {
    loadingText.value = e.data;
  });
  // 第四层
  eventSource.addEventListener("layer4", (e) => {
    loadingText.value = e.data;
  });
}

function handleChatEvent() {
  connectSSE();
}

//输入结束,切换选择模板界面
function Game_start() {
  GameStart.select = true;
  GameStart.game_start = false;
}

//选择结束,切换到聊天界面
function select_model() {
  GameStart.ai_input = true;
  GameStart.select = false;
  connectSSE();
}

//滚动逻辑
const scrollToBottom = () => {
  nextTick(() => {
    if (tobottom.value) {
      tobottom.value.scrollTop = tobottom.value.scrollHeight;
    }
  });
};

// 🔥 界面修复：切换思考框显示状态
function toggleThinking(item) {
  if (item.showThinking === undefined) {
    item.showThinking = true; // 初始展开
  }
  item.showThinking = !item.showThinking;
}

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
/* 全局字体：和角色面板统一的古风宋体/楷体 */
@import url("https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap");

/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.flex-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出影响布局 */
  min-height: 0; /* 关键：让 flex 子元素可以正确收缩 */
}

/* 1. 整体容器：和角色面板风格完全统一的古风背景 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #dcc9a8 100%);
  margin: 0;
  padding: 0;
  font-family: "Noto Serif SC", "KaiTi", "STKaiti", "SimSun", serif;
  position: relative;
}

/* 牛皮纸全局纹理，和角色面板统一 */
.chat-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.08;
  pointer-events: none;
  z-index: 0;
}

/* 2. 标题样式：古风风格，和角色面板统一 */
h1 {
  text-align: center;
  padding: 20px;
  margin: 0;
  background: linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%);
  border-bottom: 1px solid #c9a87c;
  font-size: 20px;
  font-weight: 700;
  color: #5c3d2e;
  box-shadow: 0 2px 8px rgba(92, 61, 46, 0.08);
  letter-spacing: 4px;
  position: relative;
  z-index: 1;
}

/* 3. 消息区域：优化滚动条和内边距，古风风格 */
.talk {
  flex: 1;
  padding: 28px 22px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  /* 优化滚动条：古风棕色系，和整体统一 */
  scrollbar-width: thin;
  scrollbar-color: #c9a87c #f5e6d3;
}

.talk::-webkit-scrollbar {
  width: 6px;
}

.talk::-webkit-scrollbar-track {
  background: #f5e6d3;
}

.talk::-webkit-scrollbar-thumb {
  background: #c9a87c;
  border-radius: 3px;
}

.talk::-webkit-scrollbar-thumb:hover {
  background: #b8865c;
}

/* 4. 单条消息容器 */
.message-item {
  margin-bottom: 24px;
  width: 100%;
  overflow: hidden;
}

/* 5. 消息气泡通用样式：古风风格 */
.message {
  display: block;
  padding: 15px 22px;
  border-radius: 12px;
  max-width: 82%;
  font-size: 16px;
  line-height: 1.9;
  word-wrap: break-word;
  box-shadow: 0 3px 10px rgba(92, 61, 46, 0.12);
  transition: transform 0.1s ease;
  position: relative;
}

/* 7. 用户消息：古风棕色渐变，靠右 */
.user {
  float: right;
  clear: both;
  background: linear-gradient(135deg, #8b5a2b 0%, #a0522d 100%);
  color: #faf0e6;
  border-top-right-radius: 4px;
}

/* 8. AI 消息：古风米黄背景，左边框点缀 */
.assistant {
  float: left;
  clear: both;
  background: linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%);
  color: #5c3d2e;
  border-top-left-radius: 4px;
  border-left: 4px solid #8b5a2b;
}

/* 9. Markdown 解析样式优化：古风配色，和整体风格统一 */
.assistant h1 {
  font-size: 19px;
  color: #5c3d2e;
  margin: 0 0 12px 0;
  padding: 0 0 8px 0;
  border: none;
  border-bottom: 2px solid #8b5a2b;
  text-align: left;
  background: none;
  box-shadow: none;
  font-weight: 700;
  letter-spacing: 2px;
}

.assistant h2 {
  font-size: 17px;
  color: #7a5230;
  margin: 10px 0 8px 0;
  padding: 0;
  font-weight: 600;
  letter-spacing: 1px;
}

.assistant h3 {
  font-size: 16px;
  color: #7a5230;
  margin: 8px 0 6px 0;
  padding: 0;
  font-weight: 600;
}

.assistant strong {
  font-weight: 700;
  color: #8b4513;
}

.assistant em {
  color: #7a5230;
}

.assistant ul,
.assistant ol {
  padding-left: 24px;
  margin: 8px 0;
}

.assistant li {
  margin: 5px 0;
  color: #5c3d2e;
}

.assistant code {
  background: #e8d4b8;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #8b4513;
  border: 1px solid #c9a87c;
}

.assistant pre {
  background: #5c3d2e;
  padding: 14px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 10px 0;
}

.assistant pre code {
  background: none;
  color: #faf0e6;
  padding: 0;
  border: none;
}

/* 10. 输入框区域：古风风格，和整体统一 */
.bottom {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  background: linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%);
  padding: 18px 22px;
  border-top: 1px solid #c9a87c;
  box-shadow: 0 -2px 8px rgba(92, 61, 46, 0.08);
  position: relative;
  z-index: 1;
}

/* AI 消息下方的加载状态条 */
.ai-loading-bar {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 6px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
}

/* 旋转加载图标 */
.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  flex-shrink: 0;
}

/* 旋转动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 渐入渐出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* 🔥 新增：深度思考框样式 - 修仙古风主题 */
.thinking-box {
  margin: 8px 0 16px 0;
  border: 1px solid #c9a87c;
  border-radius: 8px;
  background: linear-gradient(180deg, #fdf8ef 0%, #f8f0e3 100%);
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(139, 90, 43, 0.1);
}

.thinking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  background: linear-gradient(180deg, #f8f0e3 0%, #f0e4d0 100%);
  font-size: 13px;
  color: #7a5230;
  user-select: none;
  border-bottom: 1px solid #e0d0b8;
  transition: background 0.2s ease;
}

.thinking-header:hover {
  background: linear-gradient(180deg, #f0e4d0 0%, #e8d4b8 100%);
}

.thinking-title {
  font-weight: 600;
  letter-spacing: 1px;
}

.thinking-toggle {
  color: #8b5a2b;
  font-size: 12px;
}

.thinking-content {
  padding: 14px 16px;
  font-size: 13px;
  color: #665544;
  line-height: 1.8;
  background-color: #fffbf5;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
  /* 古风滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #c9a87c #f8f0e3;
}

.thinking-content::-webkit-scrollbar {
  width: 4px;
}

.thinking-content::-webkit-scrollbar-track {
  background: #f8f0e3;
}

.thinking-content::-webkit-scrollbar-thumb {
  background: #c9a87c;
  border-radius: 2px;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}

/* 🔥 优化：加载状态条样式适配古风 */
.ai-loading-bar {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding: 8px 14px;
  background: linear-gradient(180deg, #f8f0e3 0%, #f5e6d3 100%);
  border-radius: 6px;
  font-size: 13px;
  color: #7a5230;
  border: 1px solid #e0d0b8;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #e0d0b8;
  border-top: 2px solid #8b5a2b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  flex-shrink: 0;
}
</style>
