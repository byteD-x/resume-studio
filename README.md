# Resume Studio

一个围绕“导入旧材料、在编辑器内打磨、按岗位定制、导出 PDF”的本地优先简历工作台。

## 主要能力

- 从空白草稿开始创建简历，并支持按岗位或公司复制出多个定制版本
- 导入网站链接、Markdown、纯文本和 PDF，并转换成可编辑草稿
- 在编辑器里完成摘要、经历、技能、岗位信息和 Markdown 源码编辑
- 基于目标岗位 / JD 做关键词覆盖分析，并生成 tailored variant
- 支持导入后的 review 流程，核对未映射内容、待确认字段和原始摘录
- 提供独立预览页和 PDF 导出

## AI 能力

AI 只围绕两个核心场景定制开发：

- 编辑器：摘要助手、经历写作助手、技能整理助手、岗位定制版生成
- 网站链接导入：优先做 AI 结构化抽取，失败自动回退到规则导入

默认优先使用免费模型。

## 默认模型

当前内置的免费模型预设：

- `Groq + qwen/qwen3-32b`
- `OpenRouter + openrouter/free`
- `Ollama + qwen3:4b`（本地备选）

默认 Base URL：

- `https://api.groq.com/openai/v1`

这两套预设会同时用于：

- 编辑器内 AI 设置
- 网站链接导入页的 AI 配置

## 本地开发

```bash
npm install
npx playwright install chromium
npm run dev
```

访问 `http://localhost:3000`。

如果你想在本地自托管模型，也可以切回 Ollama：

```bash
ollama serve
ollama pull qwen3:4b
# 可选：更稳一些
# ollama pull qwen3:8b
```

现在编辑器和网站链接导入页都内置了“测试连接”，可以直接检查：

- 服务是否可达
- 当前模型是否已安装

## 远程部署

部署到服务器后，有两种方式：

1. 服务器预置环境变量

```bash
RESUME_STUDIO_AI_API_KEY=...
# 或 OPENAI_COMPATIBLE_API_KEY=...
# 或 OPENAI_API_KEY=...
```

2. 不预置服务端模型配置，直接让用户自己填写

用户可以在以下位置自行配置：

- 编辑器的 `AI` 面板
- 网站链接导入页

可配置项：

- `Base URL`
- `Model`
- `API Key`

默认推荐让用户使用 Groq 或 OpenRouter 这类云服务免费模型；如果是内网或私有化部署，再切回本地 Ollama。

## 安全边界

- `API Key` 只保存在当前浏览器
- `API Key` 不会写入 `data/resumes/<id>/document.json`
- 导入后生成的简历文档也不会落盘保存 `API Key`

## 目录

- `src/app/studio/[id]`：编辑器工作台
- `src/app/api`：导入、保存、导出与 AI 路由
- `src/components`：编辑器、导入页和通用 UI
- `src/lib`：schema、存储、导入解析、AI、预览与导出逻辑
- `data/resumes`：本地简历文档和导出产物

## CLI

```bash
npm run import:portfolio
npm run import:pdf -- ./old-resume.pdf
npm run validate:resume
npm run export:pdf
npm run export:markdown
npm run import:markdown -- ./resume.md
```

## 验证

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```
