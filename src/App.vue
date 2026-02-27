<template>
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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 2. 最外层容器：使用 Flex 布局，占满整个视口高度 */
.app-container {
  display: flex;
  height: 100vh;
}

/* 3. 左侧侧边栏：固定宽度，深色背景，内边距 */
.left {
  width: 220px; /* 侧边栏宽度，你可以自己调 */
  background-color: #eaeaea;
  color: rgb(0, 0, 0);
  padding: 20px; /* 内边距 */
  display: flex;
  flex-direction: column; /* 让里面的链接竖着排 */
  gap: 15px; /* 链接之间的间距 */
}

/* 侧边栏标题样式 */
.left h3 {
  margin-bottom: 20px;
  font-size: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}
.item {
  margin: 0;
  margin-bottom: 10px; /* 链接之间的间距 */
}
.item a {
  display: block; /* 让它占满整行，宽度 100% */
  padding: 10px 15px; /* 增加内边距，让点击区域变大 */
  color: #131111;
  text-decoration: none;
  border-radius: 6px;
}
/* 鼠标悬停在链接上的样式 */
.item a:hover,
/* 链接被激活（当前页面）时的样式 */
.item a.router-link-active {
  width: 300px;
  background-color: #42b883; /* Vue 绿，或者你喜欢的颜色 */
  color: white;
}

/* 4. 右侧内容区：占满剩下的所有空间，内边距，内容多了可以滚动 */
.right {
  flex: 1; /* 核心：占满 flex 容器剩下的所有空间 */
  padding: 30px; /* 内容区的内边距 */
  background-color: #f5f5f5; /* 浅灰色背景，和侧边栏区分开 */
  overflow-y: auto; /* 如果内容太多，右边可以单独滚动 */
}
</style>
