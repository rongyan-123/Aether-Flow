<template>
  <div class="chat-wrapper">
    <!-- 游戏初始化阶段 -->
    <div v-if="GameStart.game_start" class="init-screen">
      <div class="init-header">
        <h1 class="init-title">仙 途 启 程</h1>
        <p class="init-subtitle">道友，请留下你的名号与性别，开启这段修仙之旅</p>
      </div>
      <Information_Input class="init-card" @input-user="Game_start" />
    </div>

    <!-- 角色选择阶段 -->
    <div v-if="GameStart.select" class="init-screen">
      <div class="init-header">
        <h1 class="init-title">天 命 抉 择</h1>
        <p class="init-subtitle">选择你心仪的出身与资质，踏上修仙之路</p>
      </div>
      <user_selected class="select-cards" @user-selected="select_model" />
    </div>

    <!-- 正式聊天阶段 -->
    <div v-show="GameStart.ai_input" class="chat-stage">
      <!-- 消息列表区域 -->
      <div class="messages-container" ref="tobottom">
        <div class="messages-inner">
          <div
            v-for="item in history.data"
            :key="item.id"
            :class="['message-row', item.role === 'user' ? 'is-user' : 'is-ai']"
          >
            <!-- AI头像 -->
            <div v-if="item.role === 'assistant'" class="avatar">
              <span class="avatar-icon">仙</span>
            </div>

            <!-- 消息内容 -->
            <div :class="['bubble', item.role === 'user' ? 'bubble-user' : 'bubble-ai']">
              <!-- 深度思考折叠区 -->
              <template v-if="item.role === 'assistant' && item.thinkingText">
                <div class="thinking-collapse">
                  <div class="thinking-toggle" @click.stop="toggleThinking(item)">
                    <span class="toggle-icon" :class="{ expanded: item.showThinking }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span class="toggle-label">天道推演</span>
                    <span class="toggle-badge" v-if="!item.showThinking">点击查看</span>
                  </div>
                  <transition name="collapse">
                    <div v-show="item.showThinking" class="thinking-body">
                      {{ item.thinkingText }}
                    </div>
                  </transition>
                </div>
              </template>

              <!-- 正文（Markdown） -->
              <div class="message-content" v-html="parseMarkdown(item.content)"></div>

              <!-- Loading状态 -->
              <transition name="fade">
                <div v-if="item.loading" class="loading-indicator">
                  <div class="dot-spinner">
                    <span /><span /><span />
                  </div>
                  <span class="loading-text">{{ loadingText }}</span>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入栏 -->
      <div class="input-area">
        <Ai_Input @loading-Text="handleChatEvent" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { useGameStart } from "@/stores/Game_Start";
import { marked } from "marked";
import { ref, watch, nextTick, onMounted, onActivated } from "vue";

const tobottom = ref(null);
let loadingText = ref("");
const history = useChatHistoryStore();
const GameStart = useGameStart();

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
  eventSource.addEventListener("layer2", (e) => {
    loadingText.value = e.data;
  });
  eventSource.addEventListener("layer3", (e) => {
    loadingText.value = e.data;
  });
  eventSource.addEventListener("layer4", (e) => {
    loadingText.value = e.data;
  });
}

function handleChatEvent() {
  connectSSE();
}

function Game_start() {
  GameStart.select = true;
  GameStart.game_start = false;
}

function select_model() {
  GameStart.ai_input = true;
  GameStart.select = false;
  connectSSE();
}

const scrollToBottom = () => {
  nextTick(() => {
    if (tobottom.value) {
      tobottom.value.scrollTop = tobottom.value.scrollHeight;
    }
  });
};

function toggleThinking(item) {
  if (item.showThinking === undefined) {
    item.showThinking = true;
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
/* ======================== 变量 ======================== */
:root {
  /* 主色调：保留修仙古韵的暗金，但降低饱和度 */
  --xiuxian-primary: #8b6914;
  --xiuxian-secondary: #c9a75e;
  --xiuxian-bg: #f4f5f7;
  --xiuxian-card: #ffffff;
  --xiuxian-text: #1a1a1a;
  --xiuxian-text-secondary: #666666;
  --xiuxian-border: #e5e5e5;
}

/* ======================== 布局 ======================== */
.chat-wrapper {
  height: 100%;
  width: 100%;
  background-color: var(--xiuxian-bg);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* ======================== 初始化/选择界面 ======================== */
.init-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.init-header {
  margin-bottom: 32px;
}

.init-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--xiuxian-primary);
  letter-spacing: 8px;
  margin-bottom: 12px;
  font-family: 'Noto Serif SC', serif;
}

.init-subtitle {
  font-size: 15px;
  color: var(--xiuxian-text-secondary);
  letter-spacing: 2px;
}

.init-card, .select-cards {
  width: 100%;
  max-width: 900px;
}

/* ======================== 聊天主阶段 ======================== */
.chat-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 消息列表容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0 120px; /* 底部留空给输入栏 */
  scroll-behavior: smooth;
}

.messages-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 24px; /* 消息间距 */
}

/* ======================== 消息行 ======================== */
.message-row {
  display: flex;
  gap: 12px;
  max-width: 100%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.is-user {
  flex-direction: row-reverse; /* 用户消息靠右 */
}

/* ======================== 头像 ======================== */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0e6d2 0%, #e6d5b5 100%);
  border: 1px solid #d4c5a9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.avatar-icon {
  font-size: 16px;
  font-weight: 700;
  color: var(--xiuxian-primary);
  font-family: 'Noto Serif SC', serif;
}

/* ======================== 气泡 ======================== */
.bubble {
  max-width: 85%;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.7;
  position: relative;
  word-break: break-word;
}

.bubble-user {
  background-color: #1a6dff;
  color: #ffffff;
  border-radius: 12px 12px 2px 12px;
  box-shadow: 0 2px 8px rgba(26, 109, 255, 0.2);
}

.bubble-ai {
  background-color: var(--xiuxian-card);
  color: var(--xiuxian-text);
  border: 1px solid var(--xiuxian-border);
  border-radius: 12px 12px 12px 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* ======================== 深度思考折叠 ======================== */
.thinking-collapse {
  margin-bottom: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fafafa;
}

.thinking-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.thinking-toggle:hover {
  background-color: #f0f0f0;
}

.toggle-icon {
  width: 16px;
  height: 16px;
  color: #999;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
}

.toggle-icon.expanded {
  transform: rotate(90deg);
}

.toggle-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  flex: 1;
}

.toggle-badge {
  font-size: 11px;
  color: #999;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.thinking-body {
  padding: 14px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  border-top: 1px solid #e8e8e8;
  background-color: #ffffff;
  max-height: 300px;
  overflow-y: auto;
}

/* ======================== Loading ======================== */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f8f8f8;
  border-radius: 6px;
  font-size: 12px;
  color: #888;
}

.dot-spinner {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot-spinner span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ccc;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot-spinner span:nth-child(1) { animation-delay: -0.32s; }
.dot-spinner span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ======================== 输入栏区域 ======================== */
.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px 24px;
  background: linear-gradient(to top, var(--xiuxian-bg) 80%, transparent);
  z-index: 100;
}

/* ======================== Markdown 内容样式 ======================== */
.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3) {
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  font-weight: 600;
  color: var(--xiuxian-text);
}

.message-content :deep(h1) { font-size: 1.3em; }
.message-content :deep(h2) { font-size: 1.15em; }
.message-content :deep(h3) { font-size: 1.05em; }

.message-content :deep(p) {
  margin-bottom: 0.8em;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 0.8em;
}

.message-content :deep(li) {
  margin-bottom: 0.4em;
}

.message-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #e74c3c;
  font-family: 'SFMono-Regular', Consolas, monospace;
}

.message-content :deep(pre) {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
}

.message-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

.message-content :deep(blockquote) {
  border-left: 3px solid var(--xiuxian-secondary);
  padding-left: 1em;
  color: #666;
  margin: 1em 0;
}

/* ======================== 过渡动画 ======================== */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.collapse-enter-active, .collapse-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  overflow: hidden;
}
.collapse-enter-from, .collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
