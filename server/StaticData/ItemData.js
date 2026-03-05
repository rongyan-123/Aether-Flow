//这是物品数据的文件,包括所有功法,物品,法宝,丹药等等
export const allItemdata = [
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
];
export function queryItemName(name) {
  //进入for循环遍历所有项,查找对应名字
  for (const index of allItemdata) {
    if (index.name === name) {
      //此处直接返回物品对象,因为要留给ai解析的
      return index;
    }
  }
  return "抱歉,没有找到相关数据";
}
