console.log("我是修仙后端，我启动了！");
const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");
const { chatWithAI } = require("./utils/ai.js");
const { backpack, PlayerData } = require("./fs.js");
const { Init_AI } = require("./utils/Init_ai.js");
const fs = require("fs");

app.use(cors()); //跨域访问需要,比如端口8081访问端口3000
app.use(express.json()); //加了才能解析前端发送的json数据

app.get("/", (req, res) => {
  res.send("欢迎来到修仙后端");
});

app.post("/api/chat", async (req, res) => {
  console.log("成功访问.用户输入为:", req.body);
  //判断游戏是否开始
  let Game_start = true;
  const reply = await chatWithAI(req.body.midInput, Game_start);
  const final_res = {
    //此处直接调用新背包和面板,将其传给前端
    reply: reply,
    inventory: backpack.data, //传入的是对象数组...
    PlayerData: PlayerData,
  };

  console.log("chatWithAI 返回：", final_res);
  res.json({ final_res });
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
  console.log("成功进入更新后端背包和面板");
  const playerFilePath = "./store/PlayerData.json";
  const rawPlayer = fs.readFileSync(playerFilePath, "utf8");
  let playerData = JSON.parse(rawPlayer); // 这是真正的数据对象

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
  console.log("后端已同步更改,当前位置:server.js");
  console.log("🔴🔴🔴用户已选择,直接进入五层架构,生成剧情和开头🔴🔴🔴");
  //拿到用户选择的模版的背景
  const Init_Plot = playerData.background;
  console.log("用户选择的人物背景为: ", Init_Plot);

  //判断游戏是否开始
  let Game_start = false;
  const reply = await chatWithAI(req.body.midInput, Game_start, Init_Plot);
  res.json({ reply });
});

app.listen(PORT, () => {
  console.log("成功进入修仙界");
  console.log(`接口:http://localhost:${PORT}`);
});
