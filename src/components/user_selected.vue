<template>
  <div class="template-selector">
    <h1>选择你的角色</h1>
    <div
      v-for="(item, index) in player_selects"
      :key="item.id"
      class="template-card"
    >
      <div class="card-header">模板 {{ index + 1 }}</div>

      <!-- 基础信息 -->
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

      <!-- 天赋数组 -->
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

      <!-- 功法数组 -->
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
            {{ tech.name }}({{ tech.grade }})<span
              v-if="idx < item.player_data.cultivation_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <!-- 战技数组 -->
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
            {{ skill.name }}({{ skill.grade }}/{{ skill.level }})<span
              v-if="idx < item.player_data.combat_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <!-- 身法数组 -->
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
            {{ move.name }}({{ move.grade }}/{{ move.level }})<span
              v-if="idx < item.player_data.movement_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <!-- 其他法门数组 -->
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
            {{ other.name }}({{ other.grade }}/{{ other.type }})<span
              v-if="idx < item.player_data.other_technique.length - 1"
              >、</span
            >
          </span>
        </span>
        <span v-else>无</span>
      </div>

      <!-- 背包物品 -->
      <div class="field-row inventory-section">
        <span class="field-label">背包物品：</span>
        <div class="inventory-items">
          <div v-if="item.player_inventory && item.player_inventory.length">
            <div
              v-for="(inv, idx) in item.player_inventory"
              :key="idx"
              class="inventory-item"
            >
              <span class="inv-name">{{ inv.name }}</span>
              <span class="inv-value">价值:{{ inv.value }}灵石</span>
              <span class="inv-mount">x{{ inv.mount }}</span>
            </div>
          </div>
          <span v-else>无</span>
        </div>
      </div>

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
import { onBeforeRouteLeave } from "vue-router";
let chosen = ref(false);

onBeforeRouteLeave((to, from, next) => {
  if (chosen.value) {
    next();
  } else {
    alert("抱歉,请先选择模版");
    next(false);
  }
});

// 🔥 封装一个通用的 JSON 检测函数
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true; // 能 parse 成功，就是合法 JSON
  } catch (e) {
    return false; // 报错了，就不是合法 JSON
  }
}

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
  chosen.value = true;
  //选择后,立刻更新历史记录,出现一个消息框
  Chat.assistantadd();
  //1, 更新前端
  backpack.setBackpackData(item.player_inventory);
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
    throw error;
  });

  if (!response.ok) {
    console.error("API 授权失败/请求错误");
    return "抱歉，API 请求失败（请换个模型）";
  }
  ///流式输出
  //拿到二进制数据,getReader是'流'的专属函数,只要是这种数据流,都可以访问getReader,与SSE端口无关
  const reader = await response.body.getReader();
  //解码器,作用是解析reader这个二进制的数据
  const decoder = new TextDecoder();
  // 👇收集完整AI回复
  let fullAIText = "";
  //避免报错
  let running = true;
  while (running) {
    //read()是一个异步函数,返回的是promise,作用是持续读取数据,没数据就等待,直到结束
    //返回值就两个,done和value
    const { done, value } = await reader.read();
    if (done) {
      console.log("流式传输结束");
      // 👇 传输完成，调用后端第五层
      try {
        const res = await fetch("http://localhost:3000/api/run-layer5", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullText: fullAIText }),
        });
        const data = await res.json();
        console.log("此处是前端解析流式输出处,✅ 第五层执行结果：", data);
        //同样修改一次,保证每次的前端数据都是最新的
        backpack.setBackpackData(data.backpack.data);
        player.$state = data.PlayerData;
      } catch (err) {
        console.error(
          "❌ 调用第五层失败(错误可能不一定在第五层,也可能在这前端)：",
          err,
        );
      }
      break;
    }
    //解析二进制数据,最后的stream是指流式输出
    const chunk = decoder.decode(value, { stream: true });

    //将输出按照特定解析分开
    const packet = chunk.split("\n\n");
    for (const item of packet) {
      //排除空选项
      if (!item.trim()) continue;
      //判断前6个字符是否正确
      if (item.startsWith("data: ")) {
        const content = item.slice(6);
        console.log("流式传输中:", content);

        //我们自己的业务逻辑：判断是不是结束标记
        if (content === "[DONE]") {
          console.log("收到我们自己定义的结束标记，不处理了");
          continue;
        }

        let data;
        try {
          //现在 content 是纯 JSON 了，可以 parse 了
          if (isValidJSON(content)) {
            data = JSON.parse(content);
          } else {
            data = content;
          }

          // 🔥 1. 提取深度思考内容，流式更新
          const reasoning = data.choices?.[0]?.delta?.reasoning_content || "";
          if (reasoning) {
            console.log("AI深度思考:", reasoning);
            Chat.deepThinking(reasoning);
          }
          // 🔥 2. 提取正式剧情内容，和之前逻辑一致
          // 提取出真正的文本内容（不同大模型 API 的路径可能略有不同）
          // 通常是在 choices[0].delta.content 这里
          const contents = data.choices?.[0]?.delta?.content || "";

          if (contents) {
            console.log("提取到的文本:", contents);
            // 👇 拼接完整文本
            fullAIText += contents;
            // 8. 推给前端（记得也要加 data: 前缀和 \n\n 后缀）
            //res.write(`data: ${contents}\n\n`);
            Chat.assistantChange(contents);
          }
        } catch (parseError) {
          console.error("解析 JSON 失败:", parseError, "原始字符串:", content);
        }
      }
    }
  }

  console.log("后端已同步更改");
}
</script>

<style scoped>
.template-selector {
  display: flex;
  flex-direction: row;
  gap: 20px;
  overflow-x: auto;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  align-items: flex-start;
}
.template-card {
  flex: 0 0 320px;
  background: #f9f3e7;
  border: 1px solid #e2d5c0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  max-height: 90%;
  overflow-y: auto;
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
  width: 80px;
  vertical-align: top;
}
.inventory-section {
  flex-direction: column;
  align-items: flex-start;
}
.inventory-items {
  margin-top: 4px;
  width: 100%;
}
.inventory-item {
  font-size: 12px;
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #e2d5c0;
  padding: 4px 0;
}
.inv-name {
  font-weight: 500;
  color: #5c3d2e;
}
.inv-value,
.inv-mount {
  color: #8b5a2b;
  margin-left: 8px;
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
.template-card::-webkit-scrollbar {
  width: 6px;
}
.template-card::-webkit-scrollbar-track {
  background: #f1e5d3;
  border-radius: 3px;
}
.template-card::-webkit-scrollbar-thumb {
  background: #c9a87c;
  border-radius: 3px;
}
</style>
