#!/bin/bash
cd /home/projects/Aether-Flow
echo "🐳 启动 ChromaDB..."
docker start chromadb || docker run -d -p 8000:8000 -v $(pwd)/chroma_data:/chroma/chroma --name chromadb chromadb/chroma
echo "📦 启动后端..."
pm2 start ecosystem.config.js || pm2 restart my-backend
echo "🌐 重启 Nginx..."
sudo systemctl restart nginx
echo "🎉 所有服务启动完成！"