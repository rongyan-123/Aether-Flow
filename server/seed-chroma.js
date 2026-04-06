const { ChromaClient } = require("chromadb");
const fs = require("fs").promises;
const { pipeline, env } = require("chromadb-default-embed");

// 🔥 禁止联网，强制从本地加载
env.allowRemoteModels = false;
// 🔥 指定本地模型根目录（指向包含 Xenova 文件夹的父目录）
env.localModelPath = "D:/xiuxian/xiuxian/server/models";

//embedding项目地址:https://github.com/chroma-core/chromadb-default-embed
//创建实例
const client = new ChromaClient({ path: "http://localhost:1111" });

async function seed() {
  try {
    // 直接读取 AllData.json 文件
    const raw = await fs.readFile("./StaticData/AllData.json", "utf8");
    const parsed = JSON.parse(raw);
    const dataArray = parsed.AllData; // 现在 dataArray 就是条目数组
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

    //这是一个实现"文本转向量"的函数,embedder
    console.log("正在加载模型...");
    const embedder = await pipeline(
      "feature-extraction",
      "Xenova/bge-small-zh-v1.5",
    );
    console.log("模型加载完成");

    //利用刚刚建立的模型实例,转化向量.
    //这里的output 是一个 Tensor(张量,其实就是一个向量数组,类似 [1, 向量维度])
    console.log("将文本转化为向量");
    const output = await embedder(documents, {
      pooling: "mean",
      normalize: true,
    });
    console.log("转化完成");

    //tolist,张量数组的一个专属方法,可以将复杂的张量转化为一个简单的js数组
    const embeddings = output.tolist();

    //创建集合(可以理解是向量数据库,其中的一个部分,或者说分类1)
    try {
      //每次都删除先前存在的向量,做到同步
      await client.deleteCollection({ name: "cultivation" });
    } catch (e) {
      console.log("集合不存在，无需删除");
    }
    //创建集合
    const collection = await client.createCollection({
      name: "cultivation",
    });

    //导入,此处会自动调用embedding模型,将文本转化为向量
    await collection.add({ ids, embeddings, metadatas, documents });
    console.log(`✅ 成功导入 ${dataArray.length} 个条目`);

    //查询测试
    const queryEmbedding = (
      await embedder("筑基", { pooling: "mean", normalize: true })
    ).tolist()[0]; // 一维数组
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding], // 现在是正确的二维数组
      nResults: 3, //返回最相似的前 3 条结果。
    });

    console.log("查询到的文档：", results.documents);
    console.log("完整返回结果:", JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("出错了：", error);
  }
}

seed().catch(console.error);
module.exports = { seed };

`
清晰的步骤：

1,建立两个实例：

client：连接 ChromaDB 服务器的客户端。

embedder：加载好的模型，用来把文本转向量。

2,准备数据：

从 AllData.json 读取所有条目，得到 ids、documents、metadatas。

用 embedder 批量把 documents 转成向量数组 embeddings（注意这里需要等待，因为模型处理需要时间）。

3,创建集合并存入数据：

用 client 创建或获取集合 cultivation。

调用 collection.add({ ids, embeddings, metadatas, documents })，把数据全部存入。

4,查询测试：

用 embedder 把测试问题转成向量。

用 collection.query 找到最相似的文档，拿到原文和元数据。
`;
