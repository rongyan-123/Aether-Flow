console.log("我是修仙后端，我启动了！");
const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");
const { chatWithAI } = require("./utils/ai.js");
const { backpack, PlayerData } = require("./fs.js");
app.use(cors()); //跨域访问需要,比如端口8081访问端口3000
app.use(express.json()); //加了才能解析前端发送的json数据

app.get("/", (req, res) => {
  res.send("欢迎来到修仙后端");
});

app.post("/api/chat", async (req, res) => {
  console.log("成功访问.用户输入为:", req.body);
  const reply = await chatWithAI(req.body.midInput);
  const final_res = {
    //此处直接调用新背包和面板,将其传给前端
    reply: reply,
    inventory: backpack.data, //传入的是对象数组...
    PlayerData: PlayerData,
  };
  console.log("chatWithAI 返回：", final_res);
  res.json({ final_res });
});

app.listen(PORT, () => {
  console.log("成功进入修仙界");
  console.log(`接口:http://localhost:${PORT}`);
});
