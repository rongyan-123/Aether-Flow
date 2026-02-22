<template>
  <div class="app-container">
    <div class="left">
      <h3>AI修仙</h3>
      <p class="item"><router-link to="/">修仙</router-link></p>

      <p class="item"><router-link to="/backpack">背包</router-link></p>

      <p class="item"><router-link to="/shuxing">属性</router-link></p>
    </div>

    <div class="right">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
};
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
