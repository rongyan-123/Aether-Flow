<template>
  <div class="player-panel-container">
    <!-- 左栏：核心信息 -->
    <div class="left-column">
      <!-- 1. 角色头显区 -->
      <div class="header-card">
        <div class="avatar-placeholder"></div>
        <div class="header-info">
          <h1 class="player-name">{{ PlayerStore?.name || "未知" }}</h1>
          <div class="player-tags">
            <span class="tag realm">{{ PlayerStore?.level || "炼气期" }}</span>
            <span class="tag root">{{
              (PlayerStore?.spiritual_root_type || "").split("_").join("、") ||
              "未觉醒"
            }}</span>
            <span class="tag age"
              >{{ PlayerStore?.age || 0 }}岁 / 寿元
              {{ PlayerStore?.max_age || 0 }}</span
            >
          </div>
        </div>
      </div>

      <!-- 2. 核心进度条 -->
      <div class="progress-section">
        <div class="progress-item">
          <div class="progress-header">
            <span class="label">修为</span>
            <span class="value">{{
              PlayerStore?.numerical_cultivation || "0/100"
            }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="fill"
              :style="{
                width: getProgressWidth(PlayerStore?.numerical_cultivation),
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 3. 核心属性网格 -->
      <div class="attr-grid-card">
        <h3 class="card-title">核心属性</h3>
        <div class="attr-grid">
          <div class="attr-item">
            <span class="attr-label">灵力</span>
            <div class="mini-progress">
              <div
                class="fill blue"
                :style="{
                  width: getProgressWidth(PlayerStore?.spiritual_power),
                }"
              ></div>
            </div>
            <span class="attr-value">{{
              PlayerStore?.spiritual_power || "0/100"
            }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">根骨</span>
            <div class="mini-progress">
              <div
                class="fill gold"
                :style="{ width: getProgressWidth(PlayerStore?.potential) }"
              ></div>
            </div>
            <span class="attr-value">{{
              PlayerStore?.potential || "0/100"
            }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">气运</span>
            <div class="mini-progress">
              <div
                class="fill purple"
                :style="{ width: getProgressWidth(PlayerStore?.fortune) }"
              ></div>
            </div>
            <span class="attr-value">{{
              PlayerStore?.fortune || "0/100"
            }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">悟性</span>
            <div class="mini-progress">
              <div
                class="fill green"
                :style="{ width: getProgressWidth(PlayerStore?.comprehension) }"
              ></div>
            </div>
            <span class="attr-value">{{
              PlayerStore?.comprehension || "0/100"
            }}</span>
          </div>
        </div>
      </div>

      <!-- 4. 基本信息 -->
      <div class="basic-info-card">
        <div class="info-row">
          <span class="label">性别</span>
          <span class="value">{{ PlayerStore?.gender || "未知" }}</span>
        </div>
        <div class="info-row">
          <span class="label">背景</span>
          <span class="value">{{ PlayerStore?.background || "暂无" }}</span>
        </div>
        <div class="info-row">
          <span class="label">灵根等级</span>
          <span class="value highlight">{{
            PlayerStore?.spiritual_root_grade || "凡级"
          }}</span>
        </div>
        <div class="info-row">
          <span class="label">天赋</span>
          <span class="value">{{
            (PlayerStore?.talent || []).length
              ? (PlayerStore?.talent || []).join("、")
              : "无"
          }}</span>
        </div>
      </div>
    </div>

    <!-- 右栏：功法技艺 -->
    <div class="right-column">
      <!-- 5. 核心功法 -->
      <div class="technique-card">
        <h3 class="card-title">核心功法</h3>
        <div class="core-technique">
          <div class="core-name">
            {{ PlayerStore?.core_cultivation_method?.name || "未修炼" }}
            <span
              v-if="PlayerStore?.core_cultivation_method?.grade"
              class="grade-tag"
              >{{ PlayerStore.core_cultivation_method.grade }}</span
            >
          </div>
        </div>
        <div class="technique-list">
          <div class="list-header">可选修炼</div>
          <ul>
            <li
              v-for="(tech, index) in PlayerStore?.cultivation_technique || []"
              :key="index"
            >
              <div class="tech-info">
                <span class="tech-name">{{ tech?.name || "未知" }}</span>
                <span v-if="tech?.grade" class="grade-tag">{{
                  tech.grade
                }}</span>
              </div>
              <button
                class="action-btn"
                @click="
                  PlayerStore?.change_coreTechnique &&
                    PlayerStore.change_coreTechnique(tech)
                "
              >
                设为核心
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 6. 技艺 -->
      <div class="technique-card">
        <h3 class="card-title">技艺</h3>
        <div class="skill-groups">
          <div class="skill-group">
            <div class="group-label">战技</div>
            <ul>
              <li
                v-for="(tech, index) in PlayerStore?.combat_technique || []"
                :key="index"
              >
                <span class="tech-name">{{ tech?.name || "未知" }}</span>
                <span v-if="tech?.grade" class="grade-tag">{{
                  tech.grade
                }}</span>
                <span v-if="tech?.level" class="level-tag">{{
                  tech.level
                }}</span>
              </li>
            </ul>
          </div>
          <div class="skill-group">
            <div class="group-label">身法</div>
            <ul>
              <li
                v-for="(tech, index) in PlayerStore?.movement_technique || []"
                :key="index"
              >
                <span class="tech-name">{{ tech?.name || "未知" }}</span>
                <span v-if="tech?.grade" class="grade-tag">{{
                  tech.grade
                }}</span>
                <span v-if="tech?.level" class="level-tag">{{
                  tech.level
                }}</span>
              </li>
            </ul>
          </div>
          <div class="skill-group">
            <div class="group-label">其他法门</div>
            <ul>
              <li v-if="!(PlayerStore?.other_technique || []).length">
                <span class="empty-text">无</span>
              </li>
              <li
                v-for="(tech, index) in PlayerStore?.other_technique || []"
                :key="index"
              >
                <span class="tech-name">{{ tech?.name || "未知" }}</span>
                <span v-if="tech?.grade" class="grade-tag">{{
                  tech.grade
                }}</span>
                <span v-if="tech?.level" class="level-tag">{{
                  tech.level
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePlayerStore } from "@/stores/player";
const PlayerStore = usePlayerStore();

const getProgressWidth = (progressStr) => {
  if (!progressStr) return "0%";
  const [current, max] = progressStr.split("/").map(Number);
  if (!max) return "100%";
  return `${(current / max) * 100}%`;
};
</script>

<style scoped>
/* 端游核心字体：清晰无衬线 */
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap");

/* 整体容器：横版深色魔幻背景 */
.player-panel-container {
  display: flex;
  gap: 20px;
  min-width: 1200px;
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  font-family: "Roboto", "Microsoft YaHei", "PingFang SC", sans-serif;
  color: #e0e0e0;
  box-sizing: border-box;
}

/* 分栏基础 */
.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.left-column {
  flex: 1.2;
}
.right-column {
  flex: 1;
}

/* 通用卡片：深色半透明+边框 */
.header-card,
.progress-section,
.attr-grid-card,
.basic-info-card,
.technique-card {
  background: rgba(26, 26, 46, 0.85);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 卡片标题：紧凑高亮 */
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffd700;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #444;
  letter-spacing: 1px;
}

/* 1. 角色头显区 */
.header-card {
  display: flex;
  align-items: center;
  gap: 15px;
}
.avatar-placeholder {
  width: 70px;
  height: 70px;
  border-radius: 6px;
  background: linear-gradient(135deg, #333 0%, #555 100%);
  border: 2px solid #444;
}
.header-info {
  flex: 1;
}
.player-name {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}
.player-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
}
.tag.realm {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border: 1px solid #ffd700;
}
.tag.root {
  background: rgba(0, 255, 255, 0.15);
  color: #00ffff;
  border: 1px solid #00ffff;
}
.tag.age {
  background: rgba(100, 100, 100, 0.3);
  color: #aaa;
  border: 1px solid #555;
}

/* 2. 核心进度条 */
.progress-section {
  padding: 12px 15px;
}
.progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-header .label {
  font-size: 14px;
  font-weight: 700;
  color: #ffd700;
}
.progress-header .value {
  font-size: 13px;
  color: #fff;
}
.progress-bar {
  height: 14px;
  background: #222;
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid #444;
}
.progress-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 7px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* 3. 核心属性网格 */
.attr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.attr-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #333;
}
.attr-label {
  font-size: 13px;
  font-weight: 500;
  color: #aaa;
  min-width: 40px;
}
.mini-progress {
  flex: 1;
  height: 8px;
  background: #222;
  border-radius: 4px;
  overflow: hidden;
}
.mini-progress .fill {
  height: 100%;
  transition: width 0.3s ease;
}
.mini-progress .fill.blue {
  background: linear-gradient(90deg, #4a6fa5, #5b7fb8);
}
.mini-progress .fill.gold {
  background: linear-gradient(90deg, #b8860b, #daa520);
}
.mini-progress .fill.purple {
  background: linear-gradient(90deg, #6b486b, #8b5a8b);
}
.mini-progress .fill.green {
  background: linear-gradient(90deg, #2e8b57, #3cb371);
}
.attr-value {
  font-size: 12px;
  color: #fff;
  min-width: 50px;
  text-align: right;
}

/* 4. 基本信息 */
.basic-info-card {
  padding: 12px 15px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #2a2a3a;
}
.info-row:last-child {
  border-bottom: none;
}
.info-row .label {
  font-size: 13px;
  color: #888;
}
.info-row .value {
  font-size: 13px;
  color: #e0e0e0;
  text-align: right;
  max-width: 60%;
}
.info-row .highlight {
  color: #ffd700;
  font-weight: 700;
}

/* 5. 功法技艺 */
.technique-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.core-technique {
  background: rgba(255, 215, 0, 0.1);
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #ffd700;
  margin-bottom: 12px;
}
.core-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.technique-list,
.skill-groups {
  flex: 1;
  overflow: hidden;
}
.list-header,
.group-label {
  font-size: 12px;
  font-weight: 700;
  color: #888;
  margin-bottom: 6px;
  letter-spacing: 1px;
}
.skill-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px solid #333;
  font-size: 13px;
}
.tech-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tech-name {
  font-weight: 500;
}
.grade-tag,
.level-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}
.grade-tag {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border: 1px solid #ffd700;
}
.level-tag {
  background: rgba(100, 100, 100, 0.3);
  color: #aaa;
  border: 1px solid #555;
}
.empty-text {
  color: #666;
  font-size: 13px;
}
.action-btn {
  padding: 5px 12px;
  background: linear-gradient(135deg, #4a6fa5 0%, #5b7fb8 100%);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.action-btn:hover {
  background: linear-gradient(135deg, #5b7fb8 0%, #6b8fc8 100%);
  transform: translateY(-1px);
}
</style>
