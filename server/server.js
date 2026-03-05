console.log("我是修仙后端，我启动了！");
const express = require("express");
const app = express();
const PORT = 3000;

// CSP中间件
app.use((req, res, next) => {
  console.log("CSP中间件执行了，URL:", req.url);
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://www.gstatic.com; " +
      "img-src 'self' data:; " +
      "connect-src 'self' http://localhost:3000 ws://localhost:3000; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "frame-ancestors 'self';",
  );
  next();
});

app.get("/", (req, res) => {
  res.send("欢迎来到修仙后端"); // 或者直接返回空，或者重定向到你的前端页面
});

app.listen(PORT, () => {
  console.log("成功进入修仙界");
  console.log(`请访问网址:http://localhost:${PORT}`);
});
