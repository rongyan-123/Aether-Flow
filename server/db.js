const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    // 以当前文件(server/db.js)为基准，定位到项目根的 store/game.db
    const dbDir = path.resolve(__dirname, "..", "store");
    // 确保目录存在（递归创建）
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, "game.db");
    dbInstance = new Database(dbPath);
    dbInstance.pragma("journal_mode = WAL"); //开启WAL模式,并发性能增加
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS player_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT UNIQUE NOT NULL,
      json_data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
      CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT UNIQUE NOT NULL,
      json_data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
      `);
  }
  return dbInstance;
}
module.exports = { getDB };
