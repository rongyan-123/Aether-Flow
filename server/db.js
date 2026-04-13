const Database = require("better-sqlite3");

let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    dbInstance = new Database("./store/game.db");
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
