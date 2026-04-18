const { getDB } = require("../db.js");

const db = getDB();

//插入和更新角色面板
const insert_player = db.prepare(`
  INSERT INTO player_data(player_id,json_data) VALUES (?,?)
  ON CONFLICT(player_id) DO UPDATE SET
    json_data = excluded.json_data,
    updated_at = CURRENT_TIMESTAMP
  `);

function UpdatePlayer(player_id, player_data) {
  const res = insert_player.run(player_id, JSON.stringify(player_data));
  console.log("已更新面板");
  return res;
}

//查询角色面板
const query_player = db.prepare(`
  SELECT json_data FROM player_data WHERE player_id = ?
  `);

function QueryPlayer(id) {
  const res = query_player.get(id);
  return res ? JSON.parse(res.json_data) : null;
}

//🎒🎒🎒🎒🎒🎒🎒🎒🎒🎒🎒🎒🎒🎒🎒背包🎒🎒🎒🎒🎒🎒🎒🎒🎒🎒

//插入和更新背包
const insert_inventory = db.prepare(`
  INSERT INTO inventory(player_id,json_data) VALUES (?,?)
  ON CONFLICT(player_id) DO UPDATE SET
    json_data = excluded.json_data,
    updated_at = CURRENT_TIMESTAMP
  `);

function UpdateInventory(player_id, player_data) {
  const res = insert_inventory.run(player_id, JSON.stringify(player_data));
  console.log("已更新背包");
  return res;
}

//查询背包
const query_inventory = db.prepare(`
  SELECT json_data FROM inventory WHERE player_id = ?
  `);

function QueryInventory(id) {
  const res = query_inventory.get(id);
  return res ? JSON.parse(res.json_data) : null;
}

module.exports = { QueryPlayer, UpdatePlayer, UpdateInventory, QueryInventory };
