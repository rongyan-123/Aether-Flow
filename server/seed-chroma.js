const { ChromaClient } = require("chromadb");
const fs = require("fs");

//创建实例
const client = new ChromaClient({ path: "http://localhost:1111" });

let embeddingPipeline;
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    // 替换为你的本地模型路径
    const modelPath = "D:/models/bge-small-zh-v1.5"; // ⚠️ 请修改为你的实际路径
    embeddingPipeline = await pipeline("feature-extraction", modelPath);
  }
  return embeddingPipeline;
}

async function seed() {
  // 直接读取 AllData.json 文件
  const raw = fs.readFileSync("./StaticData/AllData.json", "utf8");
  const parsed = JSON.parse(raw);
  const dataArray = parsed.AllData; // 现在 dataArray 就是条目数组

  //创建集合(可以理解是向量数据库,其中的一个部分,或者说分类1)
  const collection = await client.getOrCreateCollection({
    name: "cultivation",
  });

  //遍历数据库,收集数据
  const ids = dataArray.map((item) => item.id);
  const documents = dataArray.map((item) => item.detailed_description); //主要向量数据
  const metadatas = dataArray.map((item) => ({
    name: item.name,
    type: item.type,
    maxlimit: item.maxlimit,
    obtain_way: item.obtain_way,
    introduction: item.introduction,
  })); //元数据

  //导入,此处会自动调用embedding模型,将文本转化为向量
  await collection.add({ ids, documents, metadatas });
  console.log(`✅ 成功导入 ${dataArray.length} 个条目`);

  //查询测试
  const results = await collection.query({
    queryTexts: ["筑基"],
    nResults: 3,
  });
  console.log(results.documents);
}

seed().catch(console.error);
module.exports = { seed };
