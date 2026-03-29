# Resume Studio / 简历工坊

一个专门用来写简历的本地优先项目。它把“结构化起稿、旧简历重建、岗位定制、预览导出”整合进同一套工作流，让这套仓库只服务于简历写作这件事。

## 能力

- 从空白文档开始写主简历，并按岗位或公司复制出多个定制版本
- 支持按 `校招 / 应届`、`有经验求职`、`转岗 / 跨行业` 三种写作档案起稿
- 从 `../portfolio/src/data.ts` 提取内容，生成待编辑简历草稿
- 读取已有 PDF，抽取文字并重建为可编辑文档
- 导入后会汇总待确认内容和未映射信息，方便先清理再继续写
- 支持人工编辑排版、富文本、多级标题、列表、标签和 section/item 排序
- 支持结构化写作诊断，区分阻止导出的硬问题、内容风险和优化建议
- 支持首页直接创建、搜索、复制、删除草稿
- 支持为每份草稿记录目标岗位、目标公司、JD 摘要和 focus keywords，并实时查看关键词覆盖缺口
- 支持根据目标岗位/JD 自动生成一份新的 tailored variant，按关键词优先保留更相关的 sections/items
- 编辑中的草稿会自动保存，并在离开页面前对未落盘内容给出提示
- 支持独立打印预览页与布局诊断提示
- 支持导出前检查，集中确认页眉、摘要、核心经历和版式风险
- 通过同一份 `data/resumes/<id>/document.json` 同时支持 Codex CLI/App 和人工编辑
- 通过 Playwright 生成最终 PDF

## 产品定位

- 首页是“简历写作入口”，不是通用后台
- `Studio` 是“写简历工作台”，不是泛用文档编辑器
- 所有本地数据和导出都围绕简历草稿组织
- 首期聚焦纯本地写作增强，不依赖外部 AI 服务

## 目录

- `src/app/studio/[id]`：编辑工作台
- `src/app/api`：导入、保存、导出接口
- `src/lib`：schema、存储、写作诊断、portfolio 导入、PDF 导入、HTML 预览、PDF 导出
- `scripts`：CLI 命令
- `data/resumes`：本地简历数据、导入产物和导出 PDF 留档
- `docs`：架构与写作工作流说明

## 快速开始

```bash
npm install
npx playwright install chromium
npm run dev
```

访问 `http://localhost:3000`。

首页支持先选择写作档案，再创建主简历、管理多个岗位定制版本；编辑页可打开 `/studio/<id>/preview` 作为独立打印预览。

## 写作工作流

1. 在 Dashboard 选择写作档案，创建引导草稿或导入已有材料。
2. 在 Studio 中先补齐页眉、摘要和核心经历，再处理岗位定制信息。
3. 使用工作台总览与质量诊断，集中消化阻塞项、内容风险和导出风险。
4. 通过导出前检查后，再进入打印预览和 PDF 导出。

## 管理能力

- Dashboard 用于集中管理多份简历草稿，适合按岗位、语言或公司复制出不同版本
- Dashboard 搜索会同时检索目标岗位、目标公司和 focus keywords，方便管理多份定制版本
- 每份简历都保存在 `data/resumes/<id>`，其中 `document.json` 为主文档
- `document.json` 会记录 `schemaVersion` 和 `writerProfile`，旧文档会自动按默认值兼容
- 导出的 PDF 会额外留档到 `data/resumes/<id>/exports`
- Studio 的 `Auto-Tailor Variant` 面板会先展示保留/丢弃计划，再生成新的本地草稿，不会覆盖当前编辑中的版本

## CLI

```bash
# 从 portfolio 生成半成品简历
npm run import:portfolio

# 导入旧 PDF 并重建为可编辑草稿
npm run import:pdf -- ./old-resume.pdf

# 校验当前草稿
npm run validate:resume

# 导出 PDF
npm run export:pdf

# 导出整份简历 markdown
npm run export:markdown

# 从 markdown 文件导入整份简历
npm run import:markdown -- ./resume.md
```

## 验证

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

CI 会执行同一组质量门禁。
