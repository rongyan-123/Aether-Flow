//背包
import { defineStore } from "pinia";

export const useInventoryStore = defineStore("inventory", {
  state: () => ({
    data: [
      { id: 1, name: "聚气丹", value: 190 },
      { id: 2, name: "法宝", value: 1000 },
    ],
  }),
  actions: {
    add() {},
  },
});
