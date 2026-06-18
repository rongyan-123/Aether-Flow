## 1. 记录当前状态

- [ ] 1.1 列出根目录完整文件清单，保存为 `_cleanup_snapshot.txt`
- [ ] 1.2 确认 xiuxian-v2 内文件不依赖根目录旧文件

## 2. 删除 v1 旧代码目录

- [ ] 2.1 删除 `src/`（Vue v1 源码）
- [ ] 2.2 删除 `server/`（Python v1 后端，约 1.4GB）
- [ ] 2.3 删除 `dist/`（v1 构建产物）
- [ ] 2.4 删除 `public/`（v1 静态资源）
- [ ] 2.5 删除 `store/`（v1 数据存储）
- [ ] 2.6 删除 `docs/`（v1 文档）
- [ ] 2.7 删除 `venv/`（v1 Python 虚拟环境）
- [ ] 2.8 删除 `chroma-data/`（v1 向量数据库）
- [ ] 2.9 删除 `node_modules/`（v1 npm 依赖）

## 3. 删除 v1 配置和脚本文件

- [ ] 3.1 删除 `package.json`、`package-lock.json`
- [ ] 3.2 删除 `vue.config.js`、`babel.config.js`、`jsconfig.json`
- [ ] 3.3 删除 `ecosystem.config.js`、`requirements.txt`
- [ ] 3.4 删除 `.env.development`、`start.sh`、`updata.sh`、`ps.js`

## 4. 删除临时文件和冗余资源

- [ ] 4.1 删除 `.playwright-mcp/`
- [ ] 4.2 删除根目录 `.png` 图片文件
- [ ] 4.3 删除根目录 `.claude/`（空壳，已被 xiuxian-v2/.claude 取代）

## 5. 验证与收尾

- [ ] 5.1 运行 `git status` 确认所有删除正确
- [ ] 5.2 验证 `.git/` 完整，git log 正常
- [ ] 5.3 验证 xiuxian-v2 项目可正常构建（`npm run build`）
- [ ] 5.4 验证 `xiuxian-v2/.claude/commands/opsx/` 中 5 个命令文件存在
- [ ] 5.5 验证根目录只保留必要文件（.git, README.md, LICENCE, .gitignore, API文档）
- [ ] 5.6 检查并更新 CLAUDE.md 中的路径引用
