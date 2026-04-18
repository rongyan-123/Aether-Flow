const env = process.env.NODE_ENV || "development";
require("dotenv").config({ path: `../.env.${env}` });
console.log("我是修仙后端，我启动了！");
const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");
const { chatWithAI, initRAG, layer5 } = require("./utils/ai.js");
const { Init_AI } = require("./utils/Init_ai.js");
const { Readable } = require("stream");
const eventBus = require("./utils/eventBus.js");
const { UpdatePlayer, UpdateInventory } = require("./dao/playerDAO.js");
const { query_StateMachina } = require("./fs.js");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

//跨域访问需要,比如端口8081访问端口3000
app.use(express.json()); //加了才能解析前端发送的json数据

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// 【定制化安全配置】适配前后端分离修仙游戏项目，不是无脑全量开启
app.use(
  helmet({
    // 1. 内容安全策略：解决XSS风险，适配你的前端地址、流式接口
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // 适配Vue前端
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:3000",
          "wss:",
          "https://ark.cn-beijing.volces.com",
          "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        ], // 放行你的后端接口、豆包AI地址
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:"],
      },
    },
    // 2. 跨域资源策略：适配前后端分离
    crossOriginResourcePolicy: { policy: "same-site" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    // 3. 禁用XSS防护的老方案，用CSP替代（更安全）
    xssFilter: false,
    // 4. 禁止iframe嵌套你的页面，防点击劫持
    frameguard: { action: "deny" },
    // 5. 强制HTTPS（生产环境开启，开发环境关闭）
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 15552000, includeSubDomains: true }
        : false,
  }),
);
// ===================== 1. 通用基础限流：所有接口默认规则 =====================
const baseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟窗口
  max: 60, // 普通接口1分钟最多60次请求
  message: { code: 429, msg: "请求过于频繁，请1分钟后再试" },
  standardHeaders: true,
  legacyHeaders: false,
  // 限流触发时打日志，方便排查刷接口的行为
  handler: (req, res) => {
    console.warn(`[限流触发] IP:${req.ip} 接口:${req.path} 触发频率限制`);
    res.status(429).json(this.message);
  },
});
app.use(baseLimiter);

// ===================== 2. 核心高成本接口：严格限流（AI接口） =====================
// 你的AI接口调用豆包有成本，必须严格限制，防止被刷爆
const aiStrictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟窗口
  max: 15, // 1分钟最多15次AI请求，完全适配游戏正常操作
  message: { code: 429, msg: "道友请留步！操作过于频繁，先调息片刻再试吧~" },
  standardHeaders: true,
  legacyHeaders: false,
});
// 只给AI相关接口应用严格限流
app.use("/api/game_start", aiStrictLimiter);
app.use("/api/chat", aiStrictLimiter); // 你的聊天接口
app.use("/api/run-layer5", aiStrictLimiter); // 你的第五层执行接口

// ===================== 3. 玩家数据读写接口：中等限流 =====================
const dataOperateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { code: 429, msg: "数据操作过于频繁，请稍后再试" },
});
app.use("/api/save_player", dataOperateLimiter);
app.use("/api/get_player", dataOperateLimiter);

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
  //同一个用户的角色和背包id,测试阶段,先固定一个
  const player_id = "test_player_001";

  //更新后端数据
  try {
    //新增玩家面板
    UpdatePlayer(player_id, req.body.item.player_data);
    //修改背包
    UpdateInventory(player_id, req.body.item.player_inventory);
  } catch (err) {
    console.log("在游戏初始化阶段,更新背包和面板出现错误:", err);
  }
  console.log("后端已同步更改,当前位置:server.js");
  console.log("🔴🔴🔴用户已选择,直接进入五层架构,生成剧情和开头🔴🔴🔴");
  //拿到用户选择的模版的背景
  const Init_Plot = req.body.item.player_data.background;
  console.log("用户选择的人物背景为: ", Init_Plot);

  //判断游戏是否开始
  let Game_start = false;
  // //后端发送函数
  // const SendLayer_Messages = (content) => {
  //   res.write(`data: ${content}\n\n`);
  // };

  //发送给ai应用层🔴🔴🔴
  const reply = await chatWithAI(req.body.midInput, Game_start);

  // ✅【核心修复】判断返回值：是流就转发，不是流就直接返回JSON
  if (reply && typeof reply.getReader === "function") {
    // 是 Web Stream → 正常流式转发
    const nodeStream = Readable.fromWeb(reply);
    res.setHeader("Content-Type", "text/event-stream");
    nodeStream.pipe(res);
  } else {
    // 是字符串/错误提示 → 普通返回，不转流
    res.json({ code: 500, msg: reply });
  }
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
    const StateMachina = query_StateMachina();
    // 直接调用你的第五层
    const reply = await layer5(fullText, StateMachina.userInput);
    console.log("此处是server接口处,✅ 第五层执行结果：", reply);
    res.json(reply);
  } catch (err) {
    console.log("❌❌❌ 接口捕获到 layer5 错误：", err);
    res.json({ success: false, msg: "layer5执行失败" });
  }
});

//每一层的阶段性反馈,使用SSE
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

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
