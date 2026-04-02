# Resume Studio Architecture

本文档描述的是当前代码已经实现的系统结构，而不是理想规划。

## 1. 系统边界

Resume Studio 是一个本地优先的 Next.js 16 App Router 应用，围绕以下主链路工作：

1. 登录本地账号
2. 新建或导入简历草稿
3. 在 Studio 中编辑为稳定源简历
4. 生成定制版或优化版
5. 预览、检查、导出 PDF
6. 在 `/resumes` 管理 lineage

默认不扩展到投递跟踪、跟进提醒、面试 CRM 或招聘流程管理。

## 2. 路由地图

### 页面路由

- `/login`
  本地登录 / 注册页。若已登录会重定向到 `/`。
- `/`
  工作台首页，聚合模板中心、草稿库和导入入口。
- `/templates`
  模板中心。按模板分类和作者画像筛选，创建新简历。
- `/import`
  导入工作区。支持 URL、Markdown、纯文本、PDF 四种入口。
- `/resumes`
  简历库。以 master-detail 形式管理源简历、定制版和优化版。
- `/studio/[id]`
  编辑页。支持结构化编辑、Markdown 编辑、AI 辅助、设计调整、导入复核和侧边预览。
- `/studio/[id]/preview`
  预览页。展示质量报告、导出 checklist、岗位匹配分析并执行 PDF 导出。

### API 路由

- `GET /api/resumes`
  读取当前用户的简历摘要列表。
- `POST /api/resumes`
  创建空白、guided 或 template 简历。
- `GET /api/resumes/[id]`
  读取指定简历。
- `PUT /api/resumes/[id]`
  更新指定简历。
- `DELETE /api/resumes/[id]`
  删除指定简历；`?scope=lineage` 可级联删除源简历及其子版本。
- `POST /api/resumes/[id]/duplicate`
  复制简历。
- `POST /api/resumes/[id]/generate-tailored-variant`
  基于岗位信息生成定制版。
- `POST /api/resumes/[id]/generate-optimized-version`
  派生一页或两页优化版。
- `POST /api/resumes/[id]/export-pdf`
  导出 PDF。
- `POST /api/import/portfolio`
  导入 URL、Markdown 或纯文本。
- `POST /api/import/pdf`
  导入 PDF。
- `POST /api/ai/assist`
  生成摘要建议或条目建议。
- `POST /api/ai/summary`
  生成远程摘要。
- `POST /api/ai/health`
  检查远程 AI 连通性。

## 3. Runtime 与框架

- Framework: Next.js 16.2.1 App Router
- UI runtime: React 19
- Styling: Tailwind CSS 4 + 项目自定义样式文件
- Rich text: TipTap
- Drag and drop: dnd-kit
- Validation: Zod
- PDF export: Playwright Chromium
- Tests: Vitest + Playwright

所有页面和 API 路由都明确运行在 `nodejs` runtime；当前没有 Edge runtime 路径。

## 4. 认证模型

当前 Web 应用不是匿名使用模式。

- `/login` 使用本地账号注册和登录
- 用户信息保存在 `data/auth/users/*.json`
- 会话信息保存在 `data/auth/sessions/*.json`
- 会话通过 `resume_studio_session` cookie 维持
- 除 `/login` 外，页面路由通过 `requireAuthContext(...)` 保护
- API 路由通过 `requireApiAuthContext()` 保护
- 第一个注册用户会触发旧版 `data/resumes/*` 数据迁移

## 5. 存储模型

### Web 应用当前主存储

- 数据根：`data/`
- 用户工作区：`data/users/<userId>/`
- 简历目录：`data/users/<userId>/resumes/<resumeId>/`
- 主文档：`document.json`
- 导入原始产物：`imports/*.json`
- 导出副本：`exports/*.pdf`

### 旧版兼容存储

- 旧路径：`data/resumes/<resumeId>/`
- 作用：
  1. 第一个注册用户登录后迁移旧数据
  2. 旧 CLI 脚本仍通过 `src/lib/storage.ts` 读写这个模型

这意味着仓库里当前同时存在“用户隔离 Web 存储”和“旧版单用户 CLI 存储”两套实现。

## 6. 文档模型

当前 canonical document schema 定义在 [`src/types/resume.ts`](../src/types/resume.ts)。

关键字段：

- `meta`
  `id`、`title`、`writerProfile`、`template`、`workflowState`、`updatedAt`、`sourceRefs`
- `basics`
  姓名、标题、联系方式、摘要、链接、照片设置
- `targeting`
  岗位、公司、JD、关键词、备注
- `ai`
  provider、model、baseUrl
- `layout`
  颜色、字体、字号、页边距、段落密度、分栏等排版参数
- `sections`
  `summary`、`experience`、`projects`、`education`、`skills`、`custom`
- `importTrace`
  导入时间、待复核项、字段建议、快照、未映射内容和复核状态

## 7. 模板与作者画像

### 模板

当前模板目录在 `src/data/template-catalog/`，已实现 4 个模板：

- `aurora-grid`
- `campus-line`
- `portfolio-brief`
- `engineer-pro`

### 作者画像

当前 schema 固定 3 个作者画像：

- `experienced`
- `campus`
- `career-switch`

模板中心会根据作者画像给出推荐模板顺序，创建时会把模板和画像写入 `meta.sourceRefs`。

## 8. 导入链路

### Web 导入入口

- URL
  支持单页或多页抓取，可选择规则模式或远程 AI 模式
- Markdown
  通过文本导入接口解析
- 纯文本
  通过文本导入接口解析
- PDF
  通过 `pdfjs-dist` 本地解析

### 导入安全约束

- URL 导入默认只允许公开 http(s) 主机
- 私网 / 本地 URL 需要 `RESUME_STUDIO_ALLOW_PRIVATE_URL_IMPORTS=true`
- 远程 AI Base URL 需要通过白名单校验
- 默认信任的公开 AI Host 定义在 `src/lib/network-safety.ts`
- 额外公开 Host 通过 `RESUME_STUDIO_ALLOWED_AI_HOSTS` 配置
- 生产环境默认禁止私网 AI Host，除非显式设置 `RESUME_STUDIO_ALLOW_PRIVATE_AI_HOSTS=true`

## 9. 编辑、预览与质量系统

### 编辑页

`/studio/[id]` 目前包含这些工作区能力：

- 基础信息编辑
- 分区内容编辑
- Markdown 双模式编辑
- 定向信息编辑
- 模板与设计调整
- AI 配置与 AI 建议
- 导入复核提示
- 自动保存
- 撤销 / 重做
- 侧边预览联动

### 质量与工作台

共享质量规则由 `src/lib/resume-quality.ts` 提供，驱动：

- blocking issues
- warnings
- suggestions
- preview checklist
- export gate

工作台状态由 `src/lib/resume-workbench-types.ts` 提供，当前 workflow state 为：

- `drafting`
- `tailoring`
- `ready`

## 10. 派生版本与 lineage

lineage 信息通过 `meta.sourceRefs` 编码：

- `resume:<parentId>`
- `variant:tailored`
- `variant:optimized`

当前支持两类派生版本：

- 定制版
  从岗位关键词或 JD 中抽取关键词，保留最相关内容，并把缺失关键词写入待处理项
- 优化版
  依据一页或两页目标派生新的 layout / pending review 提示

`/resumes` 使用 lineage 分组展示版本族；源简历删除时可以级联删除整个 lineage。

## 11. AI 能力现状

AI 是可选能力，不是必选依赖。

- provider schema 当前支持 `local` 和 `openai-compatible`
- 新建文档默认会带一个 OpenAI-compatible 配置占位
- 服务端可从这些环境变量取默认密钥：
  `RESUME_STUDIO_AI_API_KEY`、`OPENAI_COMPATIBLE_API_KEY`、`OPENAI_API_KEY`
- 编辑页和导入页都允许用户在客户端填写 API Key
- 若 Base URL 指向本地 Ollama，允许无密钥模式

当前已实现的远程 AI 用途：

- 导入页的 URL 提取增强
- 生成摘要建议
- 生成条目建议
- 定制版生成后尝试补写摘要
- 健康检查

## 12. 脚本与当前现实差异

`package.json` 中的 CLI 脚本仍然可用，但它们基于 `src/lib/storage.ts` 的旧单用户存储实现，不走登录体系，也不直接读写 `data/users/<userId>/...`。

这是当前仓库真实状态，文档需要据此理解：

- Web 产品：多用户、本地账号、按用户隔离存储
- CLI 脚本：旧单用户模型

## 13. 验证基线

日常发布前的验证基线仍然是：

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```
