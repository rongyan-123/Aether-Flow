#!/bin/bash

# ========== 配置区域 ==========
PROJECT_DIR="/home/projects/Aether-Flow"
BACKEND_DIR="$PROJECT_DIR/server"
BUILD_OUTPUT="$PROJECT_DIR/dist"
NGINX_STATIC="/var/dist"
PM2_APP_NAME="my-backend"
# =============================

cd "$PROJECT_DIR" || { echo "项目目录不存在！"; exit 1; }

echo "拉取最新代码..."
git pull origin main

echo "安装前端依赖并构建..."
npm install
npm run build

echo "复制前端文件到 Nginx 静态目录..."
sudo rm -rf "$NGINX_STATIC"/*
sudo mkdir -p "$NGINX_STATIC"
sudo cp -r "$BUILD_OUTPUT"/* "$NGINX_STATIC/"

echo "更新后端依赖并重启服务..."
cd "$BACKEND_DIR"
npm install
pm2 restart "$PM2_APP_NAME" || pm2 start server.js --name "$PM2_APP_NAME"
pm2 save

echo "部署完成！"
