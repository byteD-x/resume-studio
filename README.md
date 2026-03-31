# Resume Studio

本地优先的简历工作台，专注于把原始材料整理成主稿，按岗位生成定制版，并导出 PDF。

## 核心链路

1. 建稿：模板、空白引导、作品集 / Markdown / PDF 导入，或从简历库继续已有草稿
2. 打磨主稿：在 Studio 中补齐基础信息、摘要、经历、项目、技能
3. 岗位定向：补岗位、公司、JD、关键词，并基于主稿生成定制版
4. 预览检查：在 Preview 中查看阻塞项、建议优化和岗位匹配
5. 导出交付：导出 PDF，并回到简历库继续管理主稿与定制版

后续开发默认围绕这条链路推进。

## 核心功能

- 多入口建稿
- 本地优先存储与自动保存
- 结构化编辑器与 Markdown 模式
- 岗位定向与定制版生成
- 主稿 / 定制版谱系管理
- 预览、导出检查与 PDF 导出
- 编辑历史：撤销、重做、最近编辑

## 非目标

默认不扩展到以下方向，除非用户明确要求：

- 投递管理 / 跟进提醒 / 面试 CRM
- 与简历产出无关的泛文档协作能力
- 偏离“建稿 -> 定向 -> 预览 -> 导出”主链路的周边系统

## 快速开始

```bash
nvm use
npm install
npx playwright install chromium
npm run dev
```

访问 `http://localhost:3000`。

## 常用验证

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

## 文档地图

- [`docs/architecture.md`](./docs/architecture.md)：系统结构、核心路由、数据模型、验证边界
- [`docs/writing-workflow.md`](./docs/writing-workflow.md)：写作策略、作者画像、质量规则
- [`AGENTS.md`](./AGENTS.md)：协作约束，要求后续开发围绕核心链路和核心功能推进
