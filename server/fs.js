const fs = require("fs");

//==========================🔴读取用户面板
const rawData = fs.readFileSync("./store/PlayerData.json", "utf8");
const PlayerData = JSON.parse(rawData);

//======================🔴读取用户背包
const rawInventory = fs.readFileSync("./store/inventory.json", "utf8");
const backpack = JSON.parse(rawInventory);
console.log("成功读取背包");
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
const AllData = JSON.parse(rawAllData);
//console.log(AllData);

// ======================================🔴一次性导出所有变量
module.exports = {
  PlayerData,
  backpack,
  history,
  AllData,
  addItem,
  useradd,
  assistantadd,
};
