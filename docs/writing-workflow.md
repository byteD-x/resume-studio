# Resume Writing Workflow

本文档只描述当前代码已经实现的简历写作链路，不描述未落地的产品想法。

## 1. 进入流程

当前 Web 端写作流程默认从登录开始：

1. 在 `/login` 注册或登录本地账号
2. 通过 `/templates` 或 `/import` 建立草稿
3. 在 `/studio/[id]` 把草稿打磨成稳定源简历
4. 补充目标岗位信息
5. 生成定制版或优化版
6. 在 `/studio/[id]/preview` 检查后导出
7. 回到 `/resumes` 管理 lineage

## 2. 作者画像

当前代码支持 3 个作者画像。

### `experienced`

- 面向已有工作经验的求职者
- 重点是业务影响、职责范围、结果表达
- 默认适合作为通用源简历的起点

### `campus`

- 面向校招、应届或实习申请
- 重点是教育、项目、实习和校园经历
- 新建空白简历时会更早暴露教育板块

### `career-switch`

- 面向转岗或跨行业申请
- 重点是可迁移能力、证明项目和转向叙事
- 定向阶段更依赖岗位关键词的组织方式

## 3. 建立草稿的实际入口

### 模板创建

`/templates` 会根据作者画像展示 4 个当前可用模板：

- `aurora-grid`
- `campus-line`
- `portfolio-brief`
- `engineer-pro`

模板页当前创建的是 `template` starter，会直接按所选模板创建空白简历，而不是注入示例内容。

### 导入创建

`/import` 当前支持四种入口：

- URL
- Markdown
- 纯文本
- PDF

URL 导入支持：

- 单页或多页抓取
- 规则模式提取
- 远程 AI 模式提取

Markdown / 纯文本导入会直接尝试解析为简历结构；PDF 导入会落地到同一份文档模型，并写入 `importTrace` 供后续复核。

## 4. Studio 内的实际编辑顺序

在当前实现里，最稳妥的编辑顺序是：

1. 补齐基础信息
   姓名、标题、联系方式、摘要
2. 处理核心证据
   工作经历、项目经历、教育、技能
3. 清理导入残留
   根据 `pendingReview`、字段建议、快照和未映射内容做复核
4. 填写定向信息
   目标岗位、公司、JD、关键词、备注
5. 需要时调整排版和模板
6. 再进入 Preview 做最终检查

## 5. Workbench 与 workflow state

当前 workbench 使用 3 个 workflow state：

### `drafting`

- 表示还在补基础信息和骨架
- 常见任务是补 header、补 summary、补经历证据

### `tailoring`

- 表示已经开始面向具体岗位整理版本
- 常见任务是补 JD、关键词和岗位匹配内容

### `ready`

- 表示内容和版式已经接近可交付
- 常见任务是清理警告、确认导出 checklist

这些状态是当前产品里的“写作进度语义”，不是投递状态机。

## 6. 质量规则

质量规则来自同一套分析逻辑，主要分为三层：

### Blocking issues

存在阻塞项时，Preview 页会阻止导出 PDF。常见场景包括：

- 基础 header 信息缺失
- 联系方式不足
- 摘要过短
- 当前作者画像缺少核心证据

### Warnings

不会阻止导出，但会提示继续优化，例如：

- 结果型 bullet 不足
- bullet 表达偏弱
- 缺少结果信号
- 摘要或结构过载

### Suggestions

提示性的补充建议，例如链接和版面细节。

## 7. 定制版生成的当前策略

定制版不是“覆盖原简历”，而是派生新版本。

### 触发条件

当前至少满足其一才可生成：

- `focusKeywords` 非空
- `jobDescription` 可提取出关键词

### 生成逻辑

- 优先使用手动关键词
- 没有手动关键词时，从 JD 自动抽取
- 根据关键词命中情况筛选 section item
- 至少保留一定数量的内容，避免版本过空
- 缺失关键词会写入 `pendingReview`
- 生成结果会保留 `resume:<parentId>` 和 `variant:tailored` lineage 标记

### AI 参与

如果当前 AI 配置可用，并且有 API Key 或本地 Ollama，可在定制版生成后额外尝试补写摘要。

## 8. 优化版生成的当前策略

优化版同样是派生版本，不直接修改源简历。

当前支持两种目标：

- `one-page`
- `two-page`

优化版会：

- 派生新的标题
- 调整 layout 参数
- 写入 `variant:optimized`
- 增加待处理提示，提醒继续压缩或整理结构

## 9. Preview 与导出

`/studio/[id]/preview` 当前会同时展示：

- 预览 HTML
- 导出 checklist
- blocking issues / warnings
- 基础统计
- 岗位匹配分析
- workbench 当前状态

只有 blocking issues 清空后，`/api/resumes/[id]/export-pdf` 才会成功导出。

导出成功后：

- 浏览器会下载 PDF
- 同时在当前用户的 `exports/` 目录里保存一份副本

## 10. `/resumes` 的职责

当前 `/resumes` 不是“无限卡片堆叠页”，而是围绕 lineage 管理下一步动作：

- 查看源简历
- 查看某个 lineage 下的子版本
- 直接生成定制版
- 直接生成优化版
- 复制版本
- 删除单个版本或整组 lineage

它的职责重点是版本关系、准备度和下一步动作，而不是写作本身。

## 11. 当前不属于此流程的方向

除非用户明确要求，当前工作流不应往这些方向扩展：

- application tracking
- follow-up reminders
- interview CRM
- recruiting pipeline management
