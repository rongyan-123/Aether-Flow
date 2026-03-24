//玩家面板(动态,pinia仓库只能是动态修改数据的)
//所有的功法等等物品都不带有描述,对应描述只在提供给ai的数据文本里,到时候直接根据名字来搜索,然后渲染即可,这里别写描述,太多了
import { defineStore } from "pinia";

export const usePlayerStore = defineStore("Player", {
  state: () => ({
    //此仓库没有data,是全部放在state里面的,所以访问的时候要写.$state
    name: "齐尘 ",
    age: 16,
    max_age: 80,
    level: "炼气期三层",
    background: "无",
    numerical_cultivation: "309/400",
    spiritual_root_type: "火_水_木",
    spiritual_root_grade: "三灵根",
    spiritual_power: "98/100", //灵力
    potential: "10/20", //根骨
    fortune: "9/20", //气运
    comprehension: "15/20", //悟性
    talent: [],
    cultivation_technique: [],
    core_cultivation_method: {},
    combat_technique: [],
    movement_technique: [],
    other_technique: [],
  }),
  actions: {
    add_Cultivation_Technique(obj) {
      //先遍历功法列表,看看有没有相同的
      for (const index of this.cultivation_technique) {
        if (index.name === obj.name) {
          console.log("功法已经会了");
          return "抱歉,这本功法你已经会了";
        }
      }

      //如果没发现相同,再加进去
      this.cultivation_technique.push(obj);
      console.log("成功加入功法");

      return `已加入新功法!${obj.name},品阶为:${obj.grade}`;
    },
    change_coreTechnique(obj) {
      this.core_cultivation_method.name = obj.name;
      this.core_cultivation_method.grade = obj.grade;
    },
    add_Technique(obj) {
      console.log("成功进入增加技艺工具");
      console.log("当前技艺:", obj);
      //==============增加战技
      if (obj.type === "战技") {
        console.log("成功进入增加战技工具,当前战技名字:", obj.name);

        //先遍历功法列表,看看有没有相同
        for (const index of this.combat_technique) {
          if (index.name === obj.name) {
            console.log("战技已经会了");
            return "抱歉,这本战技你已经会了";
          }
        }
        //如果没发现相同,再加进去
        this.combat_technique.push(obj);
        console.log("成功学会战技");

        return `已加入新战技!${obj.name},品阶为:${obj.grade},境界为${obj.level}`;
      }
      //=============身法增加
      if (obj.type === "身法") {
        //先遍历功法列表,看看有没有相同
        for (const index of this.movement_technique) {
          if (index.name === obj.name) {
            console.log("身法已经会了");
            return "抱歉,这本身法你已经会了";
          }
        }
        //如果没发现相同,再加进去
        this.movement_technique.push(obj);
        console.log("成功学会身法");

        return `已加入新身法!${obj.name},品阶为:${obj.grade},境界为${obj.level}`;
      }
      //=============其他法门增加
      if (obj.type === "其他法门") {
        //先遍历功法列表,看看有没有相同
        for (const index of this.other_technique) {
          if (index.name === obj.name) {
            console.log("该法门已经会了");
            return "抱歉,这本法门你已经会了";
          }
        }
        //如果没发现相同,再加进去
        this.other_technique.push(obj);
        console.log("成功学习法门");

        return `已加入新法门!${obj.name},品阶为:${obj.grade},境界为${obj.level}`;
      }
    },
  },
});
