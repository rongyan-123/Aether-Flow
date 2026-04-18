#!/bin/bash
echo "拉取最新代码..."
git pull origin main

echo "重新打包前端..."
cd frontend
npm run build
sudo rm -rf /var/dist/*
sudo cp -r dist/* /var/dist/

echo "重启后端..."
cd ../backend
pm2 restart all   # 或者 node server.js 但 pm2 更好

echo "更新完成！"