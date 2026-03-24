import { defineStore } from "pinia";
import { ref } from "vue";

export const useGameStart = defineStore("game", () => {
  const game_start = ref(true);
  let select = ref(false);
  let ai_input = ref(false);

  return { game_start, select, ai_input };
});
