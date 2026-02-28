export const alldata = [
  {
    id: "elixir_01",
    type: "丹药",
    name: "聚气丹",
    grade: "一品",
    value: 100,
    introduction:
      "一种加快修炼速度的丹药,服用后加速吸收天地灵气，短时间内提升修炼效率",
    detailed_description:
      "聚气丹乃炼气期常见辅助丹药，以凝灵草与清心果为主材炼制而成。丹成之时清香内敛，入口微凉。服下后可引导天地灵气汇聚丹田，使修炼速度大幅提升,持续数个时辰。然药力偏烈，若心境不稳或频繁服用，易使气海震荡，轻则灵力紊乱，重则经脉受损，需谨慎使用。",
  },
  {
    id: "technique_01",
    type: "功法",
    name: "练气篇引导决",
    grade: "一品",
    value: 200,
    introduction: "一种基础修炼功法，引导天地灵气入体，稳固气海，提升修为境界",
    detailed_description:
      "练气诀乃修行之始的入门功法，流传最广，体系平稳中正。修炼时引导天地灵气循经而行，缓缓汇入丹田，打磨气海根基，使灵力逐步凝实。其运转路线简洁，却重在持久与稳固，适合初入修行之人奠定基础。虽无爆发之威，却能稳步提升修为，为日后筑基与转修高阶功法打下坚实根基。",
  },
  {
    id: "attribute_01",
    type: "属性",
    name: "修为",
    maxlimit: "当前境界对应的最大值,即是限制",
    obtain_way: "包括根据功法修炼,吃丹药,使用各种物品等等",
    introduction:
      "衡量修行者境界进展的核心数值，代表对天地灵气的积累与掌控程度",
    detailed_description: `修为乃修行者长期吸纳天地灵气、运转功法后所累积的境界体现，是衡量修行深浅的直接标准。
      修为的增长意味着灵力更加雄浑，经脉更加稳固，对功法的驾驭也愈发精纯。
      修为越高，灵力运转愈加流畅，功法消耗逐步降低，施展威力亦随之提升。
      重点:
      炼气期每积累二百点修为便可突破一层，循序渐进，共分数层；
      待修为总量达到两千点，方可冲击筑基之境。筑基期修为上限为一万点，圆满之后可尝试结丹；
      结丹境界修为上限为十万点，圆满则可窥探元婴之门。
      `,
  },
  {
    id: "attribute_02",
    type: "属性",
    name: "灵力",
    maxlimit: "100",
    obtain_way:
      "包括自然恢复,使用对应功法回复,吃某些恢复灵力的丹药,使用物品等等",
    introduction:
      "修行者体内凝练而成的能量本源，用于驱动功法、催动法术与强化肉身",
    detailed_description: `灵力乃修行者吸纳天地灵气，经功法运转炼化后所形成的内在能量本源，储存于丹田气海之中。
      其质愈纯，其量愈厚，则施展功法与法术时威力愈强。
      灵力不仅可用于攻伐与防御，亦可滋养经脉、淬炼肉身，是一切修行体系的根基所在。
      重点:
      在同等级境界下催动对应功法时，不额外产生消耗或威力加成；
      若以当前境界催动低一个小境界的功法，则因掌控力更强，灵力消耗固定降低20%。
      若跨越一个大境界催动更低层次功法，灵力压制效果显著，消耗可大幅下降，通常减少100%至1000%不等，具体数值视功法品阶与灵力精纯度而定。
      然而，灵力尚未达到对应层次者，无法强行催动高于自身境界的功法，否则运转即刻失控，难以施展。`,
  },

  {
    id: "map_01",
    type: "地图",
    name: "魔兽山脉",
    danger_grade: "高危",
    local: "大陆中央,青云宗旁边",
    introduction: "危险的地方",
    detailed_description: "还没想好",
  },
];
export function queryName(name) {
  console.log("=== queryName 被调用了！传入的 name：", name);
  const result = [];
  const Name = name.trim();
  //进入for循环遍历所有项,查找对应名字
  for (const index of alldata) {
    console.log("当前查找关键字:", index.name);

    //查找name,type字段,加个问号防报错
    if (
      index.name.includes(Name) ||
      index.type.includes(Name) ||
      index.local?.includes(Name)
    ) {
      console.log("在字段name,type,local中找到!!");
      //此处直接返回物品对象,因为要留给ai解析的
      result.push(`成功找到对应原文:${JSON.stringify(index, null, 2)}`);
    }

    //查找detailed_description字段,加个问号防报错
    if (index.detailed_description?.includes(Name)) {
      console.log("在字段detailed_description中找到!!");
      result.push(`成功找到对应原文:${JSON.stringify(index, null, 2)}`);
    }
  }
  console.log("当前原文包括:", result);

  if (result.length === 0) {
    return "抱歉,没有找到相关数据";
  }

  return `成功找到对应原文:${JSON.stringify(result, null, 2)}`;
}
