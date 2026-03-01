<template>
  <div class="player-panel-container">
    <h1 class="panel-title">角色面板</h1>

    <!-- 1. 基本信息 -->
    <div class="info-card">
      <h2 class="card-title">基本信息</h2>
      <div class="info-row">
        <span class="label">姓名</span>
        <span class="value">{{ PlayerStore.name }}</span>
      </div>
      <div class="info-row">
        <span class="label">年龄</span>
        <span class="value">{{ PlayerStore.age }}岁</span>
      </div>
      <div class="info-row">
        <span class="label">境界</span>
        <span class="value highlight">{{ PlayerStore.level }}</span>
      </div>
      <div class="info-row">
        <span class="label">修为进度</span>
        <div class="progress-wrapper">
          <div
            class="progress-bar"
            :style="{
              width: getProgressWidth(PlayerStore.numerical_cultivation),
            }"
          ></div>
          <span class="progress-text">{{
            PlayerStore.numerical_cultivation
          }}</span>
        </div>
      </div>
    </div>

    <!-- 2. 灵根信息 -->
    <div class="info-card">
      <h2 class="card-title">灵根信息</h2>
      <div class="info-row">
        <span class="label">灵根类型</span>
        <span class="value">{{
          PlayerStore.spiritual_root_type.split("_").join("、")
        }}</span>
      </div>
      <div class="info-row">
        <span class="label">灵根等级</span>
        <span class="value">{{ PlayerStore.spiritual_root_grade }}</span>
      </div>
    </div>

    <!-- 3. 核心属性 -->
    <div class="info-card">
      <h2 class="card-title">核心属性</h2>
      <div class="attr-grid">
        <div class="attr-item">
          <div class="attr-label">灵力</div>
          <div class="progress-wrapper small">
            <div
              class="progress-bar blue"
              :style="{ width: getProgressWidth(PlayerStore.spiritual_power) }"
            ></div>
            <span class="progress-text">{{ PlayerStore.spiritual_power }}</span>
          </div>
        </div>
        <div class="attr-item">
          <div class="attr-label">根骨</div>
          <div class="progress-wrapper small">
            <div
              class="progress-bar gold"
              :style="{ width: getProgressWidth(PlayerStore.potential) }"
            ></div>
            <span class="progress-text">{{ PlayerStore.potential }}</span>
          </div>
        </div>
        <div class="attr-item">
          <div class="attr-label">气运</div>
          <div class="progress-wrapper small">
            <div
              class="progress-bar purple"
              :style="{ width: getProgressWidth(PlayerStore.fortune) }"
            ></div>
            <span class="progress-text">{{ PlayerStore.fortune }}</span>
          </div>
        </div>
        <div class="attr-item">
          <div class="attr-label">悟性</div>
          <div class="progress-wrapper small">
            <div
              class="progress-bar green"
              :style="{ width: getProgressWidth(PlayerStore.comprehension) }"
            ></div>
            <span class="progress-text">{{ PlayerStore.comprehension }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 功法 -->
    <div class="info-card">
      <h2 class="card-title">核心功法</h2>
      <div class="core-technique">
        <div class="core-label">核心修炼法门</div>
        <div class="core-value highlight">
          {{ PlayerStore.core_cultivation_method.name }}
          <span class="grade-tag">{{
            PlayerStore.core_cultivation_method.grade
          }}</span>
        </div>
      </div>
      <div class="technique-list">
        <div class="list-label">可选修炼功法</div>
        <ul>
          <li
            v-for="(tech, index) in PlayerStore.cultivation_technique"
            :key="index"
          >
            <!-- ✅ 调整：名字和标签放在一个容器里，紧挨在一起 -->
            <div class="tech-info">
              <span class="tech-name">{{ tech.name }}</span>
              <span class="grade-tag">{{ tech.grade }}</span>
            </div>
            <!-- ✅ 按钮单独放最右边 -->
            <button
              class="ancient-btn"
              @click="PlayerStore.change_coreTechnique(tech)"
            >
              设为核心
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 5. 技艺 -->
    <div class="info-card">
      <h2 class="card-title">技艺</h2>
      <div class="technique-group">
        <div class="group-label">战技</div>
        <ul>
          <li
            v-for="(tech, index) in PlayerStore.combat_technique"
            :key="index"
          >
            <div class="tech-info">
              <span class="tech-name">{{ tech.name }}</span>
              <span class="grade-tag">{{ tech.grade }}</span>
            </div>
          </li>
        </ul>
      </div>
      <div class="technique-group">
        <div class="group-label">身法</div>
        <ul>
          <li
            v-for="(tech, index) in PlayerStore.movement_technique"
            :key="index"
          >
            <div class="tech-info">
              <span class="tech-name">{{ tech.name }}</span>
              <span class="grade-tag">{{ tech.grade }}</span>
            </div>
          </li>
        </ul>
      </div>
      <div class="technique-group">
        <div class="group-label">其他法门</div>
        <ul>
          <li v-for="(tech, index) in PlayerStore.other_technique" :key="index">
            <div class="tech-info">
              <span class="tech-name">{{ tech.name }}</span>
              <span class="grade-tag">{{ tech.grade }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePlayerStore } from "@/stores/player";
const PlayerStore = usePlayerStore();

// 辅助函数：计算进度条宽度
const getProgressWidth = (progressStr) => {
  if (!progressStr) return "0%";
  const [current, max] = progressStr.split("/").map(Number);
  if (!max) return "100%";
  return `${(current / max) * 100}%`;
};
</script>

<style scoped>
/* 全局字体：古风楷体/宋体 */
@import url("https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap");

/* 整体容器：泛黄牛皮纸背景 */
.player-panel-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #dcc9a8 100%);
  min-height: 100vh;
  font-family: "Noto Serif SC", "KaiTi", "STKaiti", "SimSun", serif;
  position: relative;
}

/* 牛皮纸纹理效果 */
.player-panel-container::before {
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

/* 标题：古风书法风格 */
.panel-title {
  text-align: center;
  color: #5c3d2e;
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(92, 61, 46, 0.15);
  letter-spacing: 8px;
  position: relative;
  z-index: 1;
}

/* 卡片样式：古朴卷轴/书页效果 */
.info-card {
  background: linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%);
  border-radius: 8px;
  padding: 25px 30px;
  margin-bottom: 25px;
  box-shadow: 0 4px 12px rgba(92, 61, 46, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 1px solid #c9a87c;
  position: relative;
  z-index: 1;
}

/* 卡片标题：带古朴下划线 */
.card-title {
  color: #5c3d2e;
  font-size: 20px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #8b5a2b;
  display: inline-block;
  font-weight: 600;
  letter-spacing: 3px;
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #c9a87c;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #7a5230;
  font-size: 16px;
  font-weight: 500;
}

.value {
  color: #5c3d2e;
  font-size: 16px;
  font-weight: 500;
}

.highlight {
  color: #8b4513;
  font-weight: 700;
  font-size: 17px;
}

/* 进度条：古朴风格 */
.progress-wrapper {
  flex: 1;
  margin-left: 20px;
  height: 26px;
  background: #e8d4b8;
  border-radius: 13px;
  position: relative;
  overflow: hidden;
  border: 1px solid #c9a87c;
}

.progress-wrapper.small {
  height: 22px;
  margin-left: 0;
  margin-top: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5a2b 0%, #a0522d 100%);
  border-radius: 13px;
  transition: width 0.5s ease;
}

.progress-bar.blue {
  background: linear-gradient(90deg, #4a6fa5 0%, #5b7fb8 100%);
}
.progress-bar.gold {
  background: linear-gradient(90deg, #b8860b 0%, #daa520 100%);
}
.progress-bar.purple {
  background: linear-gradient(90deg, #6b486b 0%, #8b5a8b 100%);
}
.progress-bar.green {
  background: linear-gradient(90deg, #2e8b57 0%, #3cb371 100%);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #f1f1f1;
  font-size: 13px;
  font-weight: 600;
}

/* 属性网格 */
.attr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px;
}

.attr-item {
  background: #f5e6d3;
  padding: 18px;
  border-radius: 8px;
  border: 1px solid #c9a87c;
}

.attr-label {
  color: #7a5230;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
}

/* 功法技艺 */
.core-technique {
  background: linear-gradient(90deg, #fff8dc 0%, #faf0e6 100%);
  padding: 18px;
  border-radius: 8px;
  margin-bottom: 18px;
  border-left: 4px solid #8b5a2b;
}

.core-label {
  color: #7a5230;
  font-size: 14px;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.core-value {
  font-size: 17px;
}

.technique-list,
.technique-group {
  margin-top: 18px;
}

.list-label,
.group-label {
  color: #7a5230;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
  letter-spacing: 2px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 12px 16px;
  background: #f5e6d3;
  border-radius: 6px;
  margin-bottom: 10px;
  color: #5c3d2e;
  font-size: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #c9a87c;
}

/* ✅ 新增：名字和标签容器，紧挨在一起 */
.tech-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tech-name {
  font-weight: 500;
}

/* 品阶标签：古朴印章风格 */
.grade-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 100%);
  color: #8b4513;
  font-weight: 600;
  border: 1px solid #c9a87c;
  letter-spacing: 1px;
}

/* ✅ 新增：古风按钮样式，显眼靠右 */
.ancient-btn {
  padding: 8px 18px;
  background: linear-gradient(135deg, #8b5a2b 0%, #a0522d 100%);
  color: #faf0e6;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Noto Serif SC", "KaiTi", serif;
  letter-spacing: 2px;
  box-shadow: 0 3px 8px rgba(139, 90, 43, 0.3);
}

.ancient-btn:hover {
  background: linear-gradient(135deg, #a0522d 0%, #cd853f 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(139, 90, 43, 0.4);
}

.ancient-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(139, 90, 43, 0.3);
}
</style>
