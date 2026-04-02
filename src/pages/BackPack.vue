<template>
  <div class="inventory-container">
    <h1 class="inventory-title">背包</h1>

    <!-- 空状态提示 -->
    <div v-if="InventoryStore.data.length === 0" class="empty-state">
      背包空空如也，快去探索吧！
    </div>

    <!-- 物品列表 -->
    <div v-else class="item-list">
      <div
        v-for="(item, index) in InventoryStore.data"
        :key="item.id"
        class="item-card"
      >
        <!-- 左侧：序号 + 主要信息 -->
        <div class="item-left">
          <span class="item-index">{{ index + 1 }}</span>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-look" v-if="item.look">{{ item.look }}</div>
          </div>
        </div>

        <!-- 右侧：属性标签区 -->
        <div class="item-right">
          <span class="item-tag value-tag" v-if="item.value !== undefined"
            >价值: {{ item.value }}灵石</span
          >
          <span class="item-tag mount-tag" v-if="item.mount !== undefined"
            >数量: {{ item.mount }}</span
          >
          <span class="item-tag level-tag" v-if="item.level">{{
            item.level
          }}</span>
        </div>

        <!-- 额外信息（效果）单独一行，占满宽度 -->
        <div class="item-effect" v-if="item.effect">
          <span class="effect-label">效用：</span>{{ item.effect }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from "@/stores/Inventory";
const InventoryStore = useInventoryStore();
</script>

<style scoped>
/* 全局字体：和角色面板统一的古风宋体/楷体 */
@import url("https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap");

/* 整体容器：古风牛皮纸背景，和整体风格统一 */
.inventory-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #dcc9a8 100%);
  min-height: 100vh;
  font-family: "Noto Serif SC", "KaiTi", "STKaiti", "SimSun", serif;
  position: relative;
}

/* 牛皮纸全局纹理 */
.inventory-container::before {
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

/* 标题 */
.inventory-title {
  text-align: center;
  color: #5c3d2e;
  font-size: 30px;
  margin-bottom: 32px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(92, 61, 46, 0.15);
  letter-spacing: 8px;
  position: relative;
  z-index: 1;
}

/* 空状态 */
.empty-state {
  text-align: center;
  color: #7a5230;
  font-size: 17px;
  padding: 70px 20px;
  background: linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(92, 61, 46, 0.12);
  border: 1px solid #c9a87c;
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

/* 物品列表 */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  z-index: 1;
}

/* 单个物品卡片 */
.item-card {
  background: linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%);
  border-radius: 12px;
  padding: 18px 24px;
  box-shadow: 0 4px 12px rgba(92, 61, 46, 0.12);
  border: 1px solid #c9a87c;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(92, 61, 46, 0.18);
}

/* 左侧：序号+名称+外貌 */
.item-left {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  flex: 2;
  min-width: 200px;
}

.item-index {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #8b5a2b 0%, #a0522d 100%);
  color: #faf0e6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(139, 90, 43, 0.25);
  flex-shrink: 0;
}

.item-info {
  flex: 1;
}

.item-name {
  color: #5c3d2e;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.item-look {
  font-size: 13px;
  color: #8b5a2b;
  font-style: italic;
  line-height: 1.4;
}

/* 右侧标签区 */
.item-right {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 1;
}

.item-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  border: 1px solid #c9a87c;
  background: #fff9ef;
  white-space: nowrap;
}

.value-tag {
  color: #8b4513;
  border-color: #d4a373;
}

.mount-tag {
  color: #4a6fa5;
  border-color: #b0c4de;
}

.level-tag {
  color: #2c5a2e;
  border-color: #8fbc8f;
  background: #e8f0e8;
}

/* 效果描述单独一行 */
.item-effect {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #dcc9a8;
  font-size: 13px;
  color: #6b4c3b;
  width: 100%;
  line-height: 1.5;
}

.effect-label {
  font-weight: 700;
  color: #8b5a2b;
  margin-right: 8px;
}
</style>
