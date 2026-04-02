<template>
  <div class="player-panel">
    <div class="panel-inner">
      <!-- 头部：名号与基本标识 -->
      <div class="panel-header">
        <h1 class="player-name">{{ playerData.name || "无名修士" }}</h1>
        <div class="player-tags">
          <span class="tag realm">{{ playerData.level || "炼气期" }}</span>
          <span class="tag root">{{ rootTypeDisplay }}</span>
          <span class="tag age"
            >{{ playerData.age || 0 }}岁 / 寿元
            {{ playerData.max_age || "??" }}</span
          >
        </div>
      </div>

      <!-- 两栏布局 -->
      <div class="panel-body">
        <!-- 左栏：核心数值与基本信息 -->
        <div class="left-col">
          <!-- 修为进度 -->
          <div class="stat-block">
            <div class="stat-header">
              <span>修为</span>
              <span>{{ playerData.numerical_cultivation || "0/200" }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: progressWidth(playerData.numerical_cultivation),
                }"
              ></div>
            </div>
          </div>

          <!-- 四维属性 -->
          <div class="attrs-grid">
            <div class="attr-item">
              <span class="attr-label">灵力</span>
              <div class="mini-progress">
                <div
                  class="fill blue"
                  :style="{ width: progressWidth(playerData.spiritual_power) }"
                ></div>
              </div>
              <span class="attr-value">{{
                playerData.spiritual_power || "0/100"
              }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">根骨</span>
              <div class="mini-progress">
                <div
                  class="fill gold"
                  :style="{ width: progressWidth(playerData.potential) }"
                ></div>
              </div>
              <span class="attr-value">{{
                playerData.potential || "0/20"
              }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">气运</span>
              <div class="mini-progress">
                <div
                  class="fill purple"
                  :style="{ width: progressWidth(playerData.fortune) }"
                ></div>
              </div>
              <span class="attr-value">{{ playerData.fortune || "0/20" }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">悟性</span>
              <div class="mini-progress">
                <div
                  class="fill green"
                  :style="{ width: progressWidth(playerData.comprehension) }"
                ></div>
              </div>
              <span class="attr-value">{{
                playerData.comprehension || "0/20"
              }}</span>
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="info-card">
            <div class="info-row">
              <span>性别</span><span>{{ playerData.gender || "未知" }}</span>
            </div>
            <div class="info-row">
              <span>背景</span><span>{{ playerData.background || "无" }}</span>
            </div>
            <div class="info-row">
              <span>灵根</span
              ><span
                >{{ rootTypeDisplay }}（{{
                  playerData.spiritual_root_grade || "无"
                }}）</span
              >
            </div>
            <div class="info-row">
              <span>天赋</span><span>{{ talentDisplay }}</span>
            </div>
          </div>
        </div>

        <!-- 右栏：功法与技艺 -->
        <div class="right-col">
          <!-- 功法 -->
          <div class="technique-section">
            <h3>功法</h3>
            <ul class="technique-list">
              <li
                v-for="(tech, idx) in playerData.cultivation_technique"
                :key="idx"
                class="technique-item"
              >
                <div class="technique-header">
                  <span class="tech-name">{{ tech.name || "无名功法" }}</span>
                  <span class="grade-badge">{{ tech.grade || "无品" }}</span>
                </div>
                <div class="technique-effect" v-if="tech.effect">
                  {{ tech.effect }}
                </div>
                <div class="technique-effect empty-effect" v-else>
                  暂无功效描述
                </div>
              </li>
              <li
                v-if="!playerData.cultivation_technique?.length"
                class="empty"
              >
                未修炼任何功法
              </li>
            </ul>
          </div>

          <!-- 战技 -->
          <div class="technique-section">
            <h3>战技</h3>
            <ul class="technique-list">
              <li
                v-for="(tech, idx) in playerData.combat_technique"
                :key="idx"
                class="technique-item"
              >
                <div class="technique-header">
                  <span class="tech-name">{{ tech.name }}</span>
                  <div class="badge-group">
                    <span class="grade-badge">{{ tech.grade }}</span>
                    <span class="level-badge">{{ tech.level }}</span>
                  </div>
                </div>
                <div class="technique-effect" v-if="tech.effect">
                  {{ tech.effect }}
                </div>
                <div class="technique-effect empty-effect" v-else>
                  暂无功效描述
                </div>
              </li>
              <li v-if="!playerData.combat_technique?.length" class="empty">
                无
              </li>
            </ul>
          </div>

          <!-- 身法 -->
          <div class="technique-section">
            <h3>身法</h3>
            <ul class="technique-list">
              <li
                v-for="(tech, idx) in playerData.movement_technique"
                :key="idx"
                class="technique-item"
              >
                <div class="technique-header">
                  <span class="tech-name">{{ tech.name }}</span>
                  <div class="badge-group">
                    <span class="grade-badge">{{ tech.grade }}</span>
                    <span class="level-badge">{{ tech.level }}</span>
                  </div>
                </div>
                <div class="technique-effect" v-if="tech.effect">
                  {{ tech.effect }}
                </div>
                <div class="technique-effect empty-effect" v-else>
                  暂无功效描述
                </div>
              </li>
              <li v-if="!playerData.movement_technique?.length" class="empty">
                无
              </li>
            </ul>
          </div>

          <!-- 其他法门 -->
          <div class="technique-section">
            <h3>法门</h3>
            <ul class="technique-list">
              <li
                v-for="(tech, idx) in playerData.other_technique"
                :key="idx"
                class="technique-item"
              >
                <div class="technique-header">
                  <span class="tech-name">{{ tech.name }}</span>
                  <div class="badge-group">
                    <span class="grade-badge">{{ tech.grade }}</span>
                    <span class="type-badge">{{ tech.type }}</span>
                  </div>
                </div>
                <div class="technique-effect" v-if="tech.effect">
                  {{ tech.effect }}
                </div>
                <div class="technique-effect empty-effect" v-else>
                  暂无功效描述
                </div>
              </li>
              <li v-if="!playerData.other_technique?.length" class="empty">
                无
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { usePlayerStore } from "@/stores/player";
const playerStore = usePlayerStore();
const playerData = computed(() => playerStore.$state);

// 灵根类型展示（将下划线转为顿号）
const rootTypeDisplay = computed(() => {
  const root = playerData.value.spiritual_root_type;
  if (!root) return "未知";
  return root.split("_").join("、");
});

// 天赋列表展示
const talentDisplay = computed(() => {
  const talents = playerData.value.talent;
  if (!talents || talents.length === 0) return "无";
  return talents.join("、");
});

// 进度条宽度计算（支持 "当前/最大" 格式或直接数字比例）
const progressWidth = (value) => {
  if (!value) return "0%";
  if (typeof value === "string" && value.includes("/")) {
    const [cur, max] = value.split("/").map(Number);
    if (!max) return "0%";
    return `${(cur / max) * 100}%`;
  }
  return "0%";
};
</script>

<style scoped>
/* 古风羊皮纸风格 */
@import url("https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap");

.player-panel {
  min-height: 100vh;
  background: #e8d5b5;
  padding: 30px 20px;
  font-family: "Noto Serif SC", "KaiTi", "Georgia", serif;
  position: relative;
}

/* 牛皮纸纹理叠加 */
.player-panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.1;
  pointer-events: none;
}

.panel-inner {
  max-width: 1300px;
  margin: 0 auto;
  background: #fef7e6;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 245, 0.8);
  border: 1px solid #c8aa6e;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(0px);
}

/* 头部 */
.panel-header {
  background: linear-gradient(135deg, #d6b575 0%, #c49a6c 100%);
  padding: 24px 28px;
  border-bottom: 1px solid #a77c4a;
  box-shadow: inset 0 1px 0 #f0dfb0;
}
.player-name {
  font-size: 32px;
  font-weight: 700;
  color: #2d2418;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 0 rgba(255, 245, 200, 0.6);
  letter-spacing: 4px;
}
.player-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.tag {
  background: #2d2418;
  color: #f0dfb0;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 500;
}
.tag.realm {
  background: #8b5a2b;
  color: #fae67a;
}
.tag.root {
  background: #4a6f4a;
  color: #d4e6c3;
}
.tag.age {
  background: #5d4a2e;
  color: #e6d5b3;
}

/* 两栏布局 */
.panel-body {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  padding: 28px;
}
.left-col {
  flex: 1.2;
  min-width: 260px;
}
.right-col {
  flex: 1;
  min-width: 280px;
}

/* 修为进度条 */
.stat-block {
  background: #fef3e0;
  border: 1px solid #d4b87a;
  border-radius: 16px;
  padding: 14px 18px;
  margin-bottom: 20px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.05);
}
.stat-header {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  color: #5a3e2b;
  margin-bottom: 8px;
}
.progress-bar {
  height: 12px;
  background: #e2cfaa;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #c8a76e;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #c08b4b, #e6b05e);
  border-radius: 12px;
  transition: width 0.3s;
}

/* 四维属性网格 */
.attrs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.attr-item {
  background: #fef3e0;
  border: 1px solid #d4b87a;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.attr-label {
  font-size: 13px;
  font-weight: 600;
  color: #8b6946;
  width: 44px;
}
.mini-progress {
  flex: 1;
  height: 6px;
  background: #e2cfaa;
  border-radius: 6px;
  overflow: hidden;
}
.mini-progress .fill {
  height: 100%;
  border-radius: 6px;
}
.fill.blue {
  background: #6c8fb3;
}
.fill.gold {
  background: #dbb42c;
}
.fill.purple {
  background: #9b6b9b;
}
.fill.green {
  background: #6f9e6f;
}
.attr-value {
  font-size: 12px;
  color: #5a3e2b;
  font-weight: 500;
  min-width: 48px;
  text-align: right;
}

/* 基本信息卡片 */
.info-card {
  background: #fef3e0;
  border: 1px solid #d4b87a;
  border-radius: 16px;
  padding: 16px 18px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #e2cfaa;
}
.info-row:last-child {
  border-bottom: none;
}
.info-row span:first-child {
  font-weight: 600;
  color: #8b6946;
}
.info-row span:last-child {
  color: #2d2418;
  text-align: right;
  max-width: 70%;
}

/* 功法技艺部分 */
.technique-section {
  background: #fef3e0;
  border: 1px solid #d4b87a;
  border-radius: 16px;
  padding: 14px 18px;
  margin-bottom: 20px;
}
.technique-section h3 {
  font-size: 18px;
  font-weight: 700;
  color: #8b5a2b;
  margin: 0 0 12px 0;
  border-left: 4px solid #c8a76e;
  padding-left: 12px;
}
.technique-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.technique-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e6d5b3;
  font-size: 14px;
}
.technique-list li:last-child {
  border-bottom: none;
}
.tech-name {
  font-weight: 500;
  color: #3e2a1f;
  flex: 1;
}
.grade-badge,
.level-badge,
.type-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: #e8d5b5;
  color: #5a3e2b;
  margin-left: 8px;
  white-space: nowrap;
}
.level-badge {
  background: #cbbd9a;
  color: #2d2418;
}
.type-badge {
  background: #b8a77d;
  color: #1f1a12;
}
.empty {
  color: #aa9b7a;
  font-style: italic;
  justify-content: center;
}
.technique-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #e6d5b3;
}

.technique-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 6px;
}

.technique-effect {
  font-size: 12px;
  color: #7a5c3a;
  line-height: 1.4;
  font-style: italic;
  padding-left: 8px;
  border-left: 2px solid #c9a87c;
  margin-top: 4px;
}

.empty-effect {
  color: #aa9b7a;
  font-style: normal;
}
.badge-group {
  display: flex;
  gap: 8px;
}
</style>
