<template>
  <div>
    <h1>角色面板</h1>
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
