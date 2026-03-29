# 杜旭嘉
> AI 应用工程师（RAG / Agent）
- Location: 远程优先 ｜ 可到岗：深圳 / 南京 / 杭州 / 成都
- Email: 2041487752dxj@gmail.com
- Phone: 15035925107
- Website: https://github.com/byteD-x
- Link: GitHub | https://github.com/byteD-x
- Link: 国际站（Vercel） | https://my-resume-gray-five.vercel.app/
- Link: GitHub 站（Pages） | https://byted-x.github.io/My-Resume/
- Link: 国内站（自托管） | https://www.byted.online/

## Summary [summary]
聚焦检索增强、智能体运行时与业务系统集成，持续将原型方案推进为可验证、可维护、可接入真实业务的工程系统。

AI 应用工程师，主攻检索增强、运行时编排与业务系统集成；注重把原型能力沉淀为可验证、可维护、可接入真实业务的系统，并坚持用仓库、测试与指标证明结果。

## Profile [summary]

聚焦检索增强、智能体运行时与业务系统集成，持续将原型方案推进为可验证、可维护、可接入真实业务的工程系统。

AI 应用工程师，主攻检索增强、运行时编排与业务系统集成；注重把原型能力沉淀为可验证、可维护、可接入真实业务的系统，并坚持用仓库、测试与指标证明结果。
## Experience [experience]

### 微信智能助手
- Subtitle: 独立开发者 · 开源项目
- Date: 2025.12 - 至今
- Location: 开源项目
- Meta: Python · Quart · Asyncio · LangGraph · RAG · Electron · SQLite · ChromaDB · BaseTransport · Cost Analytics
- Tags: Python, Quart, Asyncio, LangGraph, RAG, Electron, SQLite, ChromaDB, BaseTransport, Cost Analytics

面向 Windows 微信生态构建长期运行的微信机器人：支持消息接入、分层记忆、可降级 RAG、配置热重载与成本/诊断能力。

- 将微信接入抽象成 `BaseTransport`，并以 `LangGraph` 重构回复主链，把短链路回复与后台成长任务拆开，适合长期运行。
- 构建 SQLite 短期记忆 + 运行期向量记忆 + 导出语料 RAG 的三层记忆，并支持轻量重排与可选本地 Cross-Encoder 自动回退。
- 补齐 `/api/status`、`/api/metrics`、`/api/config/audit`、成本分析与 GitHub Release 发布链路，使桌面机器人具备观测、配置和交付能力。

### 智能客服运行时
- Subtitle: 独立开发者 · 开源项目
- Date: 2026.02 - 至今
- Location: 开源项目
- Meta: Python · FastAPI · AsyncIO · Pydantic · OpenAI · Voice / RTC · Qdrant · Plugin Runtime · Multi-tenant · Auth Bridge
- Tags: Python, FastAPI, AsyncIO, Pydantic, OpenAI, Voice / RTC, Qdrant, Plugin Runtime, Multi-tenant, Auth Bridge

企业级智能客服运行时参考实现：统一文本/语音/RTC 接入，复用宿主鉴权与业务上下文，并通过插件、多租户知识库与治理能力，将问答能力扩展为可接业务的服务运行时。

- 统一文本 / Voice API / RTC WebSocket / FastAPI 挂载四类接入形态，复用同一套 session、routing、handoff 运行时。
- 实现 `route_confidence` 分层、`intent_stack` 回退、`page_context` / `business_objects` 感知路由，低置信度先澄清再转人工。
- 补齐 7 类插件扩展点、知识版本管理、chunk 优化、消息级反馈、诊断导出、request_id 贯通、限流与提示词脱敏，强化治理与审计能力。

### 南方科技大学
- Subtitle: 外包技术顾问
- Date: 2025.11 - 2025.12
- Location: 深圳
- Meta: Python · Automation · Full Stack · End-to-End Delivery
- Tags: Python, Automation, Full Stack, End-to-End Delivery

独立承接并交付智能流程自动化 (IPA) 原型：从需求澄清到可演示系统闭环，帮助客户快速验证可行性。

- 在需求不清晰且周期受限场景下，以敏捷迭代完成 IPA 原型交付，并按期通过客户验收。
- 完成自动化脚本与 Web 系统通信验证，为后续工程化立项提供可行性依据。

### 中软国际
- Subtitle: 后端/全栈工程师
- Date: 2025.04 - 2025.09
- Location: 西安
- Meta: FastAPI · LangGraph · PostgreSQL · Qdrant · RAG · Vue 3 · FastEmbed · Docker · LangChain
- Tags: FastAPI, LangGraph, PostgreSQL, Qdrant, RAG, Vue 3, FastEmbed, Docker, LangChain

企业知识问答系统研发：把多源文档接入、混合检索、LangGraph 可恢复运行时、引用溯源与评测回归做成一条完整链路。

- 搭建结构检索 + 全文检索 + 向量检索三路召回，结合加权 RRF 融合与 rerank，支持 citations、grounding_score 与 trace_id 返回。
- 把 Gateway 问答链路与 KB 检索链路都改成 LangGraph 运行时，支持 checkpoint、interrupt/resume、人工澄清与 step_events。
- 补齐 ingest 与治理工作台：支持多知识库、多源连接器、chunk 拆分/合并/禁用、retrieve/debug，以及 smoke-eval / regression gate。

### 国家骨科临床研究中心
- Subtitle: 后端开发实习生
- Date: 2024.08 - 2024.10
- Location: 远程
- Meta: Backend Architecture · AI Search · WeChat Mini Program · System Design
- Tags: Backend Architecture, AI Search, WeChat Mini Program, System Design

为医学专家做论文智能检索小程序后端：整合 AI 搜索与订阅推送，把“找文献”从小时级压到分钟级。

- 设计并实现高可用后端架构，支撑医学检索小程序稳定运行。
- 整合 AI 搜索与订阅推送，将文献检索时延从小时级降至分钟级，提升科研效率。
- 对接自然语言检索能力，降低专家检索门槛并提升结果相关性。

### 中国联通陕西省分公司
- Subtitle: 后端开发实习生
- Date: 2024.05 - 2024.08
- Location: 西安 · 数字化部
- Meta: Java · ClickHouse · MySQL · Redis · Data Migration · Performance Tuning · CI/CD
- Tags: Java, ClickHouse, MySQL, Redis, Data Migration, Performance Tuning, CI/CD

参与运营平台与数据中台建设：报表从 20s+ 到 4s，完成 300+ 表迁移与校对，并补齐慢查询治理与 CI/CD 发布链路。

- 推动 OLTP/OLAP 分离并引入 ClickHouse，将活动统计接口从 20s+ 优化到 4s（5x），支撑高频运营分析。
- 完成 300+ 表、3亿+ 记录迁移与一致性校验，保障数据中台升级可追溯、可回滚。
- 重写聚合 SQL 并补充覆盖索引与缓存，将部分核心查询从 10s+ 降至 500ms，持续清理 20+ 慢查询隐患。
- 搭建 CI/CD + lint/build/test 门禁与回滚链路，将发布耗时从 30 分钟缩短至 5 分钟，降低人工发布风险。

### EasyCloudPan
- Subtitle: 全栈开发 · 开源项目
- Date: 2024.04 - 2026.02
- Location: 开源项目（本地 + Docker）
- Meta: Java 21 · Spring Boot 3.2 · Spring Security · OAuth2 · MyBatis-Flex · Flyway · PostgreSQL · Redis · MinIO/S3 · Vue 3 · Docker Compose · Prometheus/Grafana
- Tags: Java 21, Spring Boot 3.2, Spring Security, OAuth2, MyBatis-Flex, Flyway, PostgreSQL, Redis, MinIO/S3, Vue 3, Docker Compose, Prometheus/Grafana

面向企业内网部署的前后端分离网盘系统：支持本地一键启动与 Docker 全栈部署，覆盖认证、上传下载、分享转存、回收站、文件预览、多租户、安全通信、OAuth 登录与监控告警。

- 构建“分片上传 + 秒传 + 断点续传 + SSE 状态回传”主链路，结合 `FileChannel.transferTo()` 零拷贝合并与并发控制，支持 1000+ 并发上传，成功率 >99.5%（README 指标口径）。
- 落地请求签名防重放（HMAC-SHA256 + timestamp + nonce）与 JWT 双 Token + 黑名单治理，兼容 query token 退场；叠加 `@FileAccessCheck`、Magic Number 与多租户校验形成安全闭环。
- 建立“本地一键启动 + 健康检查 + 日志分层 + 监控告警 + Web Vitals 入库”工程基线，按 README 口径达到 API P95 <500ms、P99 <1s、缓存命中率 >90%。

### 九州通四向穿梭车路径规划系统
- Subtitle: 项目经理 / 算法研发
- Date: 2023.05 - 2023.07
- Location: 本地项目
- Meta: Python · A* · Path Planning · PyQt5 · Concurrency
- Tags: Python, A*, Path Planning, PyQt5, Concurrency

在仓储场景实现多车路径规划原型：A\* + CBS 解决冲突与死锁，并提供可视化仿真调试工具。

- 算法落地: 基于 A* 算法实现复杂仓储地图下的最优路径搜索
- 冲突消解: 设计 CBS (Constraint-Based Search) 策略处理多车路权冲突
- 可视化: 使用 PyQt5 开发动态仿真界面，支持算法过程步进调试

### 南阳理工学院
- Subtitle: 本科 · 数据科学与大数据技术
- Date: 2021.09 - 2025.06
- Location: 河南
- Meta: Computer Science · Big Data · Top 5%
- Tags: Computer Science, Big Data, Top 5%

主修计算机科学与大数据技术，GPA 3.8/4.5 (Top 5%)。注重工程实践与持续学习能力。
## Projects [projects]

### 智能客服运行时
- Date: 2026 - 至今
- Meta: Python · FastAPI · AsyncIO · Pydantic · OpenAI · Voice / RTC · Qdrant · Plugin Runtime · Multi-tenant · Auth Bridge
- Tags: Python, FastAPI, AsyncIO, Pydantic, OpenAI, Voice / RTC, Qdrant, Plugin Runtime, Multi-tenant, Auth Bridge

企业级智能客服运行时参考实现：统一文本/语音/RTC 接入，复用宿主鉴权与业务上下文，并通过插件、多租户知识库与治理能力，将问答能力扩展为可接业务的服务运行时。

- 统一文本 / Voice API / RTC WebSocket / FastAPI 挂载四类接入形态，复用同一套 session、routing、handoff 运行时。
- 实现 `route_confidence` 分层、`intent_stack` 回退、`page_context` / `business_objects` 感知路由，低置信度先澄清再转人工。
- 补齐 7 类插件扩展点、知识版本管理、chunk 优化、消息级反馈、诊断导出、request_id 贯通、限流与提示词脱敏，强化治理与审计能力。

### 微信智能助手
- Date: 2025 - 至今
- Meta: Python · Quart · Asyncio · LangGraph · RAG · Electron · SQLite · ChromaDB · BaseTransport · Cost Analytics
- Tags: Python, Quart, Asyncio, LangGraph, RAG, Electron, SQLite, ChromaDB, BaseTransport, Cost Analytics

面向 Windows 微信生态构建长期运行的微信机器人：支持消息接入、分层记忆、可降级 RAG、配置热重载与成本/诊断能力。

- 将微信接入抽象成 `BaseTransport`，并以 `LangGraph` 重构回复主链，把短链路回复与后台成长任务拆开，适合长期运行。
- 构建 SQLite 短期记忆 + 运行期向量记忆 + 导出语料 RAG 的三层记忆，并支持轻量重排与可选本地 Cross-Encoder 自动回退。
- 补齐 `/api/status`、`/api/metrics`、`/api/config/audit`、成本分析与 GitHub Release 发布链路，使桌面机器人具备观测、配置和交付能力。

### RAG-QA System
- Date: 2025.04 - 2025.09
- Meta: FastAPI · LangGraph · Vue 3 · PostgreSQL · Qdrant · RAG · FastEmbed · Docker · LangChain
- Tags: FastAPI, LangGraph, Vue 3, PostgreSQL, Qdrant, RAG, FastEmbed, Docker, LangChain

企业知识问答系统：把多源文档接入、混合检索、LangGraph 可恢复运行时、引用溯源与评测回归做成一条完整链路。

- 搭建结构检索 + 全文检索 + 向量检索三路召回，结合加权 RRF 融合与 rerank，支持 citations、grounding_score 与 trace_id 返回。
- 把 Gateway 问答链路与 KB 检索链路都改成 LangGraph 运行时，支持 checkpoint、interrupt/resume、人工澄清与 step_events。
- 补齐 ingest 与治理工作台：支持多知识库、多源连接器、chunk 拆分/合并/禁用、retrieve/debug，以及 smoke-eval / regression gate。

### 乐学网
- Date: 2024
- Meta: Spring Boot · Redis · Spring Security · Vue.js · MySQL
- Tags: Spring Boot, Redis, Spring Security, Vue.js, MySQL

面向校内选课/考试高峰的教育平台：视频点播、支付、实时互动一体化（Redis 缓存 + RBAC + WebSocket）。

- 落地支付、课程、互动链路一体化交付，形成校内教学与付费闭环。
- 通过 Redis 缓存与 RBAC 权限治理，支撑高峰时段在线考试并保持稳定。
- 使用 WebSocket 实现实时互动，提升教学场景响应效率与参与度。

### EasyCloudPan
- Date: 2024.04 - 2026.02
- Meta: Java 21 · Spring Boot 3.2 · Spring Security · OAuth2 · MyBatis-Flex · Flyway · PostgreSQL · Redis · MinIO/S3 · Vue 3 · Docker Compose · Prometheus · Grafana
- Tags: Java 21, Spring Boot 3.2, Spring Security, OAuth2, MyBatis-Flex, Flyway, PostgreSQL, Redis, MinIO/S3, Vue 3, Docker Compose, Prometheus, Grafana

前后端分离的一体化网盘系统：覆盖认证、上传下载、分享转存、回收站、文件预览、多租户、安全通信、OAuth 登录与监控告警，支持本地一键启动与 Docker 全栈部署。

- 构建“分片上传 + 秒传 + 断点续传 + SSE 状态回传”主链路，结合零拷贝分片合并，支持 1000+ 并发上传，成功率 >99.5%（README 指标口径）。
- 完成 PostgreSQL 复合索引 + 游标分页 + Caffeine/Redis 多级缓存治理，API P95 <500ms、P99 <1s、数据库查询 P95 <100ms、缓存命中率 >90%。
- 构建请求签名防重放 + JWT 双 Token + 黑名单 + 多租户隔离 + OAuth 多提供方登录，并接入 Prometheus/Grafana 与 Web Vitals 入库，核心 P0/P1 流程可复现验证。

### 九州通四向穿梭车路径规划系统
- Date: 2023
- Meta: Python · A* · CBS · PyQt5 · ThreadPoolExecutor · Concurrent
- Tags: Python, A*, CBS, PyQt5, ThreadPoolExecutor, Concurrent

面向密集仓储的多车路径规划原型：基于 A\* + CBS 解决协同避让与死锁，并提供可视化仿真调试平台。

- 构建 A* + CBS 路径规划引擎，解决密集仓储多车协同冲突问题。
- 建立时空预留与冲突检测机制，保障多车路径规划稳定运行。
- 开发 PyQt5 可视化仿真工具，显著提升算法调试与演示效率。
## Skills [skills]

### 核心栈
- Tags: Java / Spring Boot（性能治理、架构演进、CI/CD）, Python / FastAPI / AsyncIO（AI 运行时编排、多通道接入）, LangGraph / RAG / Qdrant（知识检索增强、复杂流程编排）, OpenAI / Tool Calling（业务系统互联、模型能力接入）, PostgreSQL / Redis / ClickHouse（存储选型与查询优化）, Next.js / Vue 3 / TypeScript（工程化前端构建与全栈交付）

长期主用并可独立负责交付的技术栈。

### 扩展栈
- Tags: Docker / Linux Shell / Nginx, Jenkins / GitLab CI（流水线与自动化部署）, pytest / Playwright（回归测试与 UI 自动化）, WebSocket / SSE / RTC / ASR / TTS（实时与语音流）, 多租户隔离 / Auth Bridge / 插件化扩展设计, 系统监控 / Prometheus / Grafana 仪表盘

已在项目中稳定使用的配套能力。

### 协作栈
- Tags: Go（微服务开发）, Kubernetes（容器编排基础）, Kafka / RabbitMQ（异步解耦）, Elasticsearch / MinIO（非结构化存储）, AWS / Aliyun（云端基础设施）

具备实践经验，可在协作项目中快速接手。
