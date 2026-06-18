## Why

根目录 `D:\xiuxian\xiuxian\` 残留 v1 旧项目文件（Vue + Python），与新项目 `xiuxian-v2`（Next.js）并存，导致目录混乱、OpenSpec 斜杠命令无法发现、磁盘空间浪费。需要清理根目录旧文件，确立 xiuxian-v2 为唯一项目。

## What Changes

- **删除** 根目录 v1 旧代码：`src/`、`server/`、`dist/`、`public/`、`store/`、`docs/`、`venv/`、`chroma-data/`、`node_modules/`
- **删除** 根目录 v1 配置文件：`package.json`、`package-lock.json`、`vue.config.js`、`babel.config.js`、`jsconfig.json`、`ecosystem.config.js`、`requirements.txt`、`.env.development`、`start.sh`、`updata.sh`、`ps.js`
- **删除** 根目录临时/生成文件：`.playwright-mcp/`、`1e2a50ea6feb42a7a55303c6a95c54fb.png` 等图片文件
- **删除** 根目录 `.claude/`（空壳，已被 xiuxian-v2/.claude 取代）
- **保留** 根目录 `.git/`（不改动 git 历史）、`核心技术架构与 API 接口文档 V1 0 ....md`（CLAUE.md 引用）、`README.md`、`LICENCE`
- **BREAKING**: CWD 需切换至 `xiuxian-v2/`，使 `.claude/commands/opsx/` 能被 Claude Code 发现，OpenSpec `/opsx:*` 命令恢复正常
- **同步更新** CLAUDE.md 和项目文件说明中的路径引用

## Capabilities

### New Capabilities
- `project-root-cleanup`: 清除根目录 v1 残留文件，磁盘空间回收，目录结构简化

### Modified Capabilities
<!-- None - 不影响任何现有 capability -->

## Impact

- 根目录 `D:\xiuxian\xiuxian\` 约 3GB+ 旧文件被删除
- `.git/` 保持完整，git 历史不受影响
- CLAUDE.md 中的路径引用需检查更新
- OpenSpec `/opsx:*` 命令生效前提：Claude Code CWD 设为 `xiuxian-v2/`
