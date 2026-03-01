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
        <div class="item-left">
          <span class="item-index">{{ index + 1 }}</span>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
          </div>
        </div>
        <div class="item-right">
          <span class="item-tag value-tag">价值: {{ item.value }}</span>
          <span class="item-tag mount-tag">数量: {{ item.mount }}</span>
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
  max-width: 750px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #dcc9a8 100%);
  min-height: 100vh;
  font-family: "Noto Serif SC", "KaiTi", "STKaiti", "SimSun", serif;
  position: relative;
}

/* 牛皮纸全局纹理，和整体统一 */
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

/* 标题：古风风格，和角色面板统一 */
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

/* 空状态：古风风格 */
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

/* 单个物品卡片：古风风格 */
.item-card {
  background: linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%);
  border-radius: 10px;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(92, 61, 46, 0.12);
  border: 1px solid #c9a87c;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(92, 61, 46, 0.18);
}

/* 左侧：序号+名称 */
.item-left {
  display: flex;
  align-items: center;
  gap: 18px;
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
}

.item-name {
  color: #5c3d2e;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 右侧：价值+数量标签 */
.item-right {
  display: flex;
  gap: 14px;
  align-items: center;
}

.item-tag {
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  border: 1px solid #c9a87c;
}

/* 价值标签：古风金色系 */
.value-tag {
  background: linear-gradient(135deg, #fff8dc 0%, #f5e6d3 100%);
  color: #8b4513;
}

/* 数量标签：古风蓝色系 */
.mount-tag {
  background: linear-gradient(135deg, #e8f4f8 0%, #d4e8f0 100%);
  color: #4a6fa5;
}
</style>
