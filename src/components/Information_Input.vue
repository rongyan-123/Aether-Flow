<template>
  <div class="form-card">
    <div class="form-group">
      <label class="form-label">道号</label>
      <input
        type="text"
        placeholder="请为你的角色起一个名字"
        v-model="userInformation.name"
        class="form-input"
      />
    </div>
    <div class="form-group">
      <label class="form-label">性别</label>
      <div class="radio-group">
        <label :class="['radio-option', { selected: userInformation.sex === '男' }]">
          <input type="radio" value="男" v-model="userInformation.sex" />
          <span>男</span>
        </label>
        <label :class="['radio-option', { selected: userInformation.sex === '女' }]">
          <input type="radio" value="女" v-model="userInformation.sex" />
          <span>女</span>
        </label>
      </div>
    </div>
    <button class="submit-btn" @click="Game_Init">踏入仙途</button>
  </div>
</template>

<script setup>
import { eventBus } from "@/utils/eventBus";
import { reactive, ref } from "vue";
import { defineEmits } from "vue";

const emit = defineEmits(["input-user"]);

let player_model = ref([]);
let userInformation = reactive({
  name: "",
  sex: "",
});
const BASE_URL = "/api";
async function Game_Init() {
  console.log("成功获取数据", JSON.stringify(userInformation));
  emit("input-user");
  try {
    const response = await fetch(BASE_URL + "/Game_Init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInformation }),
    });
    if (!response.ok) {
      console.error("HTTP错误:", response.status);
      const text = await response.text();
      console.error(text);
      return;
    }
    const data = await response.json();
    console.log("前端已接收data:", data);
    player_model = data.reply;
    console.log("已导入至player_model", player_model);
  } catch (error) {
    console.log(error);
  }

  eventBus.emit("user-info-selected", player_model);
}
</script>

<style scoped>
.form-card {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 400px;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  letter-spacing: 1px;
}

.form-input {
  height: 44px;
  padding: 0 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  color: #1a1a1a;
}

.form-input:focus {
  border-color: #999;
}

.form-input::placeholder {
  color: #bbb;
}

.radio-group {
  display: flex;
  gap: 12px;
}

.radio-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  color: #666;
  transition: all 0.2s;
  user-select: none;
}

.radio-option input {
  display: none;
}

.radio-option:hover {
  border-color: #ccc;
}

.radio-option.selected {
  border-color: #1a6dff;
  background-color: #f0f6ff;
  color: #1a6dff;
  font-weight: 600;
}

.submit-btn {
  height: 44px;
  border: none;
  border-radius: 22px;
  background-color: #1a6dff;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  letter-spacing: 2px;
  margin-top: 8px;
}

.submit-btn:hover {
  background-color: #0052d9;
}
</style>
