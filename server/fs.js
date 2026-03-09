const fs = require("fs");

//==========================🔴读取用户面板
const rawData = fs.readFileSync("./store/PlayerData.json", "utf8");
const PlayerData = JSON.parse(rawData);

//💡1,读取面板
function query_playerStats() {
  console.log("进入读取面板工具");
  console.log("面板如下:", PlayerData);
  return `用户面板如下:${JSON.stringify(PlayerData, null, 2)}`;
}

//💡2,增加修炼功法
function add_Cultivation_Technique(obj) {
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
  fs.writeFileSync(
    //写回背包文件,持久化处理
    "./store/PlayerData.json",
    JSON.stringify(PlayerData, null, 2),
    "utf8",
  );
  return `已加入新功法!${obj.name},品阶为:${obj.grade}`;
}

//💡3, 增加技艺
function add_Technique(obj) {
  console.log("成功进入增加技艺工具");
  console.log("当前技艺:", obj);
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
    fs.writeFileSync(
      //写回背包文件,持久化处理
      "./store/PlayerData.json",
      JSON.stringify(PlayerData, null, 2),
      "utf8",
    );
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
    fs.writeFileSync(
      //写回背包文件,持久化处理
      "./store/PlayerData.json",
      JSON.stringify(PlayerData, null, 2),
      "utf8",
    );
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
    fs.writeFileSync(
      //写回背包文件,持久化处理
      "./store/PlayerData.json",
      JSON.stringify(PlayerData, null, 2),
      "utf8",
    );
    return `已加入新法门!${obj.name},品阶为:${obj.grade},境界为${obj.level}`;
  }
}

//======================🔴读取用户背包
const rawInventory = fs.readFileSync("./store/inventory.json", "utf8");
const backpack = JSON.parse(rawInventory);
console.log("成功读取背包");

//💡1, 查询背包
function query_backpack() {
  console.log("进入读取背包工具");
  console.log("背包内物品如下:", backpack);
  return `背包内物品如下:${JSON.stringify(backpack, null, 2)}`;
}

//💡2,增加物品函数
function addItem(obj) {
  console.log("成功进入添加物品工具");
  for (const item of backpack) {
    //找到物品
    if (obj.name === item.name) {
      console.log("找到物品");
      item.mount += obj.mount;
      fs.writeFileSync(
        //写回背包文件,持久化处理
        "./store/inventory.json",
        JSON.stringify(backpack, null, 2),
        "utf8",
      );
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
  fs.writeFileSync(
    //写回背包文件,持久化处理
    "./store/inventory.json",
    JSON.stringify(backpack, null, 2),
    "utf8",
  );
  console.log("成功添加物品", obj.name);
  return `由于没有在物品栏找到物品,所以直接加入新物品(这句话不要给用户):
      成功加入物品:${obj.name},价值:${obj.value},数量为:${obj.mount}`;
}

//💡3,减少物品函数
function reduceItem(obj) {
  //使用遍历,来做到同类物品堆叠,注意,此处只对一个对象进行操作
  for (const item of backpack.data) {
    //如果发现同名,就直接把数量相减,然后返回就行
    if (obj.name === item.name) {
      //如果数量不够(即消耗的数量>自己拥有的数量)
      if (obj.mount > item.mount) {
        return `抱歉,道友,你的背包中${obj.name}数量不足,无法使用`;
      }
      item.mount -= obj.mount;
      //如果物品为0了,就从背包中清除
      if (item.mount <= 0) {
        backpack.data = backpack.data.filter((i) => i.name !== obj.name);
      }
      fs.writeFileSync(
        //写回背包文件,持久化处理
        "./store/inventory.json",
        JSON.stringify(backpack, null, 2),
        "utf8",
      );
      return `成功减少背包物品,失去物品:${obj.name},失去数量:${obj.mount}`;
    }
  }
  //遍历完没有发现同名,直接返回
  return `没有在物品栏中找到${obj.name}`;
}

//=======================================🔴读取历史记录 ,开发阶段,为节省token,暂时不保存到本地
const rawhistory = fs.readFileSync(
  "./AiHistoryStores/ChatHistory.json",
  "utf8",
);
const history = JSON.parse(rawhistory);
//新增历史记录
function useradd(input) {
  history.chatHistory.push({
    id: Date.now(), //唯一标识,必须加,否则无法绑定和渲染
    role: "user",
    content: input,
  });
}

function assistantadd(input) {
  history.chatHistory.push({
    id: Date.now(),
    role: "assistant",
    content: input,
  });
}

//======================================🔴读取世界观
const rawAllData = fs.readFileSync("./StaticData/AllData.json", "utf8");
const AllData = JSON.parse(rawAllData); //传出的是一个对象,里面的内容为{ AllData:[....] }
//console.log(AllData);

//======================================🔴函数测试
if (require.main === module) {
  query_backpack();
  query_playerStats();
}

// ======================================🔴一次性导出所有变量
module.exports = {
  PlayerData,
  backpack,
  history,
  AllData,
  add_Cultivation_Technique,
  add_Technique,
  addItem,
  reduceItem,
  query_backpack,
  query_playerStats,
  useradd,
  assistantadd,
};
