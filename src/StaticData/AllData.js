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
    id: "technique_01",
    type: "功法",
    name: "练气诀",
    grade: "黄阶下品",
    maxlimit: "炼气期可修炼，筑基后效果大幅降低",
    obtain_way: "宗门传授、基础功法阁兑换",
    introduction: "基础修炼功法，引导天地灵气入体，稳固气海，提升修为",
    detailed_description: `
    练气诀乃入门修行之法，运转平稳，中正绵长。
    可持续吸纳天地灵气，缓慢淬炼丹田，提升修为积累效率。
    重点:
    最廉价,最普通的修炼法门
    优点在于稳定与安全，突破失败率较低。
    缺点为修炼速度中等，无额外爆发型增益。
    功法大成后，可略微降低低阶战技的灵力消耗。
  `,
  },
  {
    id: "technique_02",
    type: "功法",
    name: "烈阳焚脉功",
    grade: "地阶中品",
    maxlimit: "筑基期及以上可完全发挥",
    obtain_way: "秘境传承、击败火属性妖兽后掉落",
    introduction: "火属性修炼功法，强化灵力爆发与攻击威能",
    detailed_description: `
    烈阳焚脉功以火灵气为主导，修炼后灵力转化为炽热属性。
    提升攻击型战技威力，并增强灵力压制效果。
    在高境界时可显著降低低阶火系战技消耗。
    但修炼过程对经脉负担较大，心境不足者易反噬。
  `,
  },
  {
    id: "technique_03",
    type: "战技",
    name: "八极崩",
    grade: "玄阶下品",
    maxlimit: "炼气三层以上可稳定施展",
    obtain_way: "宗门战技阁",
    introduction: "爆发型近战战技，集中灵力瞬间轰击目标",
    detailed_description: `
        八极崩强调瞬间爆发。
        同境界催动无额外加成。
        高一小境界催动，消耗降低20%。
        高一大境界催动，消耗大幅降低。
        熟练度达到小成时，威力提升15%；
        大成时提升30%；
        圆满时可附带震荡效果。
        无法越境界催动。
      `,
  },
  {
    id: "technique_04",
    type: "战技",
    name: "青锋裂空斩",
    grade: "玄阶中品",
    maxlimit: "筑基期以上效果显著",
    obtain_way: "剑修宗门专属传承",
    introduction: "远程剑气战技，可形成真空裂斩",
    detailed_description: `
    青锋裂空斩以凝聚剑气为核心，远距离斩击敌人。
    威力随灵力精纯度提升而增加。
    大成后可形成二段斩击效果。
    高境界催动时，灵力利用率显著提升。
  `,
  },
  {
    id: "technique_05",
    type: "身法",
    name: "踏云步",
    grade: "黄阶上品",
    maxlimit: "炼气期可修炼，筑基期效果增强",
    obtain_way: "身法卷轴学习",
    introduction: "轻灵型移动身法，提升闪避与移动速度",
    detailed_description: `
    踏云步讲究借力卸力，行走如踏云而行。
    可提升基础速度与闪避率。
    小成后可短暂滞空。
    大成后移动时减少战技施展前摇时间。
  `,
  },
  {
    id: "technique_06",
    type: "其他法门",
    name: "燃血秘术",
    grade: "黄阶上品",
    maxlimit: "任意境界可用，但风险极高",
    obtain_way: "禁术残卷、黑市交易",
    introduction: "以自身精血为代价，短时间大幅提升战力",
    detailed_description: `
    燃血秘术以消耗自身气血与部分修为为代价，
    短时间内提升攻击与速度。
    境界越高，爆发倍率越高。
    但持续结束后进入虚弱状态，
    严重者会造成修为倒退。
  `,
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
  console.log("=== 进入查询函数！要查询的name：", name);
  const result = [];
  if (!name || typeof name !== "string") {
    console.log("⚠️ queryName 接收到无效参数：", name);
    return "抱歉，查询关键字无效，请重新尝试";
  }
  const Name = name.trim();
  //进入for循环遍历所有项,查找对应名字
  for (const index of alldata) {
    console.log("当前查找关键字:", index.name);

    //查找name,type字段,加个问号防报错
    if (
      index.name.includes(Name) ||
      index.type?.includes(Name) ||
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
