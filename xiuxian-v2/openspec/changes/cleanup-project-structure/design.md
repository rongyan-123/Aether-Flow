## Context

当前项目仓库根目录 `D:\xiuxian\xiuxian\` 混合了 v1（Vue.js + Python FastAPI）和 v2（Next.js）两代代码。v2 全部位于 `xiuxian-v2/` 子目录。Claude Code 的 CWD 是根目录，因此 `.claude/commands/opsx/`（位于 `xiuxian-v2/.claude/`）对 Claude Code 不可见，导致 `/opsx:*` 全部报未知命令。

此外根目录 v1 文件占用约 3GB+ 磁盘空间（主要来自 `server/` 1.4GB、`venv/`、`chroma-data/`、`node_modules/`）。

## Goals / Non-Goals

**Goals:**
- 删除根目录所有 v1 旧文件
- 确保 `.git/` 不受影响，git 历史完整
- 使 `/opsx:*` 命令可用（通过将 CWD 切到 `xiuxian-v2/`）
- 更新 CLAUDE.md 中引用根目录的路径

**Non-Goals:**
- 不修改 xiuxian-v2 内部代码
- 不改动 git 历史（不 rebase、不 squash）
- 不修改 `.gitignore`
- 不重新组织结构（xiuxian-v2 内部结构不变）

## Decisions

### 决策 1：删除 vs 移动到备份目录

**选择**：直接删除（通过 git rm / rm）

**理由**：
- v1 代码已在 git 历史中，可随时恢复
- 磁盘空间回收明确
- 不需要维护备份目录

**备选方案**：移动到 `_legacy/` 备份。但既然 git 有完整历史，多存一份无意义。

### 决策 2：CWD 切换策略

**选择**：当前不强制切换 CWD，先在 `xiuxian-v2/.claude/` 中完善配置。

**理由**：
- Claude Code CWD 由启动时的目录决定
- 根目录仍需保留 `.git/`、`.claude/`（用于全局配置）、`README.md`、API 文档
- 可通过项目级 `xiuxian-v2/.claude/settings.local.json` 配置 context

**实际效果**：Claude Code 仍从根目录启动，但通过更新其配置引用 xiuxian-v2 路径。OpenSpec 斜杠命令需要在 xiuxian-v2 内才能工作 — 理想方案是把根目录缩减为仅含 `.git/` + README + 文档的轻量壳。

### 决策 3：哪些根目录文件保留

| 保留 | 原因 |
|------|------|
| `.git/` | 仓库历史 |
| `xiuxian-v2/` | 当前项目 |
| `README.md` | 项目说明 |
| `LICENCE` | 许可证 |
| `核心技术架构与 API 接口文档 V1 0 ....md` | CLAUDE.md 引用 |
| `babel.config.js` | 不确定是否被 xiuxian-v2 使用 |

不确定的用 `git rm` 删除（git 历史可恢复）。

## Risks / Trade-offs

- **风险**：误删 xiuxian-v2 需要的文件 → **缓解**：xiuxian-v2 依赖都在 `xiuxian-v2/node_modules` 和 `xiuxian-v2/package.json`，根目录文件经确认都是 v1 的
- **风险**：`.gitignore` 中可能有重要规则 → **缓解**：不删除 `.gitignore`
- **风险**：删除后无法 undo（除 git restore 外）→ **缓解**：所有文件从 git 跟踪，git checkout 可恢复
