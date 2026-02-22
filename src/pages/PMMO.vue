<template>
  <div>
    <h1>属性</h1>
    <div>{{ PlayerStore.name }}</div>
  </div>
</template>

<script setup>
import { usePlayerStore } from "@/stores/player";
const PlayerStore = usePlayerStore();
</script>

<style>
.kong {
  padding: 20px;
}
</style>
