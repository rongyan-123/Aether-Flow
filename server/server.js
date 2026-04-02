console.log("我是修仙后端，我启动了！");
const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");
const { chatWithAI, initRAG, layer5 } = require("./utils/ai.js");
const { Init_AI } = require("./utils/Init_ai.js");
const fs = require("fs");
const { Readable } = require("stream");
const { StateMachina } = require("./fs.js");
const eventBus = require("./utils/eventBus.js");

app.use(cors()); //跨域访问需要,比如端口8081访问端口3000
app.use(express.json()); //加了才能解析前端发送的json数据

app.get("/", (req, res) => {
  res.send("欢迎来到修仙后端");
});

app.post("/api/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  console.log("成功访问.用户输入为:", req.body);
  //判断游戏是否开始
  let Game_start = true;

  //后端发送函数,前端的EventSource会自动解析这里的值,获取content的
  const SendLayer_Messages = (content) => {
    res.write(`data: ${content}\n\n`);
  };

  const reply = await chatWithAI(
    req.body.midInput,
    Game_start,
    SendLayer_Messages,
  );
  // 【核心修改】把 Web Stream 转成 Node.js Stream
  const nodeStream = Readable.fromWeb(reply);
  // 现在可以用 pipe 了
  nodeStream.pipe(res);
});

//🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴
app.post("/api/Game_Init", async (req, res) => {
  console.log("成功进入初始化阶段.用户输入为:", req.body);
  const reply = await Init_AI(req.body.userInformation);
  console.log("🔴🔴🔴ai初始化结束,开始生成模版选择🔴🔴🔴");

  console.log("Init_AI 返回：", reply);
  res.json({ reply });
});

//🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴
app.post("/api/game_start", async (req, res) => {
  // 1. 【关键第一步】设置响应头，告诉前端这是流式输出,SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const playerFilePath = "./store/PlayerData.json";
  const rawPlayer = fs.readFileSync(playerFilePath, "utf8");
  let playerData = JSON.parse(rawPlayer); // 这是真正的数据对象
  //更新后端数据
  try {
    const inventoryFilePath = "./store/inventory.json";
    const rawInventory = fs.readFileSync(inventoryFilePath, "utf8");
    const inventory = JSON.parse(rawInventory);
    //修改玩家面板
    playerData = req.body.item.player_data;
    await fs.writeFileSync(
      //写回背包文件,持久化处理
      "./store/PlayerData.json",
      JSON.stringify(playerData, null, 2),
      "utf8",
    );
    //修改背包
    inventory.data = req.body.item.player_inventory; // 如果前端传入的是数组
    await fs.writeFileSync(
      //写回背包文件,持久化处理
      "./store/inventory.json",
      JSON.stringify(inventory, null, 2),
      "utf8",
    );
  } catch (err) {
    console.log("在游戏初始化阶段,更新背包和面板出现错误:", err);
  }
  console.log("后端已同步更改,当前位置:server.js");
  console.log("🔴🔴🔴用户已选择,直接进入五层架构,生成剧情和开头🔴🔴🔴");
  //拿到用户选择的模版的背景
  const Init_Plot = playerData.background;
  console.log("用户选择的人物背景为: ", Init_Plot);

  //判断游戏是否开始
  let Game_start = false;
  //后端发送函数
  const SendLayer_Messages = (content) => {
    res.write(`data: ${content}\n\n`);
  };

  const reply = await chatWithAI(
    req.body.midInput,
    Game_start,
    SendLayer_Messages,
  );

  // 【核心修改】把 Web Stream 转成 Node.js Stream
  const nodeStream = Readable.fromWeb(reply);
  // 现在可以用 pipe 了
  nodeStream.pipe(res);
});

// 🔥 把这两行放在路由之前，限制改大一点（比如 50mb）
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

//🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴第五层🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴
// 【新增】专门执行第五层的接口
app.post("/api/run-layer5", async (req, res) => {
  try {
    const { fullText } = req.body;
    console.log("进入第五层");
    console.log("流式输出的ai文本内容(请查看是否超过5wtoken):", fullText);

    // 直接调用你的第五层
    const reply = await layer5(fullText, StateMachina.userInput);
    console.log("✅ 第五层执行结果：", reply);
    res.json(reply);
  } catch (err) {
    res.json({ success: false, msg: "layer5执行失败" });
  }
});

//每一层的阶段性反馈,使用SSE
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  console.log("SSE已启动");
  const listener = (layerType, msg) => {
    res.write(`event: ${layerType}\n`);
    res.write(`data: ${msg}\n\n`);
  };

  eventBus.on("ai-progress", listener);

  req.on("close", () => {
    eventBus.off("ai-progress", listener);
    res.end();
  });
});

//初始化函数
const serverstart = async () => {
  await initRAG();
  app.listen(PORT, () => {
    console.log("成功进入修仙界");
    console.log(`接口:http://localhost:${PORT}`);
  });
};
serverstart();
