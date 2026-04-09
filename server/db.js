const Database = require("better-sqlite3");

let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    dbInstance = new Database("./store/game.db");

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS player_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT UNIQUE NOT NULL,
      json_data TEXT NOT NULL

      CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT UNIQUE NOT NULL,
      json_data TEXT NOT NULL
    );
      `);
  }
  return dbInstance;
}
module.exports = getDB;
