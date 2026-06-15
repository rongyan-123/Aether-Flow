// 小白提示：这个文件是和数据库（Postgres）打交道的，负责把“短文本 + 元数据”写入或读出。
// 在项目里我们把 AI 的“记忆/世界观”当成一堆文本片段（content）和一些附带信息（metadata）存进数据库，方便后续检索。
// 常见函数：storeVector（写入）、searchVectors（检索）、listVectors（列出）和clearVectors（清理）。
// 如果你只是看逻辑，记住：content 是文本，metadata 是一个可以序列化成 JSON 的对象。
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/xiuxian",
});

export const WORLDVIEW_CHUNKS = [
  {
    content:
      "这是一个天地不仁、弱肉强食、大道独行的修仙世界。没有天命之子，没有无偿善意。修士行事核心准则：谨慎苟活为上，无利不起早，不沾无用因果，财不露白，不轻易暴露底牌，遇无把握的风险优先跑路，杀人夺宝是修仙界常态。",
    metadata: { category: "core_tone" },
  },
  {
    content:
      "境界铁则：修为境界严格绑定寿元，境界碾压一切。练气期寿元100年、筑基期200年、金丹期500年、元婴期1000年、化神期2000年。低阶修士在高阶面前毫无反抗之力，寿元耗尽必死无例外。",
    metadata: { category: "realm_system" },
  },
  {
    content:
      "因果铁则：万事皆有因果，沾因果必遭反噬，高阶修士极度避讳无用因果。善意铁则：修仙界无无偿善意，所有帮助馈赠都标好了代价，无事献殷勤必有所图。",
    metadata: { category: "iron_rules" },
  },
  {
    content:
      "功法分天地玄黄四阶每阶分上中下三品。坊市是修士唯一安全交易区，出了坊市无规则约束。机缘伴随致命风险，死亡率远大于获取率。",
    metadata: { category: "world_rules" },
  },
  {
    content:
      "通用货币灵石分下品中品上品极品兑换比例1000:1。核心道具按品阶分为法器宝器灵器古宝通天灵宝。丹药符箓阵法均按天地玄黄四阶分品。",
    metadata: { category: "resources" },
  },
  {
    content:
      "合理性铁则：凡人无灵根不可修炼，低阶修士绝不敢主动挑衅高阶修士，修士不会无故暴露底牌或财富，没有灵根的人不可能莫名其妙修炼到炼气期。",
    metadata: { category: "logic_rules" },
  },
  {
    content:
      "青云山脉：人界东部修仙资源丰富区域。外围练气期、内围筑基期、核心区金丹期以上。常见妖兽：野猪妖、赤练蛇。",
    metadata: { category: "location" },
  },
  {
    content:
      "正道修士重名声道义表面伪善，魔道修士弱肉强食，中立修士只关心自身利益。丹药：止血丹回血、回灵丹回蓝、破境丹突破、续命丹延寿。",
    metadata: { category: "faction" },
  },
];

export async function injectWorldview(conversationId: string) {
  // 小白解释：把预设的世界观片段批量写入到 conversation_vectors 表里，conversationId 是存档/对话的标识。
  for (const chunk of WORLDVIEW_CHUNKS) {
    await pool.query(
      "INSERT INTO conversation_vectors (conversation_id, content, metadata) VALUES ($1, $2, $3)",
      [conversationId, chunk.content, JSON.stringify(chunk.metadata)],
    );
  }
}

export async function storeVector(
  conversationId: string,
  content: string,
  metadata: Record<string, unknown>,
) {
  // 小白提示：把一条文本（content）和它的 metadata（任意键值对）写入数据库。
  // metadata 会被 JSON.stringify 后存进 DB，读取时需要 JSON.parse（上层代码通常会处理）。
  await pool.query(
    "INSERT INTO conversation_vectors (conversation_id, content, metadata) VALUES ($1, $2, $3)",
    [conversationId, content, JSON.stringify(metadata)],
  );
}

export async function searchVectors(
  conversationId: string,
  query: string,
  topK: number = 5,
) {
  // 小白说明：这里做了一个简单的全文模糊匹配（ILIKE），如果查询失败则退化为返回最近的几条记录。
  // 注意：真正的向量相似检索通常会用向量索引库；这里项目以简化方式存储/检索文本片段。
  const res = await pool
    .query(
      "SELECT content, metadata FROM conversation_vectors WHERE conversation_id = $1 AND content ILIKE %$2% LIMIT $3",
      [conversationId, query, topK],
    )
    .catch(() =>
      pool.query(
        "SELECT content, metadata FROM conversation_vectors WHERE conversation_id = $1 LIMIT $2",
        [conversationId, topK],
      ),
    );
  return res.rows;
}

export async function listVectors(conversationId: string) {
  const res = await pool.query(
    "SELECT content, metadata FROM conversation_vectors WHERE conversation_id = $1 ORDER BY id",
    [conversationId],
  );
  return res.rows;
}

export async function clearVectors(conversationId: string) {
  // 小白提示：删除指定 conversationId 的所有向量记录（谨慎调用）。
  await pool.query(
    "DELETE FROM conversation_vectors WHERE conversation_id = $1",
    [conversationId],
  );
}
