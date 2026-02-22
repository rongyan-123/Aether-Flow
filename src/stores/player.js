//属性
import { defineStore } from "pinia";

export const usePlayerStore = defineStore("Player", {
  state: () => ({
    name: "修仙模拟器",
    level: "炼气期三层",
  }),
  actions: {
    add() {},
  },
});
