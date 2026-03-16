<template>
  <div>
    <h1>请填写您的基本信息</h1>
    <input
      type="text"
      placeholder="请输入名字"
      v-model="userInformation.name"
    />
    <input type="text" placeholder="请输入性别" v-model="userInformation.sex" />
    <button @click="Game_Init">发送数据</button>
  </div>
</template>

<script setup>
import { eventBus } from "@/utils/eventBus";
import { reactive } from "vue";
import { defineEmits } from "vue";
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { useInventoryStore } from "@/stores/Inventory";
import { usePlayerStore } from "@/stores/player";
const emit = defineEmits(["input-user"]);
const Chat = useChatHistoryStore();
const backpack = useInventoryStore();
const player = usePlayerStore();

//包裹对象用reactive更好,可以直接读取属性,不用加value
let userInformation = reactive({
  name: "",
  sex: "",
});

//游戏初始化阶段,单独处理一遍,发送api
async function Game_Init() {
  console.log("成功获取数据", JSON.stringify(userInformation));

  //发送api
  try {
    const response = await fetch("http://localhost:3000/api/Game_Init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInformation }),
    });
    const data = await response.json(); //需要await
    console.log("初始化阶段,ai最终回复为:", data.final_res.reply);
    //将对应ai回复输送到历史记录中,为下次回答做准备
    Chat.assistantadd(data.final_res.reply);
    //更新背包和面板
    backpack.data = data.final_res.inventory;
    player.$state = data.final_res.PlayerData;
  } catch (error) {
    console.log(error);
  }

  //第一次传参,传递给接口文件,准备转递给ai
  eventBus.emit("user-info-updated", userInformation);
  //第二次传参,传递给父组件ai聊天界面,告诉它该函数已经执行了
  emit("input-user");
}
</script>

<style></style>
