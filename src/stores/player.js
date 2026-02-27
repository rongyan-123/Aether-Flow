//玩家面板(动态,pinia仓库只能是动态修改数据的)
//所有的功法等等物品都不带有描述,对应描述只在提供给ai的数据文本里,到时候直接根据名字来搜索,然后渲染即可,这里别写描述,太多了
import { defineStore } from "pinia";

export const usePlayerStore = defineStore("Player", {
  state: () => ({
    //此仓库没有data,是全部放在state里面的,所以访问的时候要写.$state
    name: "齐尘 ",
    age: 16,
    level: "炼气期三层",
    numerical_cultivation: "309/400",
    spiritual_root_type: "火_水_木",
    spiritual_root_grade: "三灵根",
    spiritual_power: "98/100", //灵力
    potential: "10/20", //根骨
    fortune: "9/20", //气运
    comprehension: "15/20", //悟性
    cultivation_technique: [
      { name: "练气篇引导决", grade: "黄阶下品" },
      {
        name: "天衍觉",
        grade: "天阶中品",
      },
    ],
    core_cultivation_method: {
      name: "天衍觉",
      grade: "天阶中品",
    },
    combat_technique: [
      { name: "八极崩", grade: "玄阶下品" },
      { name: "大荒囚天指", grade: "地阶中品" },
    ],
    movement_technique: [{ name: "踏雪无痕", grade: "玄阶下品" }],
    other_technique: [{ name: "探测术", grade: "黄阶下品" }],
  }),
  actions: {
    add() {},
  },
});
