# 🧙 修仙模拟器 · AI 驱动的动态文字游戏

> 基于大语言模型 + RAG 向量检索的修仙世界模拟器
> 玩家通过自然语言与 AI 互动，AI 实时生成剧情、物品与 NPC，实现接近“无限剧情”的沉浸式体验。

---

## 🚀 项目亮点

* 🧠 **AI 原生交互**：自然语言驱动游戏进程
* 🔍 **RAG 检索增强**：降低幻觉，增强世界观一致性
* 🧩 **五层叙事架构**：保证剧情逻辑连贯
* ⚡ **流式输出 + SSE**：降低等待焦虑，提升沉浸感
* 💾 **状态持久化**：角色、背包、剧情持续演化

---

## 📸 演示截图

![demo1](./a5e93e5e1e03973c08d30665187031de.png)
![demo2](./1e2a50ea6feb42a7a55303c6a95c54fb.png)
![demo3](./cd7aa4f337be676cfa45081e81e22ebf.png)
![demo4](./c1809d84d131664b6cb882269fef2b2b.png)

---

## 🎮 项目简介

**玩法：**
你扮演一名修仙者，通过自然语言控制角色：

> “去坊市买筑基丹”
> “我要闭关修炼”

AI 会结合当前：

* 剧情进度
* 玩家属性
* 背包内容

实时生成后续发展。

---

### 🌍 动态世界

* 剧情、NPC、物品全部由 AI 动态生成
* 每次游戏体验完全不同

---

### 🧠 记忆与状态

* 玩家属性、背包、地图、关系网络全部持久化
* 世界随你的行为不断演化

---

## 🛠 技术栈

| 分类       | 技术                                 |
| -------- | ---------------------------------- |
| 前端       | Vue 3 + Pinia + Vue Router + SSE   |
| 后端       | Node.js + Express                  |
| AI / RAG | 豆包 API + ChromaDB + ONNX embedding |
| 数据存储     | JSON + SQLite（迁移中）                 |
| 实时通信     | SSE + 流式输出                         |
| 部署       | PM2 + Nginx + Docker               |

---

## ✨ 核心功能

* ✅ 自然语言交互（AI 驱动）
* ✅ 五层叙事引擎（逻辑闭环）
* ✅ RAG 知识库（降低幻觉）
* ✅ 动态实体生成（NPC / 物品 / 地点）
* ✅ SSE 实时进度反馈
* ✅ 状态机持久化
* ✅ 流式打字机输出

---

## 🧠 架构设计

### 五层叙事管线

```text
查询层 → 叙事规划 → 细节生成 → 因果推演 → 执行层
```

1. **查询层**：RAG 检索 + 背包/面板数据
2. **叙事规划层**：生成剧情结构（起承转合）
3. **细节生成层**：创建 NPC / 物品 / 地点
4. **因果推演层**：生成自然语言结果
5. **执行层**：更新状态（背包、地图、数值）

---

### RAG 设计

* 使用 `Xenova/bge-small-zh-v1.5` 本地 embedding
* 向量库存储修仙世界观数据
* Top-K 检索 + 拼接 Prompt

---

### 状态机设计

* `user_StateMachina.json` 维护：

  * 当前地点
  * 剧情阶段
  * 关系网络
* 每次对话后同步更新，保证一致性

---

## ⚡ 性能优化

* 🔥 五层调用合并：请求减少 40%
* ⚡ 延迟优化：39s → 15s
* 🧵 流式输出：降低体感等待
* 📡 SSE 推送：实时进度反馈
* 🧠 embedding 缓存：减少重复计算

---

## 🚀 快速开始

### 环境要求

* Node.js 18+
* npm / yarn
* Docker（推荐）

---

### 1️⃣ 克隆项目

```bash
git clone https://github.com/rongyan-123/Ai-xiuxian.git
cd Ai-xiuxian
```

---

### 2️⃣ 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd ../server
npm install
```

---

### 3️⃣ 配置环境变量

在 `server/.env` 中：

```env
API_KEY=你的API Key
LLM=doubao-seed-2-0-pro
```

---

### 4️⃣ 启动 ChromaDB

```bash
docker run -d -p 1111:8000 \
-v ./chroma_data:/chroma/chroma \
--name chroma-rag chromadb/chroma
```

---

### 5️⃣ 初始化向量数据

```bash
cd server
node seed-chroma.js
```

---

### 6️⃣ 启动后端

```bash
node server.js
```

---

### 7️⃣ 启动前端

```bash
cd frontend
npm run serve
```

访问：

```
http://localhost:8080
```

---

## 📁 项目结构

```text
Ai-xiuxian/
├── frontend/
│   ├── src/
│   └── ...
├── server/
│   ├── store/
│   ├── utils/
│   └── ...
└── docker-compose.yml
```

---

## 📄 License

MIT License

---

## 🙏 致谢

* 豆包大模型
* ChromaDB
* Hugging Face（Xenova）
