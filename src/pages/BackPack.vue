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
/* 整体容器 */
.inventory-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  min-height: 100vh;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

/* 标题 */
.inventory-title {
  text-align: center;
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 30px;
  font-weight: 600;
}

/* 空状态 */
.empty-state {
  text-align: center;
  color: #95a5a6;
  font-size: 16px;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 物品列表 */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 单个物品卡片 */
.item-card {
  background: white;
  border-radius: 12px;
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

/* 左侧：序号+名称 */
.item-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-index {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.item-name {
  color: #2c3e50;
  font-size: 17px;
  font-weight: 500;
}

/* 右侧：价值+数量标签 */
.item-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.item-tag {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.value-tag {
  background: #fff3cd;
  color: #856404;
}

.mount-tag {
  background: #d1ecf1;
  color: #0c5460;
}
</style>
