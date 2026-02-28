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
      <h2 class="card-title">功法</h2>
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
        <div class="list-label">修炼功法</div>
        <ul>
          <li
            v-for="(tech, index) in PlayerStore.cultivation_technique"
            :key="index"
          >
            {{ tech.name }} <span class="grade-tag">{{ tech.grade }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 5. 技艺 -->
    <div class="info-card">
      <h2 class="card-title">技艺</h2>
      <div class="technique-group">
        <div class="group-label">战斗技艺</div>
        <ul>
          <li
            v-for="(tech, index) in PlayerStore.combat_technique"
            :key="index"
          >
            {{ tech.name }} <span class="grade-tag">{{ tech.grade }}</span>
          </li>
        </ul>
      </div>
      <div class="technique-group">
        <div class="group-label">身法技艺</div>
        <ul>
          <li
            v-for="(tech, index) in PlayerStore.movement_technique"
            :key="index"
          >
            {{ tech.name }} <span class="grade-tag">{{ tech.grade }}</span>
          </li>
        </ul>
      </div>
      <div class="technique-group">
        <div class="group-label">其他技艺</div>
        <ul>
          <li v-for="(tech, index) in PlayerStore.other_technique" :key="index">
            {{ tech.name }} <span class="grade-tag">{{ tech.grade }}</span>
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
/* 整体容器 */
.player-panel-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  min-height: 100vh;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

/* 标题 */
.panel-title {
  text-align: center;
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 30px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
}

/* 卡片样式 */
.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8e8e8;
}

.card-title {
  color: #34495e;
  font-size: 18px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
  display: inline-block;
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #7f8c8d;
  font-size: 15px;
}

.value {
  color: #2c3e50;
  font-size: 15px;
  font-weight: 500;
}

.highlight {
  color: #e67e22;
  font-weight: 600;
}

/* 进度条 */
.progress-wrapper {
  flex: 1;
  margin-left: 20px;
  height: 24px;
  background: #ecf0f1;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.progress-wrapper.small {
  height: 20px;
  margin-left: 0;
  margin-top: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  border-radius: 12px;
  transition: width 0.5s ease;
}

.progress-bar.blue {
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}
.progress-bar.gold {
  background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
}
.progress-bar.purple {
  background: linear-gradient(90deg, #9b59b6 0%, #8e44ad 100%);
}
.progress-bar.green {
  background: linear-gradient(90deg, #2ecc71 0%, #27ae60 100%);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
}

/* 属性网格 */
.attr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.attr-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.attr-label {
  color: #34495e;
  font-size: 14px;
  font-weight: 500;
}

/* 功法技艺 */
.core-technique {
  background: #fff8e1;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid #f39c12;
}

.core-label {
  color: #7f8c8d;
  font-size: 13px;
  margin-bottom: 5px;
}

.core-value {
  font-size: 16px;
}

.technique-list,
.technique-group {
  margin-top: 15px;
}

.list-label,
.group-label {
  color: #34495e;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 6px;
  color: #2c3e50;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 品阶标签 */
.grade-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e8f4f8;
  color: #2980b9;
  font-weight: 500;
}
</style>
