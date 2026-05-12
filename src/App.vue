<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo-icon">仙</span>
        <h1 class="logo-text">修仙</h1>
      </div>
      <nav class="nav-list">
        <p class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">
            <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>对话</span>
          </router-link>
        </p>
        <p class="nav-item">
          <router-link to="/backpack" class="nav-link" active-class="active">
            <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>背包</span>
          </router-link>
        </p>
        <p class="nav-item">
          <router-link to="/shuxing" class="nav-link" active-class="active">
            <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>属性</span>
          </router-link>
        </p>
      </nav>
    </aside>

    <!-- 主内容 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
/* 全局字体 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');

/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Serif SC', serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f4f5f7;
  color: #1a1a1a;
}

/* 隐藏默认滚动条但在需要时可以滚动 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.12);
  border-radius: 2px;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* ======================== 侧边栏 ======================== */
.sidebar {
  width: 200px;
  min-width: 200px;
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  padding: 24px 12px;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #c9a75e 0%, #8b6914 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Noto Serif SC', serif;
  box-shadow: 0 2px 6px rgba(139, 105, 20, 0.2);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 4px;
}

/* 导航列表 */
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background-color: #f5f5f5;
  color: #1a1a1a;
}

.nav-link.active {
  background-color: #f0f0f0;
  color: #1a1a1a;
  font-weight: 600;
}

.nav-svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ======================== 主内容 ======================== */
.main-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
