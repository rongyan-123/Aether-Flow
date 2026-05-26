import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/xiuxian",
});

// Worldview chunks to inject into every new conversation
export const WORLDVIEW_CHUNKS = [
  {
    content:
      "这是一个天地不仁、弱肉强食、大道独行的修仙世界。修士行事核心准则：谨慎苟活为上，无利不起早，不沾无用因果，财不露白，杀人夺宝是常态。",
    metadata: { category: "core_tone" },
  },
  {
    content:
      "练气期寿元100年、筑基期200年、金丹期500年、元婴期1000年、化神期2000年。境界碾压一切，低阶在高阶面前毫无反抗之力。",
    metadata: { category: "realm_system" },
  },
  {
    content:
      "因果铁则：万事皆有因果。寿元铁则：寿元耗尽必死。战斗铁则：境界碾压一切。",
    metadata: { category: "iron_rules" },
  },
  {
    content: "法宝品质：黄阶(上/中/下)、玄阶、地阶、天阶。品质越高越稀有。",
    metadata: { category: "item_grade" },
  },
  {
    content:
      "青云山脉：人界东部修仙资源丰富区域。外围(练气)、内围(筑基)、核心(金丹+)。常见妖兽：野猪妖、赤练蛇。",
    metadata: { category: "location" },
  },
  {
    content:
      "正道修士重名声道义，表面伪善。魔道修士弱肉强食。中立修士只关心自身利益。",
    metadata: { category: "alignment" },
  },
  {
    content:
      "战斗系统：每回合双方各掷d20骰子 + 战力值。总攻击力高的一方造成差值伤害。差距超10为碾压胜利。",
    metadata: { category: "combat" },
  },
  {
    content:
      "修练系统：每回合修练获得修为值。修为满且心境稳定可突破。突破失败可能走火入魔。",
    metadata: { category: "cultivation" },
  },
  {
    content: "神识决定侦查、威压、抗幻术能力。可通过特殊功法或丹药提升。",
    metadata: { category: "spirit" },
  },
  {
    content:
      "丹药系统：止血丹(回血)、回灵丹(回蓝)、破境丹(突破)、续命丹(延寿)。同种丹药第三次服用效果减半。",
    metadata: { category: "alchemy" },
  },
];

/**
 * Inject worldview chunks into a conversation's vector collection
 */
export async function injectWorldview(conversationId: string) {
  for (const chunk of WORLDVIEW_CHUNKS) {
    await pool.query(
      "INSERT INTO conversation_vectors (conversation_id, content, metadata) VALUES ($1, $2, $3)",
      [conversationId, chunk.content, JSON.stringify(chunk.metadata)],
    );
  }
  console.log(
    "[VectorStore] Injected " +
      WORLDVIEW_CHUNKS.length +
      " worldview chunks into " +
      conversationId,
  );
}

/**
 * Store a vector entry for a conversation
 */
export async function storeVector(
  conversationId: string,
  content: string,
  metadata: Record<string, unknown>,
) {
  await pool.query(
    "INSERT INTO conversation_vectors (conversation_id, content, metadata) VALUES ($1, $2, $3)",
    [conversationId, content, JSON.stringify(metadata)],
  );
}

/**
 * Search vectors within a conversation (top-K similarity)
 * Note: without actual embeddings, we use text similarity as fallback
 */
export async function searchVectors(
  conversationId: string,
  query: string,
  topK: number = 5,
) {
  // For now, use text search as fallback. In production, use pgvector cosine similarity.
  const res = await pool
    .query(
      "SELECT content, metadata FROM conversation_vectors WHERE conversation_id = $1 ORDER BY similarity(content, $2) DESC LIMIT $3",
      [conversationId, query, topK],
    )
    .catch(() => {
      // Fallback: simple LIKE search if pg_trgm not available
      return pool.query(
        "SELECT content, metadata FROM conversation_vectors WHERE conversation_id = $1 AND content ILIKE '%' || $2 || '%' LIMIT $3",
        [conversationId, query, topK],
      );
    });
  return res.rows;
}

/**
 * List all vectors in a conversation
 */
export async function listVectors(conversationId: string) {
  const res = await pool.query(
    "SELECT content, metadata FROM conversation_vectors WHERE conversation_id = $1 ORDER BY id",
    [conversationId],
  );
  return res.rows;
}
