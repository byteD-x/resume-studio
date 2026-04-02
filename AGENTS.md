# Resume Studio Repository Guide

本文件是本仓库的入口地图与执行契约，适用于自动化 Agent 与人工协作者。

定位原则：

- `AGENTS.md` 负责说明如何在仓库中工作
- `README.md` 负责说明产品是什么、如何启动
- `docs/` 负责承载更具体、可演进的事实文档

这份文件按 Harness Engineering 思路编排：把上下文、约束、反馈与清理机制写成可执行协作规范，而不是写成一份无法维护的大型说明书。

## 1. Goals

- 目标是持续强化 Resume Studio 的核心链路：建稿 / 导入 -> 打磨源简历 -> 岗位定向 -> 预览 -> 导出 -> lineage 管理
- 所有改动都必须尽量满足：可验证、可回滚、可审计
- 默认优先小改动、低风险路径、与当前架构一致的实现
- 不把产品默认方向带偏到 application tracking、follow-up reminders、interview CRM、recruiting pipeline management

## 2. Operating Model

- Humans steer, agents execute
- 先确认事实，再修改代码或文档
- 发现约束缺失、规则漂移、重复人工判断时，优先把它沉淀进仓库，而不是依赖一次性口头说明
- 代理失败不是只修当前任务的信号，而是补足上下文、工具、验证或约束的信号

## 3. Document Map

文档地图从 `README.md` 迁移到这里维护。阅读顺序按任务选择。

- [`README.md`](./README.md)
  产品概览、快速开始、运行方式、环境变量、当前实现边界
- [`docs/architecture.md`](./docs/architecture.md)
  路由、API、存储、认证、数据模型、导入链路、AI 约束、lineage
- [`docs/writing-workflow.md`](./docs/writing-workflow.md)
  作者画像、建稿入口、写作顺序、定制版 / 优化版策略、Preview 与 `/resumes` 职责
- [`package.json`](./package.json)
  以脚本为准的构建、测试、导入导出命令
- [`playwright.config.ts`](./playwright.config.ts)
  E2E 运行方式、测试基准地址、Playwright 临时数据目录
- [`.env.example`](./.env.example)
  当前已支持的环境变量

当任务与上述任一主题相关时，优先读取对应文件，不要只依赖 `AGENTS.md` 的摘要。

## 4. Repo Facts

- Framework: Next.js 16.2.1 App Router
- UI: React 19
- Styling: Tailwind CSS 4 + repo-local CSS files
- Validation: Zod
- Rich text: TipTap
- DnD: dnd-kit
- Unit tests: Vitest
- E2E tests: Playwright
- PDF export: Playwright Chromium
- CI: GitHub Actions workflow in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)
- Canonical package manager for install/CI: `npm`

说明：

- 仓库同时存在 `package-lock.json` 和 `yarn.lock`
- 但 CI 使用 `npm ci`，本仓库的验证命令也应以 `npm run ...` 为准

## 5. Product Reality

当前代码实现的关键现实约束如下：

- Web 应用默认要求认证；`/login` 是唯一公开入口
- 页面路由与 API 路由普遍通过 `requireAuthContext(...)` / `requireApiAuthContext()` 保护
- Web 端数据按用户隔离，主存储位于 `data/users/<userId>/resumes/<resumeId>/`
- 本地账号与会话存储位于 `data/auth/`
- 旧版 `data/resumes/<resumeId>/` 仍然存在，但当前只用于迁移和旧 CLI 脚本
- `/import` 当前支持 URL、Markdown、纯文本、PDF
- `/resumes` 负责 lineage、准备度与下一步动作，不负责 CRM 式流程管理
- 派生版本分为 tailored variant 和 optimized version
- 远程 AI 是可选能力，不是产品前提

## 6. Harness Engineering Alignment

### 6.1 Context Engineering

上下文工程要求“给地图，不给一大坨说明书”。

在本仓库中，这意味着：

- `AGENTS.md` 是入口地图，不是百科全书
- 详细事实应落在 `README.md`、`docs/architecture.md`、`docs/writing-workflow.md`
- 新增规则时，优先放到最接近事实来源的位置；`AGENTS.md` 只保留入口级约束
- 当某一类规则开始变长、变细、变频繁时，应继续下沉到 `docs/`，不要把 `AGENTS.md` 重新写成巨型手册
- 修改系统行为后，必须同步更新对应事实文档，避免仓库知识与代码分叉
- 不要把一次性任务细节长期留在 `AGENTS.md`
- 不要通过无限堆叠“提示词式规则”解决结构性问题

执行要求：

- 改代码前先定位要读的文档
- 改完后判断是否触发文档更新
- 如果某个规则需要反复提醒，优先升级为代码、测试、lint、脚本或文档结构，而不是下次再口头提醒

### 6.2 Architecture Constraints

架构约束不是建议，而是 agent throughput 上来之后的防腐层。

本仓库必须遵守的架构边界：

- 不把匿名模式重新引入 Web 主流程
- 不混淆用户隔离存储与旧版单用户存储
- 新功能默认应围绕源简历、定制版、优化版、预览导出、lineage 展开
- 不让 `/resumes` 承担“编辑页的大杂烩职责”
- 不让多个不相关任务堆到同一屏
- 不绕过 `src/lib/network-safety.ts` 中的 URL / AI Host 安全边界
- 不把远程 AI 假定为总是可用；必须保留无远程 AI 时的基本可用性
- 不在没有明确依据的情况下突破当前文档模型、workflow state、route responsibility

Next.js 特别约束：

- 本仓库使用的是有 breaking changes 的 Next.js 16，不要按旧版 Next.js 经验直接写
- 修改框架相关行为前，先阅读 `node_modules/next/dist/docs/` 中与该主题相关的文档

### 6.3 Feedback Loops

反馈循环必须在仓库内部闭环，而不是停留在“做完再看看”。

执行节奏：

1. 开始前
   明确任务边界、涉及页面 / API / 数据路径、验证方式和回滚点
2. 实施中
   每完成一个子步骤就做最小验证，不累计未知风险
3. 结束前
   运行与改动匹配的验证命令，并明确哪些没覆盖
4. 失败时
   先找缺失的是上下文、约束、工具、测试还是实现；修系统，不只修表面症状

必须落地的反馈源：

- 代码编译与类型检查
- 单元测试
- E2E 流程测试
- 路由与 UI 行为复现
- 文档与实现的一致性检查
- 用户或 reviewer 的反馈

当 reviewer 或用户指出重复性问题时：

- 首先考虑把问题编码进测试、lint、文档或脚本
- 不要满足于“这次改对了，下次靠记忆”

### 6.4 Garbage Collection

垃圾回收在这里指持续清理漂移、陈旧和 AI 放大的坏模式。

需要持续警惕的对象：

- 失真的文档描述
- 无人维护的规则
- 死代码、死样式、死分支
- 旧实现与新实现并存但没有边界说明的区域
- 重复 helper、猜测性数据访问、绕过边界校验的代码
- 与 CI 或真实启动方式不一致的本地约定

本仓库的重点清理对象：

- `data/resumes` 旧存储与 `data/users/...` 新存储的认知混淆
- 文档中对匿名访问或单用户模型的过时描述
- 与实际 API / 页面职责不一致的产品描述
- 风格或结构漂移导致的编辑器、预览、导入链路可读性下降

处理原则：

- 小步、持续、机械化清理优于“大扫除式重构”
- 能删就删，不能删就显式标注边界
- 触达某个漂移区域时，顺手把最明显的历史垃圾一起清掉，但不要借机无限扩 scope

## 7. Change Policy

- 先读后改：先确认真实实现，再动手
- 单一目的：一次改动尽量只解决一个清晰问题
- 最小表面：不要做和当前目标无关的重构
- 不猜完成：未验证就不能写成“已完成”
- 不覆盖用户改动：工作区可能是脏的，禁止回滚非本人改动
- 高风险操作默认禁止，尤其是强制删除、硬重置、覆盖历史

## 8. Validation Gates

发布前基线以 CI 为准，顺序如下：

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

验证规则：

- 文档改动至少要做“文档与代码事实交叉核对”
- 逻辑改动至少要跑与改动最相关的命令
- 路由、表单、导入、预览、导出、auth 相关改动，优先补或运行 Playwright
- 若因时间、环境或范围限制未跑全量验证，必须显式说明

## 9. Repo-Specific Work Rules

### 9.1 Auth and Storage

- 任何涉及 resume 读写的改动，都要先确认自己改的是 `src/lib/user-storage.ts` 还是 `src/lib/storage.ts`
- Web 端功能优先围绕用户隔离存储实现
- 若必须触及旧 CLI 存储实现，要在提交说明和文档里明确其与 Web 主流程的关系

### 9.2 Import and AI

- URL 导入、远程 AI Base URL、私网访问都受 `src/lib/network-safety.ts` 约束
- 不要绕过 Host allowlist 或私网访问开关
- 设计 AI 功能时，必须考虑无密钥、无远程服务、Ollama、本地规则模式等降级场景

### 9.3 Product Scope

- 新功能默认优先增强以下一项：
  draft creation、source resume stabilization、targeting clarity、preview readiness、PDF export confidence、lineage management
- 如果一个页面开始堆多个不相关任务，优先拆解信息架构，而不是继续堆组件

### 9.4 Docs and Knowledge

- 行为变化必须同步更新最接近事实来源的文档
- 文档写“当前实现”，不要写成“未来设想”
- 当 README、AGENTS、`docs/` 描述冲突时，应立即修正，而不是留待以后

## 10. Review Checklist

开始前：

- 我是否已经读过相关事实文档
- 我是否知道影响哪些页面、API、数据路径、测试
- 我是否知道如何验证与如何回滚

执行中：

- 我是否每一步都做了最小验证
- 我是否引入了新的重复规则或上下文债务
- 我是否无意中扩大了范围

结束前：

- 我是否更新了受影响文档
- 我是否说明了验证结果和未覆盖项
- 我是否把 recurring issue 沉淀进仓库，而不是留给下次重复踩坑
