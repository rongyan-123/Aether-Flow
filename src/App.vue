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
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 1. 最外层容器：和之前风格统一的柔和背景 */
.app-container {
  display: flex;
  height: 100vh;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

/* 2. 左侧侧边栏：优化配色、阴影、过渡动画 */
.left {
  width: 220px;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  color: #2c3e50;
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
  border-right: 1px solid #e8e8e8;
}

/* 侧边栏标题：优化样式 */
.left h3 {
  margin: 0 0 25px 0;
  font-size: 21px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #667eea;
  padding-bottom: 12px;
  text-align: center;
}

/* 链接容器 */
.item {
  margin: 0;
}

/* 链接样式：更柔和，加过渡动画 */
.item a {
  display: block;
  padding: 12px 18px;
  color: #34495e;
  text-decoration: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* 鼠标悬停 & 激活状态：和之前统一的渐变紫色 */
.item a:hover,
.item a.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateX(3px);
}

/* 3. 右侧内容区：和之前风格统一的背景，去掉多余内边距（让子页面自己控制） */
.right {
  flex: 1;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  overflow-y: auto;
  /* 优化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.right::-webkit-scrollbar {
  width: 6px;
}

.right::-webkit-scrollbar-track {
  background: #f7fafc;
}

.right::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.right::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
