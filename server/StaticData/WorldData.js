//这是有关世界观的所有数据,包括地图,势力,设定,秘境等等
export const allWorlddata = [];
export function queryWorldName(name) {
  console.log("=== queryWorldName 被调用了！传入的 name：", name);

  const Name = name.trim();
  //进入for循环遍历所有项,查找对应名字
  for (const index of allWorlddata) {
    console.log("当前查找设定:", index.name);
    if (index.name.includes(Name)) {
      console.log("找到设定!");
      //此处直接返回物品对象,因为要留给ai解析的
      return `成功找到设定:${index}`;
    }
  }
  return "抱歉,没有找到相关数据";
}
