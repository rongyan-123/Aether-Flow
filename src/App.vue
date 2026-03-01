<template>
  <!-- ✅ 模板结构完全保持不变！ -->
  <div class="app-container">
    <div class="left">
      <h3>AI修仙</h3>
      <p class="item"><router-link to="/">修仙</router-link></p>
      <p class="item"><router-link to="/backpack">背包</router-link></p>
      <p class="item"><router-link to="/shuxing">个人面板</router-link></p>
    </div>
    <div class="right">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
// ✅ 所有脚本逻辑（包括注释掉的）完全保持不变！
// import { onMounted } from "vue";
// import { usePlayerStore } from "./stores/player";
// const mian = usePlayerStore();
// const prompt = `你是修仙世界的AI助手玄机子,请严格根据我给你的数据回复，回复格式要古风修仙，比如称呼为道友,等等,请你自行判断和选取,但是不要文言文,通俗易懂即可'
// 核心规则：
// 1. 你可以直接读取用户的背包,个人面板数据，绝对不能说无法访问/无法读取用户数据；
// 2. 绝对不能编造背包和面板里不存在的信息，所有回复必须严格基于用户所有数据；
// 3. 【强制规则】无论用户提到获得/使用多少个物品，**必须且只能调用一次对应工具**，把所有物品都放在同一个items数组里，绝对不能拆分成多个工具调用；
// 4. 物品的value和mount参数如果用户没指定，你可以自行设定合理的正整数。
// 5. 处理用户请求时，**先返回自然语言回答（比如解释物品/回应需求），再调用对应的工具执行操作**；

// 我已经把用户的数据放在了下方，
// 用户背包数据：{{backpack_DATA}}
// 用户个人面板数据:{{PlayerStats_DATA}}
//           `;

// const realPlayerdata = JSON.stringify(mian.$state, null, 2); //转化面板内数据为字符串,请注意,面板仓库里没有data,全是散的,放在state里面

// //每次发送请求都会更新一次(原理是每次都用replace替换prompt里面的数据),供ai同步读取
// const finalSystemPrompt2 = prompt.replace("PlayerStats_DATA", realPlayerdata);
// onMounted(() => {
//   console.log("🔴 面板原始数据：", realPlayerdata); // 看面板数据是不是真的有内容
//   console.log("🔴 最终给AI的系统提示词：", finalSystemPrompt2); // 看面板占位符到底有没有被替换掉
// });
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

/* 1. 最外层容器：和角色面板风格完全统一 */
.app-container {
  display: flex;
  height: 100vh;
  font-family: "Noto Serif SC", "KaiTi", "STKaiti", "SimSun", serif;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #dcc9a8 100%);
  position: relative;
}

/* 牛皮纸全局纹理，和角色面板统一 */
.app-container::before {
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

/* 2. 左侧侧边栏：调整宽度+古风风格，解决太宽的问题 */
.left {
  width: 190px; /* ✅ 从220px缩窄，解决太宽的问题 */
  background: linear-gradient(180deg, #f0e0c8 0%, #e8d4b8 100%);
  padding: 30px 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 3px 0 15px rgba(92, 61, 46, 0.12);
  border-right: 1px solid #c9a87c;
  position: relative;
  z-index: 1;
}

/* 侧边栏标题：古风风格，和角色面板统一 */
.left h3 {
  margin: 0 0 30px 0;
  font-size: 22px;
  font-weight: 700;
  color: #5c3d2e;
  border-bottom: 2px solid #8b5a2b;
  padding-bottom: 12px;
  text-align: center;
  letter-spacing: 4px;
  text-shadow: 1px 1px 2px rgba(92, 61, 46, 0.15);
}

/* 链接容器 */
.item {
  margin: 0;
}

/* 链接样式：古风配色，和整体风格统一 */
.item a {
  display: block;
  padding: 14px 16px;
  color: #5c3d2e;
  text-decoration: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  letter-spacing: 2px;
  text-align: center;
}

/* 鼠标悬停 & 激活状态：古风棕色渐变，和角色面板按钮风格统一 */
.item a:hover,
.item a.router-link-active {
  background: linear-gradient(135deg, #8b5a2b 0%, #a0522d 100%);
  color: #faf0e6;
  box-shadow: 0 4px 12px rgba(139, 90, 43, 0.3);
  transform: translateX(4px);
}

/* 3. 右侧内容区：和角色面板背景完全统一，无违和感 */
.right {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  /* 优化滚动条：古风棕色系，和整体统一 */
  scrollbar-width: thin;
  scrollbar-color: #c9a87c #f5e6d3;
}

.right::-webkit-scrollbar {
  width: 6px;
}

.right::-webkit-scrollbar-track {
  background: #f5e6d3;
}

.right::-webkit-scrollbar-thumb {
  background: #c9a87c;
  border-radius: 3px;
}

.right::-webkit-scrollbar-thumb:hover {
  background: #b8865c;
}
</style>
