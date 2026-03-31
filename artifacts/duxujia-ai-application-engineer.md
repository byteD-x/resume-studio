# 杜旭嘉
> AI 应用工程师（RAG / Agent）
- Location: 远程优先 ｜ 可到岗：深圳 / 南京 / 杭州 / 成都
- Email: 2041487752dxj@gmail.com
- Phone: 15035925107
- Website: https://www.byted.online/
- Link: GitHub | https://github.com/byteD-x
- Link: 国际站（Vercel） | https://my-resume-gray-five.vercel.app/
- Link: GitHub 站（Pages） | https://byted-x.github.io/My-Resume/
- Link: 国内站（自托管） | https://www.byted.online/

## Summary [summary]
AI 应用工程师，主攻检索增强、运行时编排与业务系统集成；注重把原型能力沉淀为可验证、可维护、可接入真实业务的系统，并坚持用仓库、测试与指标证明结果。

## 工作经历 [experience]

### 智能客服运行时
- Subtitle: 独立开发者 · 开源项目
- Date: 2026.02 - 至今
- Location: 开源项目
- Meta: Python / FastAPI / Qdrant / 多租户 / 插件化
- Tags: RAG, Agent Runtime, FastAPI, Auth Bridge

独立设计企业级智能客服运行时，统一文本、语音、RTC 与宿主挂载接入，并通过插件体系和知识治理将问答能力扩展为可接业务的服务运行时。

- 设计渠道接入、宿主桥接、核心引擎、业务增强、插件平台、提供商适配六层架构，统一文本、Voice API、RTC WebSocket 与 FastAPI 挂载 4 类接入形态。
- 实现 `route_confidence` 分层、`intent_stack` 回退及 `page_context` / `business_objects` 感知路由，提供 7 类插件扩展点，并补齐知识版本管理、诊断导出、限流与提示词脱敏。

### 微信智能助手
- Subtitle: 独立开发者 · 开源项目
- Date: 2025.12 - 至今
- Location: 开源项目
- Meta: Python / Quart / LangGraph / RAG / Cost Analytics
- Tags: LangGraph, BaseTransport, Observability, Cost Control

独立设计并持续迭代 Windows 微信生态智能助手运行时，围绕稳定接入、分层记忆、可降级 RAG 与运行治理，交付可长期运行的桌面化 AI 助手。

- 抽象 `BaseTransport` 接入层并以 `LangGraph` 重构回复主链，将同步回复与后台成长任务解耦，建立适合长期运行的微信助手架构。
- 构建三层记忆体系，并补齐 `/api/status`、`/api/metrics`、`/api/config/audit`、成本分析与配置热重载能力，支持 2 秒回复 deadline 策略。

### 南方科技大学
- Subtitle: 外包技术顾问
- Date: 2025.11 - 2025.12
- Location: 深圳
- Meta: Flask / ASR / Transformers / IPA Demo
- Tags: Flask, ASR, Transformers

独立承接并交付 \`IPA Demo\` 原型：围绕中文方言语音转写做出可演示、可批处理、可导出的 Web 系统，帮助客户快速验证技术路线。

- 将本地方言 ASR 模型封装为 Flask Web 服务，支持上传转写、流式转写、浏览器录音与示例音频体验，形成可直接演示的闭环。
- 补齐音频标准化、批量并发处理、IPA 声母/韵母/声调拆分、批量导出与系统手册下载，降低非技术用户试用与验收成本。

### 中软国际
- Subtitle: 后端 / 全栈工程师
- Date: 2025.04 - 2025.09
- Location: 西安
- Meta: RAG-QA System / LangGraph / Qdrant / 知识治理
- Tags: Hybrid Retrieval, LangGraph, Qdrant, Regression Gate

负责企业知识问答系统核心研发，完成多源文档接入、三路混合检索、LangGraph 可恢复运行时与知识治理工作台建设。

- 设计结构检索、全文检索、向量检索三路召回链路，结合加权 RRF 融合与 rerank，支持 `citations`、`grounding_score` 与 `trace_id` 返回。
- 将问答链路改造为 LangGraph 运行时，并建设 ingest 与知识治理工作台，补齐 checkpoint、interrupt/resume、retrieve/debug 与回归门禁能力。

### 国家骨科临床研究中心
- Subtitle: 后端开发实习生
- Date: 2024.08 - 2024.10
- Location: 远程
- Meta: Django / Celery / PubMed / WeChat Pay
- Tags: Django, PubMed, Mini Program

参与 \`SubMed\` 医学论文检索小程序后端，围绕 PubMed 抓取、AI 搜索、深度分析、订阅推送与微信支付形成科研信息服务闭环。

- 搭建 PubMed 抓取、文章入库、DOI/期刊补全与定时任务链路，为骨科领域论文检索提供持续更新的数据底座。
- 实现 AI 检索、深度分析、收藏订阅、积分/VIP 与微信支付等能力，把内容服务做成可持续运营的小程序后端。

### 中国联通陕西省分公司
- Subtitle: 后端开发实习生
- Date: 2024.05 - 2024.08
- Location: 西安 · 数字化部
- Meta: Java / ClickHouse / xxl-job / API Security
- Tags: ClickHouse, SQL Tuning, Data Migration

参与触点赋能中心、陕西运营平台和数据中台相关开发，完成接口鉴权、查询性能优化、海量数据同步与汇总库日更链路建设。

- 改造对外 API，实现接口第二次授权认证，并优化活动查询接口，将响应时间从 20s+ 压到约 4s，在海量数据场景下以 ClickHouse 代替 MySQL。
- 完成 300+ 张百万级数据表同步，并将数千万条数据迁移至汇总库，通过 `xxl-job` 实现每日动态更新，同时参与能力管理页面与前后端逻辑开发。

### EasyCloudPan
- Subtitle: 全栈开发 · 开源项目
- Date: 2024.04 - 2026.02
- Location: 开源项目（本地 + Docker）
- Meta: Java 21 / Spring Boot / PostgreSQL / Redis / Docker Compose
- Tags: High Concurrency, Security, Observability, Private Deploy

主导企业内网部署网盘系统建设，完成认证、上传下载、分享转存、文件预览、多租户、安全通信与可观测体系的全栈交付。

- 构建“分片上传 + 秒传 + 断点续传 + SSE 状态回传”主链路，支持 1000+ 并发上传，成功率 >99.5%；同时完成索引优化、游标分页与多级缓存治理，使 API P95 <500ms、P99 <1s。
- 落地 HMAC-SHA256 请求签名防重放、JWT 双 Token + 黑名单、`@FileAccessCheck`、Magic Number 校验与多租户隔离，并建立“本地一键启动 + Docker 全栈部署 + Prometheus/Grafana”工程基线。

### 九州通四向穿梭车路径规划系统
- Subtitle: 项目经理 / 算法研发
- Date: 2023.05 - 2023.07
- Location: 本地项目
- Meta: Python / A* / PyQt5 / 冲突消解
- Tags: A*, Path Planning, PyQt5

主导仓储四向穿梭车路径规划原型开发，基于 A\* 与冲突消解策略完成多车协同路径搜索，并构建 PyQt 可视化仿真工具。

- 设计 A* 路径搜索算法，完成复杂仓储地图下的最优路径求解与启发式搜索实现。
- 实现多车冲突检测与优先级等待策略，并开发 PyQt5 可视化仿真界面，支持地图编辑、路径步进调试及地图保存/加载。
## 项目经历 [projects]

### 智能客服运行时
- Subtitle: 六层运行时 + 7 类插件 + 多通道接入
- Date: 2026 - 至今
- Meta: GitHub: byteD-x/customer-ai-runtime
- Tags: Plugin Runtime, Multi-tenant, FastAPI

将 AI 客服从单纯知识问答扩展为可挂载、可转人工、可接业务且可治理的运行时能力，统一文本、语音、RTC 与宿主系统接入。

### 微信智能助手
- Subtitle: 微信接入运行时 + 三层记忆 + 可观测治理
- Date: 2025 - 至今
- Meta: GitHub: byteD-x/wechat-bot
- Tags: LangGraph, RAG, Cost Control

将微信自动回复脚本升级为具备接入治理、运行诊断与成本分析能力的桌面智能助手，形成长期运行的本地 Agent 工程基线。

### RAG-QA System
- Subtitle: 三路混合检索 + LangGraph 可恢复运行时
- Date: 2025.04 - 2025.09
- Meta: GitHub: byteD-x/rag-qa-system
- Tags: Hybrid Retrieval, Citation, Knowledge Governance

将企业分散资料沉淀为可持续同步、可追溯引用的知识问答能力，覆盖多源连接器、知识治理与评测回归流程。

### IPA Demo
- Subtitle: 方言语音转写原型 + 演示闭环
- Date: 2025.11 - 2025.12
- Meta: Flask / Transformers / Torchaudio / FFmpeg
- Tags: ASR, Flask, IPA

把本地 ASR 模型封装成可试用的 Web 原型，支持上传、录音、批量处理、IPA 拆分和结果导出，帮助客户快速验证技术路线。

### SubMed 医学论文检索小程序
- Subtitle: 医学论文检索 + AI 分析 + 订阅运营
- Date: 2024.08 - 2024.10
- Meta: Django / PubMed / Celery / WeChat Pay
- Tags: Django, PubMed, Mini Program

面向医学专家的论文检索与订阅推送后端，围绕 PubMed 抓取、AI 搜索、深度分析、收藏订阅和会员积分体系形成完整服务链路。

### 乐学网
- Subtitle: 教育平台 + 支付闭环 + 实时互动
- Date: 2024
- Meta: Spring Boot / Redis / Spring Security / Vue.js
- Tags: Payment, RBAC, WebSocket

面向校内选课、考试与知识付费场景的教育平台，集成课程管理、支付结算与实时互动能力。

### EasyCloudPan
- Subtitle: 企业级文件平台（私有化部署 + 安全基线 + 可观测）
- Date: 2024.04 - 2026.02
- Meta: GitHub: byteD-x/easyCloudPan
- Tags: Java 21, Observability, Security, Private Deploy

主导企业内网部署网盘系统建设，兼顾高并发上传、安全治理、身份接入扩展与监控验收能力，并同时支持本地一键启动与 Docker 全栈部署。

### 九州通四向穿梭车路径规划系统
- Subtitle: 仓储自动化算法原型
- Date: 2023
- Meta: Python / A* / CBS / PyQt5
- Tags: A*, Conflict Resolution, Simulation

主导仓储四向穿梭车路径规划原型开发，基于 A\* 与冲突消解策略完成多车协同路径搜索，并构建可视化仿真工具。
## 教育经历 [education]

### 南阳理工学院
- Subtitle: 本科 · 数据科学与大数据技术
- Date: 2021.09 - 2025.06
- Location: 河南
- Meta: GPA 3.8/4.5（Top 5%）
- Tags: Computer Science, Big Data, Top 5%

主修计算机科学与大数据技术，具备扎实的计算机理论基础与较强的工程实践、自驱迭代和持续学习能力。
## 核心技能 [skills]

### 核心栈
- Tags: Java / Spring Boot（性能治理、架构演进、CI/CD）, Python / FastAPI / AsyncIO（AI 运行时编排、多通道接入）, LangGraph / RAG / Qdrant（知识检索增强、复杂流程编排）, OpenAI / Tool Calling（业务系统互联、模型能力接入）, PostgreSQL / Redis / ClickHouse（存储选型与查询优化）, Next.js / Vue 3 / TypeScript（工程化前端构建与全栈交付）

长期主用并可独立负责交付的技术栈。

### 扩展栈
- Tags: Docker / Linux Shell / Nginx, Jenkins / GitLab CI（流水线与自动化部署）, pytest / Playwright（回归测试与 UI 自动化）, WebSocket / SSE / RTC / ASR / TTS（实时与语音流）, 多租户隔离 / Auth Bridge / 插件化扩展设计, 系统监控 / Prometheus / Grafana 仪表盘

已在项目中稳定使用的配套能力。

### 协作栈
- Tags: Go（微服务开发）, Kubernetes（容器编排基础）, Kafka / RabbitMQ（异步解耦）, Elasticsearch / MinIO（非结构化存储）, AWS / Aliyun（云端基础设施）

具备实践经验，可在协作项目中快速接手。
