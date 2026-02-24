<template>
  <!-- ✅ 新增：加 .chat-container 外层，让 flex 布局生效 -->
  <div class="chat-container">
    <h1>ai聊天</h1>
    <!-- 聊天消息区域（可滚动）,必须用ref绑定,不能用v-model,否则无法获取DOM元素 -->
    <div class="talk" ref="tobottom">
      <div class="message-item" v-for="item in history.data" :key="item.id">
        <!-- 用户消息：靠右 -->
        <div v-if="item.role === 'user'" class="message user">
          {{ item.content }}
        </div>

        <!-- AI 消息：靠左 -->
        <div v-else-if="item.role === 'assistant'" class="message assistant">
          <!-- 用 v-html 渲染解析后的 HTML -->
          <span v-html="parseMarkdown(item.content)"></span>
        </div>
      </div>
    </div>

    <!-- 输入框区域（固定在底部） -->
    <Ai_Input class="bottom"></Ai_Input>
  </div>
</template>

<script setup>
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { marked } from "marked";
import { ref, watch, nextTick, onMounted, onActivated } from "vue";
const tobottom = ref(null);
const history = useChatHistoryStore(); //历史记录实例
//封装自动滚动函数
const scrollToBottom = () => {
  nextTick(() => {
    //nextTick会等待渲染完成再进行获取
    if (tobottom.value) {
      tobottom.value.scrollTop = tobottom.value.scrollHeight;
    }
  });
};

//对话自动滚动到底部
watch(
  () => history.data,
  () => {
    scrollToBottom();
  },
  { deep: true },
);

//切换回聊天界面自动滚动到底部
onMounted(() => {
  scrollToBottom();
});
onActivated(() => {
  scrollToBottom();
});

// 封装 Markdown 解析函数
const parseMarkdown = (content) => {
  if (!content) return "";
  // ✅ 可选优化：开启 GFM 兼容，解析更全的 Markdown 语法
  return marked.parse(content, { gfm: true });
};
</script>

<style>
/* 全局重置：避免默认样式干扰 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 1. 整体容器：占满全屏，flex 布局（现在模板里有这个容器了！） */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
}

/* 2. 标题样式 */
h1 {
  text-align: center;
  padding: 15px;
  margin: 0;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  font-size: 18px;
}

/* 3. 消息区域：占满剩余空间，可滚动 */
.talk {
  flex: 1;
  padding: 30px 25px; /* ✅ 加大内边距，左右25px，上下30px */
  overflow-y: auto; /* ✅ 明确开启垂直滚动，防止内容溢出 */
}

/* 4. 单条消息容器 */
.message-item {
  margin-bottom: 20px;
  width: 100%;
  overflow: hidden; /* ✅ 新增：清除浮动，防止布局乱 */
}

/* 5. 消息气泡通用样式（✅ 删除重复定义，只保留一个） */
.message {
  display: block;
  padding: 15px 25px; /* ✅ 内边距从10px15px→14px20px，气泡内部更松 */
  border-radius: 12px; /* ✅ 圆角稍大，视觉更柔和 */
  max-width: 88%; /* ✅ 从80%→88%，气泡更宽，文字少换行 */
  font-size: 16px;
  line-height: 2; /* ✅ 行高从1.8→2，文字行间距更大 */
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* ✅ 加轻微阴影，气泡更立体，不挤 */
}

/* 7. 用户消息：靠右，蓝色背景 */
.user {
  float: right; /* 靠右浮动 */
  clear: both; /* 清除浮动，防止并排 */
  background-color: #007aff;
  color: #ffffff;
  border-top-right-radius: 2px; /* 右上角小直角 */
  /* ✅ 删除重复的 margin-bottom（由 message-item 控制） */
}

/* 8. AI 消息：靠左，白色背景 */
.assistant {
  float: left; /* 靠左浮动 */
  clear: both; /* 清除浮动 */
  background-color: #ffffff;
  color: #333333;
  border-top-left-radius: 2px; /* 左上角小直角 */
  /* ✅ 删除重复的 margin-bottom */
}

/* ✅ 新增：Markdown 解析后的基础样式（核心！让标题/加粗/列表显示） */
.assistant h1 {
  font-size: 20px;
  color: #333;
  margin: 0 0 10px 0;
  padding: 0;
  border: none;
  text-align: left;
  background: none;
}
.assistant h2 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
  padding: 0;
  font-weight: 600;
}
.assistant strong {
  font-weight: 700;
  color: #007aff; /* 加粗文字变主题色，更明显 */
}
.assistant ul {
  padding-left: 20px;
  margin: 5px 0;
}
.assistant li {
  margin: 3px 0;
}

/* 9. 输入框区域样式（✅ 全改，修复布局） */
.bottom {
  display: flex;
  flex-direction: row; /* ✅ 改：输入框+按钮横向排列 */
  align-items: center; /* ✅ 新增：垂直居中 */
  gap: 10px; /* ✅ 新增：输入框和按钮间距 */
  /* ✅ 删除 flex:1，输入框不占剩余空间 */
  background-color: #fff; /* ✅ 改：白色背景，和标题统一 */
  padding: 12px 20px; /* ✅ 改：更紧凑的内边距 */
  border-top: 1px solid #eee; /* ✅ 新增：分隔消息区和输入框 */
  text-align: left; /* ✅ 改：清除无用的居中 */
}
</style>
