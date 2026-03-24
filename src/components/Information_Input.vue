<template>
  <div>
    <h1>请填写您的基本信息</h1>
    <input
      type="text"
      placeholder="请输入名字"
      v-model="userInformation.name"
    />
    <input type="radio" value="男" v-model="userInformation.sex" />男
    <input type="radio" value="女" v-model="userInformation.sex" />女
    <button @click="Game_Init">发送数据</button>
  </div>
</template>

<script setup>
import { eventBus } from "@/utils/eventBus";
import { reactive, ref } from "vue";
import { defineEmits } from "vue";

const emit = defineEmits(["input-user"]);

let player_model = ref([]);
//包裹对象用reactive更好,可以直接读取属性,不用加value
let userInformation = reactive({
  name: "",
  sex: "",
});

//游戏初始化阶段,单独处理一遍,发送api
async function Game_Init() {
  console.log("成功获取数据", JSON.stringify(userInformation));
  //传递给父组件ai聊天界面,告诉它该函数已经执行了
  emit("input-user");
  //发送api
  try {
    const response = await fetch("http://localhost:3000/api/Game_Init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInformation }),
    });
    if (!response.ok) {
      console.error("HTTP错误:", response.status);
      const text = await response.text(); // 可能返回错误详情
      console.error(text);
      return;
    }
    const data = await response.json(); //需要await
    console.log("前端已接收data:", data);
    player_model = data.reply;
    console.log("已导入至player_model", player_model);

    // //更新背包和面板
    // backpack.data = data.reply.player_inventory;
    // player.$state = data.reply.player_data;
  } catch (error) {
    console.log(error);
  }

  //将结果传递给选择组件
  eventBus.emit("user-info-selected", player_model);
}
</script>

<style></style>
