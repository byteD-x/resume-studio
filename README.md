# Resume Studio

Resume Studio 是一个基于 Next.js App Router 的本地优先简历工作台。当前代码实现的核心目标，是把原始材料整理成稳定的源简历，再围绕目标岗位生成定制版、做预览检查，并导出 PDF。

## 当前实现概览

- 技术栈：Next.js 16.2.1、React 19、Tailwind CSS 4、TypeScript、Playwright、Vitest
- 访问方式：Web 应用默认要求登录；`/login` 之外的页面和 API 都通过本地账号会话保护
- 数据落盘：本地文件系统持久化，按用户隔离存储
- 建档入口：模板创建、URL 导入、Markdown 导入、纯文本导入、PDF 导入
- 编辑方式：结构化表单编辑 + Markdown 编辑 + 实时预览
- 版本体系：源简历、定制版、优化版通过 lineage 关联管理
- AI 能力：可选的 OpenAI-compatible 远程能力，用于导入增强、摘要建议、条目建议和定制版摘要补写
- 导出：预览页校验通过后生成 PDF，并在本地保存导出副本

## 核心链路

1. 登录或注册本地账号
2. 新建草稿，或从 URL / Markdown / 纯文本 / PDF 导入
3. 在 Studio 中打磨为稳定的源简历
4. 补充岗位定向信息，生成定制版或优化版
5. 在 Preview 中检查阻塞项、质量提示和导出清单
6. 导出 PDF，并回到 `/resumes` 管理 lineage 与下一步动作

默认开发方向应围绕这条链路推进，而不是扩展到投递跟踪、面试 CRM 或招聘流程管理。

## 页面与路由

- `/login`
  登录 / 注册页面。第一个注册用户会自动迁移旧版 `data/resumes` 数据。
- `/`
  工作台首页，入口聚合到模板中心、草稿库和导入页。
- `/templates`
  按作者画像和模板分类选择模板，创建新简历。
- `/import`
  导入工作区，支持 URL、Markdown、纯文本、PDF。
- `/resumes`
  简历库，按 lineage 展示源简历及其定制版 / 优化版，支持派生、复制、删除。
- `/studio/[id]`
  编辑页，包含基础信息、内容、定向、设计、AI、Markdown 和预览工作区。
- `/studio/[id]/preview`
  预览与导出页，展示 checklist、质量报告、岗位匹配分析和 PDF 导出入口。

## 实际数据布局

默认数据根目录是项目下的 `data/`。

- `data/auth/users/*.json`
  本地账号记录，包含邮箱、名称、密码哈希和登录时间。
- `data/auth/sessions/*.json`
  本地会话记录。
- `data/users/<userId>/resumes/<resumeId>/document.json`
  Web 应用实际使用的简历主文档。
- `data/users/<userId>/resumes/<resumeId>/imports/*.json`
  导入原始产物，例如 `portfolio.raw.json`、`pdf.raw.json`。
- `data/users/<userId>/resumes/<resumeId>/exports/*.pdf`
  导出的 PDF 副本。
- `data/resumes/<resumeId>/document.json`
  旧版单用户存储路径，当前仍用于首次迁移以及旧 CLI 脚本。

`RESUME_STUDIO_DATA_DIR` 可以把默认数据目录重定向到其他可写位置。

## 快速开始

```bash
npm install
npx playwright install chromium
npm run dev
```

开发模式默认不再主动预热关键路由；如果你明确需要预编译这些页面，可以在启动前设置 `NEXT_DEV_ROUTE_WARMUP=1`。

然后访问 `http://localhost:3000/login`，注册一个本地账号。

如果项目里已经存在旧版 `data/resumes/*` 数据，第一个注册成功的用户会自动把这些旧数据迁移到自己的工作区下。

## 环境变量

`.env.example` 列出了当前代码已使用的主要环境变量。最常用的是：

- `RESUME_STUDIO_DATA_DIR`
  重定向数据目录。
- `RESUME_STUDIO_AI_API_KEY`
  远程 AI 的默认服务端密钥。
- `OPENAI_COMPATIBLE_API_KEY`
  兼容接口备用密钥。
- `OPENAI_API_KEY`
  兼容 OpenAI 命名的备用密钥。
- `RESUME_STUDIO_ALLOWED_AI_HOSTS`
  额外允许的公开 AI Host 白名单，逗号分隔。
- `RESUME_STUDIO_ALLOW_PRIVATE_AI_HOSTS`
  生产环境下是否允许本地或私网 AI Host。
- `RESUME_STUDIO_ALLOW_PRIVATE_URL_IMPORTS`
  是否允许导入私网或本地 URL。

## 常用命令

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

## CLI 脚本现状

项目里仍保留一组 CLI 脚本：

- `npm run import:portfolio`
- `npm run import:pdf`
- `npm run import:markdown`
- `npm run export:pdf`
- `npm run export:markdown`
- `npm run validate:resume`
- `npm run generate:template-previews`

这些脚本当前仍走 `src/lib/storage.ts` 的旧版单用户存储接口，而不是 Web 应用使用的按用户隔离存储。也就是说，它们描述的是仓库当前实现现状，不代表 Web 端已经回退到单用户模型。

## 已实现的产品边界

- 模板数：4 个
  `aurora-grid`、`campus-line`、`portfolio-brief`、`engineer-pro`
- 作者画像：3 个
  `experienced`、`campus`、`career-switch`
- 工作流状态：3 个
  `drafting`、`tailoring`、`ready`
- 导入模式：
  URL 支持规则提取或 AI 提取；Markdown / 纯文本走文本解析；PDF 走本地解析
- 派生版本：
  定制版通过岗位关键词 / JD 生成；优化版支持一页或两页导向
- 质量门禁：
  预览与导出依赖同一套质量规则；存在阻塞项时不能导出 PDF

## 协作与文档导航

文档地图与仓库协作规范现在统一维护在 [`AGENTS.md`](./AGENTS.md)。
