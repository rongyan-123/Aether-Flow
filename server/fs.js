const { AsyncMutex } = require("./AsyncMutex");
const {
  QueryPlayer,
  UpdatePlayer,
  QueryInventory,
  UpdateInventory,
} = require("./dao/playerDAO");
const mutex = new AsyncMutex();
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");

// Helper to resolve file paths relative to this file (server folder)
function resolveServerPath(rel) {
  // rel is like './store/xxx.json' or './AiHistoryStores/ChatHistory.json'
  return path.resolve(__dirname, rel);
}

function ensureFileExists(fullPath, defaultContent) {
  const dir = path.dirname(fullPath);
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
  if (!fsSync.existsSync(fullPath)) {
    fsSync.writeFileSync(fullPath, defaultContent, "utf8");
  }
}

// Ensure commonly required files exist with safe defaults
ensureFileExists(
  resolveServerPath("./AiHistoryStores/ChatHistory.json"),
  JSON.stringify({ chatHistory: [] }, null, 2),
);
ensureFileExists(
  resolveServerPath("./store/user_StateMachina.json"),
  JSON.stringify(
    {
      userInput: "",
      Plot: {},
      QueryResult: [],
      now_location: {},
      current_Plot: "",
    },
    null,
    2,
  ),
);
ensureFileExists(
  resolveServerPath("./store/AI_generateItems.json"),
  JSON.stringify([], null, 2),
);
ensureFileExists(
  resolveServerPath("./store/Maps.json"),
  JSON.stringify([], null, 2),
);

//==========================🔴读取用户面板
//💡1,读取面板
async function query_playerStats(id) {
  try {
    console.log("进入读取面板工具");
    const raw = QueryPlayer(id);
    return raw;
  } catch (err) {
    console.log("当前位置:fs.js中的读取面板函数,报错为:", err);
  }
}

//💡2,增加修炼功法
async function add_Cultivation_Technique(id, obj) {
  const PlayerData = QueryPlayer(id);
  //先遍历功法列表,看看有没有相同的
  for (const index of PlayerData.cultivation_technique) {
    if (index.name === obj.name) {
      console.log("功法已经会了");
      return "抱歉,这本功法你已经会了";
    }
  }

  //如果没发现相同,再加进去
  PlayerData.cultivation_technique.push(obj);
  console.log("成功加入功法");
  UpdatePlayer(id, PlayerData);

  return `已加入新功法!${obj.name},品阶为:${obj.grade}`;
}

//💡3, 增加技艺
async function add_Technique(id, obj) {
  console.log("成功进入增加技艺工具");
  console.log("当前技艺:", obj);
  const PlayerData = QueryPlayer(id);
  //==============增加战技
  if (obj.type === "战技") {
    console.log("成功进入增加战技工具,当前战技名字:", obj.name);

    //先遍历功法列表,看看有没有相同
    for (const index of PlayerData.combat_technique) {
      if (index.name === obj.name) {
        console.log("战技已经会了");
        return "抱歉,这本战技你已经会了";
      }
    }
    //如果没发现相同,再加进去
    PlayerData.combat_technique.push(obj);
    console.log("成功学会战技");
    UpdatePlayer(id, PlayerData);

    return `已加入新战技!${obj.name},品阶为:${obj.grade},境界为${obj.level}`;
  }
  //=============身法增加
  if (obj.type === "身法") {
    //先遍历功法列表,看看有没有相同
    for (const index of PlayerData.movement_technique) {
      if (index.name === obj.name) {
        console.log("身法已经会了");
        return "抱歉,这本身法你已经会了";
      }
    }
    //如果没发现相同,再加进去
    PlayerData.movement_technique.push(obj);
    console.log("成功学会身法");
    UpdatePlayer(id, PlayerData);

    return `已加入新身法!${obj.name},品阶为:${obj.grade},境界为${obj.level}`;
  }
  //=============其他法门增加
  if (obj.type === "其他法门") {
    //先遍历功法列表,看看有没有相同
    for (const index of PlayerData.other_technique) {
      if (index.name === obj.name) {
        console.log("该法门已经会了");
        return "抱歉,这本法门你已经会了";
      }
    }
    //如果没发现相同,再加进去
    PlayerData.other_technique.push(obj);
    console.log("成功学习法门");
    UpdatePlayer(id, PlayerData);

    return `已加入新法门!${obj.name},品阶为:${obj.grade},境界为${obj.level}`;
  }
}

//======================🔴读取用户背包
console.log("成功读取背包");

//💡1, 查询背包
async function query_backpack(id) {
  console.log("进入读取背包工具");
  const backpack = QueryInventory(id);

  return backpack;
}
//💡2,增加物品函数
async function addItem(id, obj) {
  const backpack = QueryInventory(id);
  console.log("成功进入添加物品工具");
  for (const item of backpack) {
    //找到物品
    if (obj.name === item.name) {
      console.log("找到物品");
      item.mount += obj.mount;
      UpdateInventory(id, backpack);
      return `成功加入物品:${obj.name},价值为:${obj.value},数量为:${obj.mount},当前总数为:${item.mount}`;
    }
  }
  //如果遍历完,没找到物品,那就新增
  backpack.push({
    id: Date.now(),
    name: obj.name,
    value: obj.value,
    mount: obj.mount,
  });
  UpdateInventory(id, backpack);

  console.log("成功添加物品", obj.name);
  return `由于没有在物品栏找到物品,所以直接加入新物品:
      成功加入物品:${obj.name},价值:${obj.value},数量为:${obj.mount}`;
}

//💡3,减少物品函数
async function reduceItem(id, obj) {
  let backpack = QueryInventory(id);
  //使用遍历,来做到同类物品堆叠,注意,此处只对一个对象进行操作
  for (const item of backpack) {
    //如果发现同名,就直接把数量相减,然后返回就行
    if (obj.name === item.name) {
      //如果数量不够(即消耗的数量>自己拥有的数量)
      if (obj.mount > item.mount) {
        return `抱歉,道友,你的背包中${obj.name}数量不足,无法使用`;
      }
      item.mount -= obj.mount;
      //如果物品为0了,就从背包中清除
      if (item.mount <= 0) {
        backpack = backpack.filter((i) => i.name !== obj.name);
      }
      UpdateInventory(id, backpack);
      return `成功减少背包物品,失去物品:${obj.name},失去数量:${obj.mount}`;
    }
  }
  //遍历完没有发现同名,直接返回
  return `没有在物品栏中找到${obj.name}`;
}

//=======================================🔴读取历史记录

//💡1, 查询
async function query_history() {
  try {
    const rawhistory = await fs.readFile(
      resolveServerPath("./AiHistoryStores/ChatHistory.json"),
      "utf8",
    );
    const history = JSON.parse(rawhistory);
    return history;
  } catch (err) {
    console.log("fs文件中读取世界观出现错误:", err);
  }
}

//新增历史记录
async function useradd(input) {
  await mutex.lock();
  try {
    const rawhistory = await fs.readFile(
      resolveServerPath("./AiHistoryStores/ChatHistory.json"),
      "utf8",
    );
    const history = JSON.parse(rawhistory);
    history.chatHistory.push({
      id: Date.now(), //唯一标识,必须加,否则无法绑定和渲染
      role: "user",
      content: input ?? "",
    });
    await fs.writeFile(
      //写回,持久化处理
      resolveServerPath("./AiHistoryStores/ChatHistory.json"),
      JSON.stringify(history, null, 2),
      "utf8",
    );
  } catch (err) {
    console.log("后端fs新增user历史记录时报错", err);
    throw err;
  } finally {
    await mutex.unlock();
  }
}

async function assistantadd(input) {
  await mutex.lock();
  try {
    const rawhistory = await fs.readFile(
      resolveServerPath("./AiHistoryStores/ChatHistory.json"),
      "utf8",
    );
    const history = JSON.parse(rawhistory);
    history.chatHistory.push({
      id: Date.now(),
      role: "assistant",
      content: input ?? "",
    });
    await fs.writeFile(
      //写回,持久化处理
      resolveServerPath("./AiHistoryStores/ChatHistory.json"),
      JSON.stringify(history, null, 2),
      "utf8",
    );
  } catch (err) {
    console.log("后端fs新增assistant历史记录时报错", err);
    throw err;
  } finally {
    await mutex.unlock();
  }
}

//======================================🔴读取世界观

async function query_World() {
  try {
    const rawAllData = await fs.readFile(
      resolveServerPath("./StaticData/AllData.json"),
      "utf8",
    );
    const AllData = JSON.parse(rawAllData); //传出的是一个对象,里面的内容为{ AllData:[....] }
    //console.log(AllData);
    return AllData;
  } catch (err) {
    console.log("fs文件中读取世界观出现错误:", err);
  }
}

//======================================🔴读取实体

async function query_AiItems() {
  try {
    const mid = await fs.readFile(
      resolveServerPath("./store/AI_generateItems.json"),
      "utf8",
    );
    const new_items = JSON.parse(mid);
    return new_items;
  } catch (err) {
    console.log("fs文件中读取世界观出现错误:", err);
  }
}

async function Add_AiItems(name) {
  const mid = await fs.readFile(
    resolveServerPath("./store/AI_generateItems.json"),
    "utf8",
  );
  const new_items = JSON.parse(mid);
  new_items.push(name);
  await fs.writeFile(
    //写回,持久化处理
    resolveServerPath("./store/AI_generateItems.json"),
    JSON.stringify(new_items, null, 2),
    "utf8",
  );
}

//======================================🔴状态机

async function query_StateMachina() {
  try {
    const State_mid = await fs.readFile(
      resolveServerPath("./store/user_StateMachina.json"),
      "utf8",
    );
    const StateMachina = JSON.parse(State_mid);
    if (!StateMachina.userInput) StateMachina.userInput = "";
    return StateMachina;
  } catch (err) {
    console.log("fs文件中读取世界观出现错误:", err);
  }
}

async function ChangePlot(newPlot) {
  const State_mid = await fs.readFile(
    resolveServerPath("./store/user_StateMachina.json"),
    "utf8",
  );
  const StateMachina = JSON.parse(State_mid);
  if (!StateMachina.userInput) StateMachina.userInput = "";
  StateMachina.Plot = newPlot;
  await fs.writeFile(
    resolveServerPath("./store/user_StateMachina.json"),
    JSON.stringify(StateMachina, null, 2),
    "utf8",
  );
}

async function ChangeLocation(newLocation) {
  const State_mid = await fs.readFile(
    resolveServerPath("./store/user_StateMachina.json"),
    "utf8",
  );
  const StateMachina = JSON.parse(State_mid);
  if (!StateMachina.userInput) StateMachina.userInput = "";
  const Maps = await query_Map();
  const finder = Maps.find((m) => m.name === newLocation);
  if (finder) {
    console.log("成功找到当前地图!", finder);
    StateMachina.now_location = finder;
    console.log("状态机已更新!");
  } else {
    console.log(
      "抱歉,更新状态机时,没有找到地图,地图状态更新失败,这是地图名:",
      newLocation,
    );
  }
  await fs.writeFile(
    resolveServerPath("./store/user_StateMachina.json"),
    JSON.stringify(StateMachina, null, 2),
    "utf8",
  );
}

async function ChangeUserInput(userinput) {
  const State_mid = await fs.readFile(
    resolveServerPath("./store/user_StateMachina.json"),
    "utf8",
  );
  const StateMachina = JSON.parse(State_mid);
  if (!StateMachina.userInput) StateMachina.userInput = "";
  StateMachina.userInput = userinput;
  await fs.writeFile(
    resolveServerPath("./store/user_StateMachina.json"),
    JSON.stringify(StateMachina, null, 2),
    "utf8",
  );
}

async function AddQueryResult(items) {
  const State_mid = await fs.readFile(
    resolveServerPath("./store/user_StateMachina.json"),
    "utf8",
  );
  const StateMachina = JSON.parse(State_mid);
  if (!StateMachina.userInput) StateMachina.userInput = "";
  StateMachina.QueryResult = items;
  await fs.writeFile(
    resolveServerPath("./store/user_StateMachina.json"),
    JSON.stringify(StateMachina, null, 2),
    "utf8",
  );
}

//======================================🔴读取地图

async function query_Map() {
  try {
    const map_mid = await fs.readFile(
      resolveServerPath("./store/Maps.json"),
      "utf8",
    );
    const Maps = JSON.parse(map_mid);
    return Maps;
  } catch (err) {
    console.log("fs文件中读取世界观出现错误:", err);
  }
}

//新增地图
async function AddMaps(new_map) {
  const map_mid = await fs.readFile(
    resolveServerPath("./store/Maps.json"),
    "utf8",
  );
  const Maps = JSON.parse(map_mid);
  console.log(
    "进入fs文件中的地图修改函数AddMaps,这是读取到的地图,请检查其是否为对象:",
    new_map,
  );

  Maps.push(new_map);
  await fs.writeFile(
    resolveServerPath("./store/Maps.json"),
    JSON.stringify(Maps, null, 2),
    "utf8",
  );
}

//======================================🔴函数测试
if (require.main === module) {
  query_backpack();
  query_playerStats();
}

// ======================================🔴一次性导出所有变量
module.exports = {
  query_history,
  query_World,
  query_AiItems,
  query_StateMachina,
  query_Map,
  AddMaps,
  ChangeLocation,
  ChangePlot,
  Add_AiItems,
  add_Cultivation_Technique,
  add_Technique,
  addItem,
  reduceItem,
  query_backpack,
  query_playerStats,
  useradd,
  assistantadd,
  ChangeUserInput,
  AddQueryResult,
};
