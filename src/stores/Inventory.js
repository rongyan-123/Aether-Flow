//背包
import { defineStore } from "pinia";

export const useInventoryStore = defineStore("inventory", {
  state: () => ({
    data: [
      { id: 1, name: "聚气丹", value: 100, mount: 9 },
      { id: 2, name: "法宝", value: 2910, mount: 1 },
    ],
  }),
  actions: {
    add(obj) {
      //使用遍历,来做到同类物品堆叠
      for (const item of this.data) {
        //如果发现同名,就直接把数量加在一起,然后返回就行
        if (obj.name === item.name) {
          item.mount += obj.mount;
          return;
        }
      }
      //遍历完没有发现同名,再直接推入一个新的
      this.data.push({
        id: Date.now(),
        name: obj.name,
        value: obj.value,
        mount: obj.mount,
      });
    },
    reduce(obj) {
      //使用遍历,来做到同类物品堆叠,注意,此处只对一个对象进行操作
      for (const item of this.data) {
        //如果发现同名,就直接把数量相减,然后返回就行
        if (obj.name === item.name) {
          if (obj.mount > item.mount) {
            return `抱歉,道友,你的背包中${obj.name}数量不足`;
          }
          item.mount -= obj.mount;
          if (item.mount <= 0) {
            this.data = this.data.filter((i) => i.name !== obj.name);
          }

          return `${obj.mount}个${obj.name}`;
        }
      }
      //遍历完没有发现同名,直接返回
      return `没有在物品栏中找到${obj.name}`;
    },
  },
});
