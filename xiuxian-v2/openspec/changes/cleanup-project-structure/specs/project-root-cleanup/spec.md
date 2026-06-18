## ADDED Requirements

### Requirement: 根目录旧文件删除
系统 SHALL 从仓库根目录 `D:\xiuxian\xiuxian\` 删除所有 v1 旧项目文件和生成文件，仅保留 v2 项目所需的最小文件集。

#### Scenario: 删除 v1 源代码
- **WHEN** 执行清理操作
- **THEN** 以下目录被删除：`src/`、`server/`、`dist/`、`public/`、`store/`、`docs/`、`venv/`、`chroma-data/`、`node_modules/`

#### Scenario: 删除 v1 配置文件
- **WHEN** 执行清理操作
- **THEN** 以下文件被删除：`package.json`、`package-lock.json`、`vue.config.js`、`babel.config.js`、`jsconfig.json`、`ecosystem.config.js`、`requirements.txt`、`.env.development`、`start.sh`、`updata.sh`、`ps.js`

#### Scenario: 删除临时文件和图片
- **WHEN** 执行清理操作
- **THEN** `.playwright-mcp/` 及所有 `.png` 图片文件从根目录删除

#### Scenario: 保留必要文件
- **WHEN** 执行清理操作
- **THEN** `.git/`、`xiuxian-v2/`、`README.md`、`LICENCE`、`.gitignore`、`核心技术架构与 API 接口文档 V1 0 *.md` 保持不变

### Requirement: OpenSpec 斜杠命令可用
系统 SHALL 确保 OpenSpec 的 `/opsx:*` 斜杠命令能被 Claude Code 正确发现和执行。

#### Scenario: 命令文件存在
- **WHEN** 检查 `xiuxian-v2/.claude/commands/opsx/`
- **THEN** 以下命令文件存在且内容完整：`explore.md`、`propose.md`、`apply.md`、`archive.md`、`sync.md`

#### Scenario: Claude Code 可发现命令
- **WHEN** Claude Code 的 CWD 包含 `.claude/commands/opsx/` 目录
- **THEN** `/opsx:explore`、`/opsx:propose`、`/opsx:apply`、`/opsx:archive`、`/opsx:sync` 均可正常调用

### Requirement: CLAUDE.md 路径引用更新
系统 SHALL 更新 CLAUDE.md 中引用根目录的路径，使其指向正确位置。

#### Scenario: 项目路径更新
- **WHEN** 清理完成后检查 CLAUDE.md
- **THEN** 所有引用的文件路径指向实际存在的位置
