// server.js 启动后，手动测试写入
const { UpdatePlayer, QueryPlayer } = require("./dao/playerDAO.js");

const testPlayerId = "test_player_001";
const testData = {
  name: "测试玩家",
  level: "炼气期一层",
  cultivation_technique: [],
  chatHistory: [],
};

// 手动写入
UpdatePlayer(testPlayerId, testData);
console.log("✅ 手动写入测试数据完成");

// 手动读取验证
const result = QueryPlayer(testPlayerId);
console.log("✅ 读取到的测试数据：", result);
