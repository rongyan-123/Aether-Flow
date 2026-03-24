<template>
  <div class="template-selector">
    <h1>选择你的角色</h1>
    <div
      v-for="(item, index) in player_selects"
      :key="item.id"
      class="template-card"
    >
      <div class="card-header">模板 {{ index + 1 }}</div>

      <!-- 按字段顺序展示所有面板信息 -->
      <div class="field-row">
        <span class="field-label">姓名：</span
        >{{ item.player_data.name || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">年龄：</span
        >{{ item.player_data.age || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">性别：</span
        >{{ item.player_data.gender || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">背景描述：</span
        >{{ item.player_data.background || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">境界：</span
        >{{ item.player_data.level || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">修为：</span
        >{{ item.player_data.numerical_cultivation || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">灵根类型：</span
        >{{ item.player_data.spiritual_root_type || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">灵根等级：</span
        >{{ item.player_data.spiritual_root_grade || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">灵力：</span
        >{{ item.player_data.spiritual_power || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">根骨：</span
        >{{ item.player_data.potential || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">气运：</span
        >{{ item.player_data.fortune || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">悟性：</span
        >{{ item.player_data.comprehension || "无" }}
      </div>
      <div class="field-row">
        <span class="field-label">天赋：</span>
        <span v-if="item.player_data.talent && item.player_data.talent.length">
          <span v-for="(t, idx) in item.player_data.talent" :key="idx">
            {{ t
            }}<span v-if="idx < item.player_data.talent.length - 1">、</span>
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <div class="field-row">
        <span class="field-label">核心功法：</span>
        <span
          v-if="
            item.player_data.cultivation_technique &&
            item.player_data.cultivation_technique.length
          "
        >
          <span
            v-for="(tech, idx) in item.player_data.cultivation_technique"
            :key="idx"
          >
            {{ tech
            }}<span
              v-if="idx < item.player_data.cultivation_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <div class="field-row">
        <span class="field-label">战技：</span>
        <span
          v-if="
            item.player_data.combat_technique &&
            item.player_data.combat_technique.length
          "
        >
          <span
            v-for="(skill, idx) in item.player_data.combat_technique"
            :key="idx"
          >
            {{ skill
            }}<span v-if="idx < item.player_data.combat_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <div class="field-row">
        <span class="field-label">身法：</span>
        <span
          v-if="
            item.player_data.movement_technique &&
            item.player_data.movement_technique.length
          "
        >
          <span
            v-for="(move, idx) in item.player_data.movement_technique"
            :key="idx"
          >
            {{ move
            }}<span v-if="idx < item.player_data.movement_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <div class="field-row">
        <span class="field-label">其他法门：</span>
        <span
          v-if="
            item.player_data.other_technique &&
            item.player_data.other_technique.length
          "
        >
          <span
            v-for="(other, idx) in item.player_data.other_technique"
            :key="idx"
          >
            {{ other
            }}<span v-if="idx < item.player_data.other_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>
      <!--这里还得加个显示背包内容的,player_inventory是对象数组,同时还要改一下显示,这里战技等地方显示不了对象-->

      <button class="select-btn" @click="Select_Model(item)">选择此模版</button>
    </div>
  </div>
</template>

<script setup>
import { useChatHistoryStore } from "@/AiHistoryStores/ChatHistory";
import { useInventoryStore } from "@/stores/Inventory";
import { usePlayerStore } from "@/stores/player";
import { eventBus } from "@/utils/eventBus";
import { onMounted, onUnmounted, ref } from "vue";
import { defineEmits } from "vue";

const backpack = useInventoryStore();
const player = usePlayerStore();

//收集从创建模版组件传来的三个模版数据
let player_selects = ref([]);
onMounted(() => {
  eventBus.on("user-info-selected", handler);
});
onUnmounted(() => {
  eventBus.off("user-info-selected", handler);
});
function handler(data) {
  console.log("成功进入组件user_selected中的逻辑函数,用以对for循环赋值");
  player_selects.value = data;
}
console.log("player_selects为", player_selects);

//父子通信,将选择完成,这条信息传递出去
const emit = defineEmits(["user-selected"]);

//引入pinia仓库实例
const Chat = useChatHistoryStore();

//选择模版后的执行逻辑
async function Select_Model(item) {
  console.log("成功选择模板:", item);
  //1, 更新前端
  backpack.data = item.player_inventory;
  player.$patch(item.player_data); //用patch合并,直接修改可能破坏响应式,导致无法重新渲染
  //2, 更新后端,同时发送api,直接生成对话
  emit("user-selected");
  const response = await fetch("http://localhost:3000/api/game_start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ item }),
  }).catch((error) => {
    console.error("user_selected.vue\\Select_Model游戏开始失败:", error);
  });
  // response 是一个 Response 对象，包含状态码、头等,只有使用json读取后,才是正儿八经的JS对象data
  const data = await response.json();
  console.log("最终回复为:", data.reply);
  //将对应ai回复输送到历史记录中,为下次回答做准备
  Chat.assistantadd(data.reply);

  console.log("后端已同步更改");
}
</script>

<style scoped>
.template-selector {
  display: flex;
  flex-direction: row; /* 横向排列 */
  gap: 20px; /* 卡片间距 */
  overflow-x: auto; /* 超出时水平滚动 */
  padding: 20px;
  height: 100%; /* 占满父容器高度 */
  box-sizing: border-box;
  align-items: flex-start; /* 顶部对齐，避免卡片拉伸 */
}
.template-card {
  flex: 0 0 300px; /* 固定宽度，不被压缩 */
  background: #f9f3e7;
  border: 1px solid #e2d5c0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  /* 确保卡片内内容过多时，卡片自身可滚动？可选 */
  max-height: 90%; /* 限制卡片高度，避免溢出 */
  overflow-y: auto; /* 内容过多时卡片内部滚动 */
}
.card-header {
  font-size: 1.2rem;
  font-weight: bold;
  color: #5c3d2e;
  border-bottom: 1px solid #dcc9a8;
  margin-bottom: 12px;
  padding-bottom: 4px;
}
.field-row {
  margin: 6px 0;
  line-height: 1.4;
  font-size: 14px;
}
.field-label {
  font-weight: 600;
  color: #8b5a2b;
  display: inline-block;
  width: 80px; /* 让标签对齐 */
}
.select-btn {
  background: #8b5a2b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.2s;
}
.select-btn:hover {
  background: #a0522d;
}
</style>
