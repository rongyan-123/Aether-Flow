<template>
  <div>
    <h1>背包</h1>
    <div v-for="(item, index) in InventoryStore.data" :key="item.id">
      <span class="kong">{{ index + 1 }}.{{ item.name }} </span>
      <span class="kong">价值:{{ item.value }}</span>
    </div>
  </div>
</template>

<script setup>
import { useInventoryStore } from "@/stores/Inventory";
const InventoryStore = useInventoryStore();
</script>

<style>
.kong {
  padding: 20px;
}
</style>
