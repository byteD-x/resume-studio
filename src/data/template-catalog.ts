import type {
  ResumeDocument,
  ResumeSection,
  ResumeSectionItem,
  ResumeTemplate,
  ResumeWriterProfile,
} from "@/types/resume";

export type TemplateCategory = "通用" | "校招" | "设计" | "技术";
export type ResumeTemplateFamily = "two-column" | "single-column";

type TemplateStarterSeed = Pick<ResumeDocument, "basics" | "sections">;

export interface TemplateCatalogItem {
  id: ResumeTemplate;
  name: string;
  subtitle: string;
  category: TemplateCategory;
  family: ResumeTemplateFamily;
  accent: string;
  background: string;
  summary: string;
  highlights: string[];
  recommendedProfiles: ResumeWriterProfile[];
  previewImage: string;
  previewAlt: string;
  layoutPreset: ResumeDocument["layout"];
  starterSeeds: Record<ResumeWriterProfile, TemplateStarterSeed>;
}

function createItem(input: {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  dateRange?: string;
  meta?: string;
  summaryHtml?: string;
  bulletPoints?: string[];
  tags?: string[];
}): ResumeSectionItem {
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle ?? "",
    location: input.location ?? "",
    dateRange: input.dateRange ?? "",
    meta: input.meta ?? "",
    summaryHtml: input.summaryHtml ?? "",
    bulletPoints: input.bulletPoints ?? [],
    tags: input.tags ?? [],
  };
}

function createSection(input: {
  id: string;
  type: ResumeSection["type"];
  title: string;
  layout?: ResumeSection["layout"];
  contentHtml?: string;
  items?: ResumeSectionItem[];
}): ResumeSection {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    visible: true,
    layout: input.layout ?? "stacked-list",
    contentHtml: input.contentHtml ?? "",
    items: input.items ?? [],
  };
}

function createLinks(...links: Array<[label: string, url: string]>) {
  return links.map(([label, url]) => ({ label, url }));
}

function auroraExperiencedSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "林知远",
      headline: "高级增长运营经理｜用户增长与商业化",
      location: "上海",
      email: "zhiyuan.lin@example.com",
      phone: "138-0000-2748",
      website: "linzhiyuan.work",
      summaryHtml:
        "<p>8 年互联网增长与商业化经验，长期负责从策略拆解到执行落地的完整增长链路。擅长搭建实验体系、重构转化漏斗，并与产品、销售和数据团队协同推动关键指标提升。</p>",
      links: createLinks(
        ["LinkedIn", "https://linkedin.com/in/zhiyuanlin"],
        ["作品页", "https://linzhiyuan.work/cases"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "experience",
        type: "experience",
        title: "工作经历",
        items: [
          createItem({
            id: "aurora-exp-1",
            title: "增长运营负责人",
            subtitle: "澄明科技",
            location: "上海",
            dateRange: "2022.03 - 至今",
            meta: "B2B SaaS",
            summaryHtml:
              "<p>负责注册转化、付费转化和渠道协同，带 6 人团队建立季度增长节奏。</p>",
            bulletPoints: [
              "重做官网转化漏斗与线索分层机制，MQL 到 SQL 转化率提升 31%。",
              "搭建 40+ 组站内实验与投放归因看板，将获客成本降低 18%。",
              "推动内容、销售和 CRM 数据打通，线索跟进时效从 48 小时缩短到 8 小时。",
            ],
          }),
          createItem({
            id: "aurora-exp-2",
            title: "用户运营经理",
            subtitle: "星岸数字",
            location: "杭州",
            dateRange: "2019.06 - 2022.02",
            meta: "消费互联网",
            bulletPoints: [
              "负责新用户激活与会员留存策略，年度复购率提升 22%。",
              "设计分层触达策略与自动化任务流，月活留存提升 12 个百分点。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "项目精选",
        items: [
          createItem({
            id: "aurora-project-1",
            title: "企业线索增长驾驶舱",
            subtitle: "从 0 到 1 的经营看板项目",
            dateRange: "2024",
            summaryHtml:
              "<p>联合数据和销售运营搭建一套跨渠道增长驾驶舱，统一看板口径和周报节奏。</p>",
            bulletPoints: [
              "将 9 个渠道指标统一到同一看板，周会决策时间缩短约 50%。",
              "用分层预警替代人工巡检，季度重点项目异常响应时间缩短到当天。",
            ],
            tags: ["Looker Studio", "SQL", "运营分析"],
          }),
        ],
      }),
      createSection({
        id: "education",
        type: "education",
        title: "教育经历",
        items: [
          createItem({
            id: "aurora-edu-1",
            title: "华东师范大学",
            subtitle: "市场营销 学士",
            location: "上海",
            dateRange: "2011 - 2015",
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "核心能力",
        layout: "tag-grid",
        items: [
          createItem({
            id: "aurora-skills-1",
            title: "技能",
            tags: [
              "增长策略",
              "商业化分析",
              "实验设计",
              "SQL",
              "用户分层运营",
              "跨团队协作",
              "数据看板",
            ],
          }),
        ],
      }),
    ],
  };
}

function auroraCampusSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "周雨棠",
      headline: "数据分析 / 运营培训生",
      location: "南京",
      email: "yutang.zhou@example.com",
      phone: "139-0000-1846",
      website: "yutangzhou.notion.site",
      summaryHtml:
        "<p>统计学背景，应届求职方向为数据分析与运营。熟悉 SQL、Excel 建模和可视化表达，能把业务问题拆成可验证的指标与结论，在实习和课程项目中持续输出结构化分析结果。</p>",
      links: createLinks(
        ["作品集", "https://yutangzhou.notion.site/portfolio"],
        ["GitHub", "https://github.com/yutangzhou"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "education",
        type: "education",
        title: "教育经历",
        items: [
          createItem({
            id: "aurora-campus-edu-1",
            title: "南京财经大学",
            subtitle: "统计学 本科",
            location: "南京",
            dateRange: "2022 - 2026",
            meta: "GPA 3.76/4.0｜校二等奖学金",
            bulletPoints: [
              "主修统计分析、数据库、计量经济学和数据可视化，连续两年位列专业前 10%。",
            ],
          }),
        ],
      }),
      createSection({
        id: "experience",
        type: "experience",
        title: "实习经历",
        items: [
          createItem({
            id: "aurora-campus-exp-1",
            title: "运营分析实习生",
            subtitle: "青橙消费科技",
            location: "上海",
            dateRange: "2025.06 - 2025.09",
            bulletPoints: [
              "整理新客激活漏斗和渠道周报，帮助团队定位 2 个高流失环节并推动优化。",
              "用 SQL 和 Excel 重构日报模板，报告整理时间从 2 小时压缩到 30 分钟。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "项目经历",
        items: [
          createItem({
            id: "aurora-campus-project-1",
            title: "校园活动报名转化分析",
            subtitle: "课程项目",
            dateRange: "2025",
            bulletPoints: [
              "基于 1.2 万条行为日志搭建漏斗模型，识别出报名页跳失率最高的关键步骤。",
              "输出改版建议并完成原型展示，模拟转化率提升约 14%。",
            ],
            tags: ["SQL", "Excel", "Power BI"],
          }),
          createItem({
            id: "aurora-campus-project-2",
            title: "电商用户留存分层研究",
            subtitle: "校内研究项目",
            dateRange: "2024",
            bulletPoints: [
              "设计用户分层规则并完成 3 类留存画像分析，形成可执行的运营策略建议。",
            ],
            tags: ["Python", "Pandas", "Tableau"],
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "技能清单",
        layout: "tag-grid",
        items: [
          createItem({
            id: "aurora-campus-skills-1",
            title: "技能",
            tags: ["SQL", "Excel", "Power BI", "Python", "问卷分析", "结构化表达"],
          }),
        ],
      }),
    ],
  };
}

function auroraCareerSwitchSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "何嘉宁",
      headline: "用户研究 / 体验策略转岗候选人",
      location: "深圳",
      email: "jianing.he@example.com",
      phone: "137-0000-1169",
      website: "hejianing.framer.website",
      summaryHtml:
        "<p>原品牌策划经理，近两年系统转向用户研究与体验策略。具备扎实的访谈、洞察整合和提案表达能力，能把模糊需求转成可执行的研究框架，并已在真实项目中交付多项用户洞察与体验优化建议。</p>",
      links: createLinks(
        ["研究案例", "https://hejianing.framer.website/cases"],
        ["LinkedIn", "https://linkedin.com/in/jianinghe"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "experience",
        type: "experience",
        title: "相关经历",
        items: [
          createItem({
            id: "aurora-switch-exp-1",
            title: "体验策略项目负责人",
            subtitle: "自由研究项目",
            location: "深圳",
            dateRange: "2024.07 - 至今",
            bulletPoints: [
              "围绕本地生活和教育产品完成 12 场用户访谈，沉淀出 3 套可复用的研究框架。",
              "将洞察输出为用户旅程图与优化清单，帮助合作团队优先级收敛到 5 个高影响问题。",
            ],
            tags: ["用户访谈", "洞察分析", "服务蓝图"],
          }),
          createItem({
            id: "aurora-switch-exp-2",
            title: "品牌策划经理",
            subtitle: "南汐文化",
            location: "广州",
            dateRange: "2018.05 - 2024.06",
            bulletPoints: [
              "负责品牌调研与内容策略，累计主导 20+ 份消费者洞察报告。",
              "将调研结论用于产品提案与 campaign 策略，项目中标率提升 25%。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "转岗证明项目",
        items: [
          createItem({
            id: "aurora-switch-project-1",
            title: "教育产品报名流程体验诊断",
            subtitle: "独立案例",
            dateRange: "2025",
            summaryHtml:
              "<p>拆解报名路径中的认知与操作阻力，完成访谈招募、访谈和方案输出。</p>",
            bulletPoints: ["提出 8 条高优先级优化建议，并用原型验证信息层级改版方向。"],
            tags: ["可用性测试", "信息架构", "原型表达"],
          }),
        ],
      }),
      createSection({
        id: "education",
        type: "education",
        title: "教育与进修",
        items: [
          createItem({
            id: "aurora-switch-edu-1",
            title: "华南师范大学",
            subtitle: "传播学 学士",
            dateRange: "2012 - 2016",
          }),
          createItem({
            id: "aurora-switch-edu-2",
            title: "Google UX Design Certificate",
            subtitle: "在线证书",
            dateRange: "2024",
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "可迁移能力",
        layout: "tag-grid",
        items: [
          createItem({
            id: "aurora-switch-skills-1",
            title: "技能",
            tags: ["用户访谈", "洞察分析", "提案表达", "信息架构", "Figma", "跨团队沟通"],
          }),
        ],
      }),
    ],
  };
}

function campusExperiencedSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "顾铭泽",
      headline: "算法工程师｜具备校园招聘与训练营指导经验",
      location: "北京",
      email: "mingze.gu@example.com",
      phone: "136-0000-3195",
      website: "mingzegu.dev",
      summaryHtml:
        "<p>3 年机器学习与推荐算法经验，近一年兼任校招项目导师，熟悉校园招聘流程与应届候选人培养场景。擅长将复杂技术问题拆解为可落地的实验方案和可量化的结果指标。</p>",
      links: createLinks(
        ["GitHub", "https://github.com/mingzegu"],
        ["博客", "https://mingzegu.dev/blog"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "education",
        type: "education",
        title: "教育背景",
        items: [
          createItem({
            id: "campus-exp-edu-1",
            title: "北京邮电大学",
            subtitle: "计算机科学与技术 硕士",
            dateRange: "2018 - 2021",
            meta: "研究方向：推荐系统",
          }),
        ],
      }),
      createSection({
        id: "experience",
        type: "experience",
        title: "工作与培养经历",
        items: [
          createItem({
            id: "campus-exp-exp-1",
            title: "推荐算法工程师",
            subtitle: "曜石智能",
            location: "北京",
            dateRange: "2023.01 - 至今",
            bulletPoints: [
              "优化召回与粗排特征体系，核心推荐场景 CTR 提升 9.4%。",
              "为 2 届校招生建立训练营任务清单和代码评审机制，转正通过率达到 100%。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "项目亮点",
        items: [
          createItem({
            id: "campus-exp-project-1",
            title: "校招生训练营项目",
            subtitle: "内部培养计划",
            dateRange: "2024",
            bulletPoints: [
              "搭建 4 周训练营课程和实战任务，让新同学在 1 个月内完成首个实验上线。",
            ],
            tags: ["导师机制", "训练营", "工程实践"],
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "技术栈",
        layout: "tag-grid",
        items: [
          createItem({
            id: "campus-exp-skills-1",
            title: "技能",
            tags: ["Python", "PyTorch", "SQL", "推荐系统", "特征工程", "A/B Test"],
          }),
        ],
      }),
    ],
  };
}

function campusCampusSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "沈可欣",
      headline: "前端开发 / 研发培训生",
      location: "武汉",
      email: "kexin.shen@example.com",
      phone: "135-0000-2417",
      website: "kexin-shen.vercel.app",
      summaryHtml:
        "<p>计算机专业应届生，重点方向为前端工程与交互实现。熟悉 React、TypeScript 与工程化协作，能把复杂需求拆分成清晰模块，在实习和课程项目中持续输出可上线的页面与组件。</p>",
      links: createLinks(
        ["GitHub", "https://github.com/kexinshen"],
        ["作品集", "https://kexin-shen.vercel.app"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "education",
        type: "education",
        title: "教育背景",
        items: [
          createItem({
            id: "campus-campus-edu-1",
            title: "华中科技大学",
            subtitle: "软件工程 本科",
            location: "武汉",
            dateRange: "2022 - 2026",
            meta: "GPA 3.82/4.0｜前端方向课程组长",
            bulletPoints: [
              "完成数据结构、操作系统、Web 前端、软件工程等核心课程，连续两年获得优秀学生奖学金。",
            ],
          }),
        ],
      }),
      createSection({
        id: "experience",
        type: "experience",
        title: "实习经历",
        items: [
          createItem({
            id: "campus-campus-exp-1",
            title: "前端开发实习生",
            subtitle: "有光科技",
            location: "深圳",
            dateRange: "2025.07 - 2025.10",
            bulletPoints: [
              "参与企业后台的模块重构，交付 8 个业务页面并修复 20+ 个交互问题。",
              "封装通用表单组件和状态提示模块，减少约 30% 的重复代码。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "项目经历",
        items: [
          createItem({
            id: "campus-campus-project-1",
            title: "课程管理平台",
            subtitle: "团队项目 / 前端负责人",
            dateRange: "2025",
            bulletPoints: [
              "负责课程列表、筛选、权限管理等核心页面，推动团队按期完成答辩版本上线。",
              "引入 TypeScript 和组件拆分规范，将多人协作冲突明显减少。",
            ],
            tags: ["React", "TypeScript", "Vite"],
          }),
          createItem({
            id: "campus-campus-project-2",
            title: "简历生成器",
            subtitle: "个人项目",
            dateRange: "2024",
            bulletPoints: ["从零实现富文本编辑、模板切换和 PDF 导出流程，累计迭代 4 个版本。"],
            tags: ["Next.js", "Tailwind CSS", "Playwright"],
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "技能清单",
        layout: "tag-grid",
        items: [
          createItem({
            id: "campus-campus-skills-1",
            title: "技能",
            tags: ["React", "TypeScript", "Next.js", "Node.js", "Tailwind CSS", "Git"],
          }),
        ],
      }),
    ],
  };
}

function campusSwitchSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "唐书言",
      headline: "产品运营转前端开发候选人",
      location: "成都",
      email: "shuyan.tang@example.com",
      phone: "139-0000-2783",
      website: "shuyantang.dev",
      summaryHtml:
        "<p>原产品运营，近一年系统转向前端开发。基于过往需求梳理和跨团队推进经验，形成了更强的业务理解能力，已完成多个真实项目并具备 React、TypeScript 与组件化开发能力。</p>",
      links: createLinks(
        ["作品集", "https://shuyantang.dev"],
        ["GitHub", "https://github.com/shuyantang"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "education",
        type: "education",
        title: "教育与进修",
        items: [
          createItem({
            id: "campus-switch-edu-1",
            title: "西南财经大学",
            subtitle: "工商管理 学士",
            dateRange: "2015 - 2019",
          }),
          createItem({
            id: "campus-switch-edu-2",
            title: "前端工程训练营",
            subtitle: "系统课程",
            dateRange: "2024",
            bulletPoints: ["完成 React、TypeScript、组件设计和工程化模块训练，并独立交付毕业项目。"],
          }),
        ],
      }),
      createSection({
        id: "experience",
        type: "experience",
        title: "相关经历",
        items: [
          createItem({
            id: "campus-switch-exp-1",
            title: "产品运营",
            subtitle: "禾木教育",
            location: "成都",
            dateRange: "2020.03 - 2024.05",
            bulletPoints: [
              "负责需求整理、活动上线和数据复盘，培养了扎实的业务拆解与协同推进能力。",
              "主导 10+ 次活动页迭代评审，对页面结构、文案与转化路径有成熟判断。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "转岗项目",
        items: [
          createItem({
            id: "campus-switch-project-1",
            title: "课程预约后台",
            subtitle: "个人项目",
            dateRange: "2025",
            bulletPoints: [
              "实现登录、筛选、订单详情和状态流转模块，并接入模拟接口完成整体验证。",
              "通过组件拆分与表单抽象减少重复逻辑，提升后续迭代效率。",
            ],
            tags: ["React", "TypeScript", "Zod"],
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "技能清单",
        layout: "tag-grid",
        items: [
          createItem({
            id: "campus-switch-skills-1",
            title: "技能",
            tags: ["React", "TypeScript", "Next.js", "需求分析", "跨团队协作", "组件化开发"],
          }),
        ],
      }),
    ],
  };
}

function portfolioExperiencedSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "许闻笙",
      headline: "资深品牌设计师｜视觉系统与内容表达",
      location: "上海",
      email: "wensheng.xu@example.com",
      phone: "138-0000-4621",
      website: "wenshengxu.com",
      summaryHtml:
        "<p>7 年品牌与体验设计经验，擅长将品牌策略转化为一致、可复用的视觉系统。长期负责从概念提案到落地执行的完整链路，兼顾视觉质量、内容表达和跨媒介交付效率。</p>",
      links: createLinks(
        ["作品集", "https://wenshengxu.com/portfolio"],
        ["Behance", "https://behance.net/wenshengxu"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "experience",
        type: "experience",
        title: "工作经历",
        items: [
          createItem({
            id: "portfolio-exp-1",
            title: "资深品牌设计师",
            subtitle: "栖木创意",
            location: "上海",
            dateRange: "2021.04 - 至今",
            bulletPoints: [
              "为 12 个消费与文化品牌搭建视觉体系，覆盖标识、包装、社媒与线下物料。",
              "主导品牌升级项目的提案和落地，客户续约率提升到 78%。",
            ],
          }),
          createItem({
            id: "portfolio-exp-2",
            title: "视觉设计师",
            subtitle: "回声传媒",
            location: "杭州",
            dateRange: "2018.06 - 2021.03",
            bulletPoints: ["负责 campaign KV、社媒内容模板与设计规范沉淀，交付周期缩短约 25%。"],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "代表项目",
        items: [
          createItem({
            id: "portfolio-project-1",
            title: "新消费品牌焕新",
            subtitle: "品牌视觉升级",
            dateRange: "2024",
            summaryHtml:
              "<p>从品牌定位访谈、视觉关键词提炼到包装和电商首屏规范，完成整套升级方案。</p>",
            bulletPoints: ["统一品牌资产与模板后，客户内部内容制作效率提升 40% 以上。"],
            tags: ["品牌系统", "包装", "内容模板"],
          }),
        ],
      }),
      createSection({
        id: "education",
        type: "education",
        title: "教育经历",
        items: [
          createItem({
            id: "portfolio-edu-1",
            title: "中国美术学院",
            subtitle: "视觉传达设计 本科",
            dateRange: "2014 - 2018",
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "专业工具",
        layout: "tag-grid",
        items: [
          createItem({
            id: "portfolio-skills-1",
            title: "技能",
            tags: ["Brand System", "Figma", "Adobe CC", "Art Direction", "Packaging", "Presentation"],
          }),
        ],
      }),
    ],
  };
}

function portfolioCampusSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "叶青禾",
      headline: "视觉设计 / 品牌设计应届生",
      location: "广州",
      email: "qinghe.ye@example.com",
      phone: "136-0000-5230",
      website: "qinghe-portfolio.com",
      summaryHtml:
        "<p>视觉传达专业应届生，关注品牌叙事、版式与内容表达。擅长从主题洞察出发完成完整视觉方案，在毕业设计、校园展陈和实习项目中持续输出成熟的提案与执行物料。</p>",
      links: createLinks(
        ["作品集", "https://qinghe-portfolio.com"],
        ["Behance", "https://behance.net/qingheye"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "education",
        type: "education",
        title: "教育经历",
        items: [
          createItem({
            id: "portfolio-campus-edu-1",
            title: "广州美术学院",
            subtitle: "视觉传达设计 本科",
            dateRange: "2022 - 2026",
            meta: "毕业设计优秀奖｜品牌方向",
          }),
        ],
      }),
      createSection({
        id: "experience",
        type: "experience",
        title: "实习经历",
        items: [
          createItem({
            id: "portfolio-campus-exp-1",
            title: "视觉设计实习生",
            subtitle: "零度创意",
            location: "广州",
            dateRange: "2025.06 - 2025.09",
            bulletPoints: [
              "协助完成品牌提案版式、社媒模板和活动主视觉延展，累计交付 30+ 页提案文件。",
              "在导师指导下参与客户沟通和修改复盘，显著提升了提案表达完整度。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "项目与作品",
        items: [
          createItem({
            id: "portfolio-campus-project-1",
            title: "城市书店品牌策划",
            subtitle: "毕业设计",
            dateRange: "2025",
            bulletPoints: ["完成品牌定位、视觉系统和空间导视提案，输出完整作品集页面。"],
            tags: ["品牌策略", "版式设计", "导视系统"],
          }),
          createItem({
            id: "portfolio-campus-project-2",
            title: "校园艺术节主视觉",
            subtitle: "校内项目",
            dateRange: "2024",
            bulletPoints: ["负责主视觉、展板和线上传播素材设计，活动到场人数同比增长 18%。"],
            tags: ["主视觉", "海报设计", "活动物料"],
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "专业工具",
        layout: "tag-grid",
        items: [
          createItem({
            id: "portfolio-campus-skills-1",
            title: "技能",
            tags: ["Figma", "Illustrator", "Photoshop", "InDesign", "品牌提案", "版式设计"],
          }),
        ],
      }),
    ],
  };
}

function portfolioSwitchSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "梁以沫",
      headline: "内容策划转品牌设计候选人",
      location: "杭州",
      email: "yimo.liang@example.com",
      phone: "137-0000-6242",
      website: "yimoliang.design",
      summaryHtml:
        "<p>原内容策划，近两年逐步转向品牌与视觉设计。具备扎实的叙事能力、品牌理解和提案表达能力，已通过多个项目把概念整理、版式控制和视觉执行能力沉淀为稳定输出。</p>",
      links: createLinks(
        ["作品集", "https://yimoliang.design"],
        ["Notion", "https://yimoliang.notion.site"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "experience",
        type: "experience",
        title: "相关经历",
        items: [
          createItem({
            id: "portfolio-switch-exp-1",
            title: "品牌设计自由项目",
            subtitle: "独立接案",
            dateRange: "2024.05 - 至今",
            bulletPoints: [
              "为餐饮和生活方式品牌完成 LOGO、菜单和社媒模板设计，累计交付 6 个完整方案。",
              "基于原有内容策划经验强化品牌叙事，使提案通过率稳定在 70% 以上。",
            ],
          }),
          createItem({
            id: "portfolio-switch-exp-2",
            title: "内容策划经理",
            subtitle: "木序文化",
            dateRange: "2019.08 - 2024.04",
            bulletPoints: ["负责品牌内容策略与 campaign 文案，沉淀出清晰的品牌语调和内容框架。"],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "转岗案例",
        items: [
          createItem({
            id: "portfolio-switch-project-1",
            title: "烘焙品牌视觉重塑",
            subtitle: "个人案例",
            dateRange: "2025",
            bulletPoints: ["从品牌故事梳理到包装视觉延展，完成可直接用于作品集展示的完整案例。"],
            tags: ["品牌叙事", "视觉系统", "包装设计"],
          }),
        ],
      }),
      createSection({
        id: "education",
        type: "education",
        title: "教育与进修",
        items: [
          createItem({
            id: "portfolio-switch-edu-1",
            title: "浙江工商大学",
            subtitle: "新闻传播 学士",
            dateRange: "2014 - 2018",
          }),
          createItem({
            id: "portfolio-switch-edu-2",
            title: "品牌视觉专项训练",
            subtitle: "独立进修",
            dateRange: "2024",
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "专业工具",
        layout: "tag-grid",
        items: [
          createItem({
            id: "portfolio-switch-skills-1",
            title: "技能",
            tags: ["Figma", "Illustrator", "品牌叙事", "版式设计", "内容策略", "提案表达"],
          }),
        ],
      }),
    ],
  };
}

function engineerExperiencedSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "陈牧川",
      headline: "Staff Frontend Engineer｜平台化与设计系统",
      location: "上海",
      email: "muchuan.chen@example.com",
      phone: "139-0000-7816",
      website: "muchuan.dev",
      summaryHtml:
        "<p>10 年前端工程经验，近 4 年聚焦多团队共享平台、设计系统和复杂工作台产品。擅长统一组件契约、重构前端架构并推动性能治理，让研发效率和交付稳定性一起提升。</p>",
      links: createLinks(
        ["GitHub", "https://github.com/muchuanchen"],
        ["技术博客", "https://muchuan.dev/blog"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "sidebar",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "experience",
        type: "experience",
        title: "工作经历",
        items: [
          createItem({
            id: "engineer-exp-1",
            title: "Staff Frontend Engineer",
            subtitle: "链路云",
            location: "上海",
            dateRange: "2021.08 - 至今",
            meta: "平台前端 / 设计系统",
            bulletPoints: [
              "主导 3 条业务线前端架构统一和组件契约治理，季度交付周期缩短约 28%。",
              "搭建设计系统发布链路与文档站，覆盖 80+ 组件，跨团队复用率提升到 75%。",
              "推动 SSR、分包和渲染性能优化，核心工作台首屏时间下降 35%。",
            ],
          }),
          createItem({
            id: "engineer-exp-2",
            title: "Senior Frontend Engineer",
            subtitle: "深度互动",
            location: "杭州",
            dateRange: "2018.04 - 2021.07",
            bulletPoints: [
              "负责中后台复杂表单与可视化页面建设，提升运营团队日常配置效率。",
              "建立自动化测试和发布检查流程，将线上回归问题减少 40% 以上。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "关键项目",
        items: [
          createItem({
            id: "engineer-project-1",
            title: "Design System 2.0",
            subtitle: "跨团队共享组件体系",
            dateRange: "2024",
            bulletPoints: [
              "定义 token、组件 API 和升级策略，完成 5 个业务域的渐进迁移。",
              "沉淀 Playwright 回归集和可视化对比流程，提高版本发布信心。",
            ],
            tags: ["React", "TypeScript", "Playwright", "Design Tokens"],
          }),
        ],
      }),
      createSection({
        id: "education",
        type: "education",
        title: "教育经历",
        items: [
          createItem({
            id: "engineer-edu-1",
            title: "东南大学",
            subtitle: "软件工程 本科",
            dateRange: "2010 - 2014",
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "技术栈",
        layout: "tag-grid",
        items: [
          createItem({
            id: "engineer-skills-1",
            title: "技能",
            tags: [
              "React",
              "TypeScript",
              "Next.js",
              "Node.js",
              "Design Systems",
              "Performance",
              "Playwright",
              "Architecture",
            ],
          }),
        ],
      }),
    ],
  };
}

function engineerCampusSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "宋知一",
      headline: "前端研发 / 平台工程应届生",
      location: "西安",
      email: "zhiyi.song@example.com",
      phone: "135-0000-8904",
      website: "zhiyisong.dev",
      summaryHtml:
        "<p>软件工程应届生，重点方向为前端平台与组件化开发。熟悉 React、TypeScript、自动化测试和工程化协作，能在复杂需求中保持结构清晰，并通过项目证明交付能力与学习速度。</p>",
      links: createLinks(
        ["GitHub", "https://github.com/zhiyisong"],
        ["作品集", "https://zhiyisong.dev"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "sidebar",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "education",
        type: "education",
        title: "教育经历",
        items: [
          createItem({
            id: "engineer-campus-edu-1",
            title: "西安电子科技大学",
            subtitle: "软件工程 本科",
            location: "西安",
            dateRange: "2022 - 2026",
            meta: "GPA 3.84/4.0｜校级科技竞赛二等奖",
          }),
        ],
      }),
      createSection({
        id: "experience",
        type: "experience",
        title: "实习经历",
        items: [
          createItem({
            id: "engineer-campus-exp-1",
            title: "前端开发实习生",
            subtitle: "深行科技",
            location: "西安",
            dateRange: "2025.07 - 2025.10",
            bulletPoints: [
              "参与企业工作台模块开发与回归测试，交付 6 个运营页面与 10+ 个缺陷修复。",
              "补充 Playwright 自动化用例，帮助团队将关键流程回归时间缩短约 60%。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "项目经历",
        items: [
          createItem({
            id: "engineer-campus-project-1",
            title: "组件库管理台",
            subtitle: "个人项目",
            dateRange: "2025",
            bulletPoints: [
              "实现组件文档、属性面板和版本切换，支持快速预览和配置导出。",
              "接入单元测试与 E2E 检查，保证升级过程稳定。",
            ],
            tags: ["React", "Vitest", "Playwright"],
          }),
          createItem({
            id: "engineer-campus-project-2",
            title: "校园任务协作平台",
            subtitle: "团队项目",
            dateRange: "2024",
            bulletPoints: ["负责任务看板、筛选和权限模块，推动团队按时完成结项答辩。"],
            tags: ["TypeScript", "Tailwind CSS", "API Integration"],
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "技术栈",
        layout: "tag-grid",
        items: [
          createItem({
            id: "engineer-campus-skills-1",
            title: "技能",
            tags: ["React", "TypeScript", "Next.js", "Playwright", "Vitest", "Git", "Node.js"],
          }),
        ],
      }),
    ],
  };
}

function engineerSwitchSeed(): TemplateStarterSeed {
  return {
    basics: {
      name: "方砚秋",
      headline: "测试工程师转前端工程候选人",
      location: "苏州",
      email: "yanqiu.fang@example.com",
      phone: "136-0000-9642",
      website: "yanqiufang.dev",
      summaryHtml:
        "<p>原测试工程师，近两年逐步转向前端工程。具备扎实的质量意识、自动化测试和问题定位能力，结合 React 与 TypeScript 项目实践，能够以工程视角交付稳定、可维护的前端模块。</p>",
      links: createLinks(
        ["GitHub", "https://github.com/yanqiufang"],
        ["项目集", "https://yanqiufang.dev"],
      ),
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "sidebar",
      photoSizeMm: 28,
    },
    sections: [
      createSection({
        id: "experience",
        type: "experience",
        title: "相关经历",
        items: [
          createItem({
            id: "engineer-switch-exp-1",
            title: "前端工程项目",
            subtitle: "个人与接包实践",
            dateRange: "2024.06 - 至今",
            bulletPoints: [
              "独立完成运营后台、表单工作流和数据看板页面，形成可复用的组件与校验逻辑。",
              "将测试视角带入前端实现，接入单元测试与 E2E 回归，减少交付返工。",
            ],
            tags: ["React", "TypeScript", "Testing"],
          }),
          createItem({
            id: "engineer-switch-exp-2",
            title: "自动化测试工程师",
            subtitle: "澜石软件",
            location: "苏州",
            dateRange: "2019.03 - 2024.05",
            bulletPoints: [
              "负责 Web 自动化与稳定性建设，推动关键流程自动化覆盖率提升到 85%。",
              "与前端团队协作定位渲染与交互问题，沉淀出一套高频缺陷检查清单。",
            ],
          }),
        ],
      }),
      createSection({
        id: "projects",
        type: "projects",
        title: "转岗项目",
        items: [
          createItem({
            id: "engineer-switch-project-1",
            title: "营销运营工作台",
            subtitle: "独立项目",
            dateRange: "2025",
            bulletPoints: [
              "完成筛选、列表、详情抽屉与状态流转模块，实现完整业务闭环。",
              "设计可复用的表单 Schema 和错误提示机制，提升表单交互稳定性。",
            ],
            tags: ["Next.js", "Zod", "Playwright"],
          }),
        ],
      }),
      createSection({
        id: "education",
        type: "education",
        title: "教育与进修",
        items: [
          createItem({
            id: "engineer-switch-edu-1",
            title: "南京理工大学",
            subtitle: "信息管理与信息系统 本科",
            dateRange: "2014 - 2018",
          }),
        ],
      }),
      createSection({
        id: "skills",
        type: "skills",
        title: "技术栈",
        layout: "tag-grid",
        items: [
          createItem({
            id: "engineer-switch-skills-1",
            title: "技能",
            tags: ["React", "TypeScript", "Playwright", "Vitest", "Zod", "Testing", "Problem Solving"],
          }),
        ],
      }),
    ],
  };
}

export const templateCatalog: TemplateCatalogItem[] = [
  {
    id: "aurora-grid",
    name: "Aurora Grid",
    subtitle: "双栏 · 通用",
    category: "通用",
    family: "two-column",
    accent: "#3058b7",
    background:
      "linear-gradient(180deg, rgba(48, 88, 183, 0.15) 0%, rgba(48, 88, 183, 0.04) 100%)",
    summary: "适合大多数成熟岗位，信息密度高，结构稳定，适合直接修改成正式投递版。",
    highlights: ["双栏结构", "成熟稳健", "适配面广"],
    recommendedProfiles: ["experienced", "career-switch"],
    previewImage: "/template-previews/aurora-grid.png",
    previewAlt: "Aurora Grid 模板预览图",
    layoutPreset: {
      accentColor: "#3058b7",
      bodyFont: "Aptos",
      headingFont: "Iowan Old Style",
      customCss: "",
      pageBackground: "#f3ede4",
      paperColor: "#fffdf8",
      textColor: "#182132",
      mutedTextColor: "#49556a",
      dividerColor: "rgba(24, 33, 50, 0.15)",
      linkColor: "#3058b7",
      marginsMm: 14,
      lineHeight: 1.45,
      paragraphGapMm: 3,
      bodyFontSizePt: 9.7,
      sectionTitleSizePt: 11,
      itemTitleSizePt: 11,
      metaFontSizePt: 9,
      nameSizePt: 24,
      headlineSizePt: 11,
      sectionGapMm: 6,
      itemGapMm: 5,
      columnGapMm: 10,
      listGapMm: 0.8,
      headerAlign: "left",
      sectionTitleAlign: "left",
      sectionTitleStyle: "line",
      pageShadowVisible: true,
      showSectionDividers: true,
      pageSize: "A4",
    },
    starterSeeds: {
      experienced: auroraExperiencedSeed(),
      campus: auroraCampusSeed(),
      "career-switch": auroraCareerSwitchSeed(),
    },
  },
  {
    id: "campus-line",
    name: "Campus Line",
    subtitle: "双栏 · 校招",
    category: "校招",
    family: "two-column",
    accent: "#0f766e",
    background:
      "linear-gradient(180deg, rgba(15, 118, 110, 0.16) 0%, rgba(15, 118, 110, 0.04) 100%)",
    summary: "教育、实习和项目表达更靠前，适合校园招聘、培训生申请和刚毕业的第一份简历。",
    highlights: ["教育前置", "项目友好", "清爽专业"],
    recommendedProfiles: ["campus"],
    previewImage: "/template-previews/campus-line.png",
    previewAlt: "Campus Line 模板预览图",
    layoutPreset: {
      accentColor: "#0f766e",
      bodyFont: "Segoe UI",
      headingFont: "Iowan Old Style",
      customCss: "",
      pageBackground: "#eef4f2",
      paperColor: "#fffdfb",
      textColor: "#1c2430",
      mutedTextColor: "#4e5c67",
      dividerColor: "rgba(28, 36, 48, 0.12)",
      linkColor: "#0f766e",
      marginsMm: 14,
      lineHeight: 1.46,
      paragraphGapMm: 2.8,
      bodyFontSizePt: 9.6,
      sectionTitleSizePt: 10.7,
      itemTitleSizePt: 10.8,
      metaFontSizePt: 8.9,
      nameSizePt: 23,
      headlineSizePt: 10.8,
      sectionGapMm: 5.2,
      itemGapMm: 4.4,
      columnGapMm: 9,
      listGapMm: 0.7,
      headerAlign: "left",
      sectionTitleAlign: "left",
      sectionTitleStyle: "filled",
      pageShadowVisible: true,
      showSectionDividers: false,
      pageSize: "A4",
    },
    starterSeeds: {
      experienced: campusExperiencedSeed(),
      campus: campusCampusSeed(),
      "career-switch": campusSwitchSeed(),
    },
  },
  {
    id: "portfolio-brief",
    name: "Portfolio Brief",
    subtitle: "单栏 · 设计",
    category: "设计",
    family: "single-column",
    accent: "#875a3c",
    background:
      "linear-gradient(180deg, rgba(135, 90, 60, 0.13) 0%, rgba(135, 90, 60, 0.03) 100%)",
    summary: "留白更充足，强调项目叙事与阅读节奏，适合设计、品牌、内容和作品集型岗位。",
    highlights: ["单栏阅读", "叙事完整", "高级留白"],
    recommendedProfiles: ["experienced", "career-switch"],
    previewImage: "/template-previews/portfolio-brief.png",
    previewAlt: "Portfolio Brief 模板预览图",
    layoutPreset: {
      accentColor: "#875a3c",
      bodyFont: "Georgia",
      headingFont: "Times New Roman",
      customCss: "",
      pageBackground: "#ede6dc",
      paperColor: "#fffdf8",
      textColor: "#182132",
      mutedTextColor: "#5f6b7d",
      dividerColor: "rgba(24, 33, 50, 0.12)",
      linkColor: "#875a3c",
      marginsMm: 16,
      lineHeight: 1.5,
      paragraphGapMm: 2.5,
      bodyFontSizePt: 9.7,
      sectionTitleSizePt: 12,
      itemTitleSizePt: 11,
      metaFontSizePt: 9,
      nameSizePt: 26,
      headlineSizePt: 10.5,
      sectionGapMm: 5,
      itemGapMm: 4.2,
      columnGapMm: 0,
      listGapMm: 0.8,
      headerAlign: "center",
      sectionTitleAlign: "left",
      sectionTitleStyle: "line",
      pageShadowVisible: true,
      showSectionDividers: true,
      pageSize: "A4",
    },
    starterSeeds: {
      experienced: portfolioExperiencedSeed(),
      campus: portfolioCampusSeed(),
      "career-switch": portfolioSwitchSeed(),
    },
  },
  {
    id: "engineer-pro",
    name: "Engineer Pro",
    subtitle: "双栏 · 技术",
    category: "技术",
    family: "two-column",
    accent: "#3347a0",
    background:
      "linear-gradient(180deg, rgba(51, 71, 160, 0.16) 0%, rgba(51, 71, 160, 0.04) 100%)",
    summary: "更适合技术岗位，把项目、技术栈和结果表达放在前面，便于招聘经理快速扫读。",
    highlights: ["工程导向", "结果明确", "技术栈突出"],
    recommendedProfiles: ["experienced", "campus"],
    previewImage: "/template-previews/engineer-pro.png",
    previewAlt: "Engineer Pro 模板预览图",
    layoutPreset: {
      accentColor: "#3347a0",
      bodyFont: "Aptos",
      headingFont: "Aptos Display",
      customCss: "",
      pageBackground: "#eff1f7",
      paperColor: "#fffdfc",
      textColor: "#172034",
      mutedTextColor: "#4b566a",
      dividerColor: "rgba(23, 32, 52, 0.12)",
      linkColor: "#3347a0",
      marginsMm: 13,
      lineHeight: 1.4,
      paragraphGapMm: 2.6,
      bodyFontSizePt: 9.4,
      sectionTitleSizePt: 10.6,
      itemTitleSizePt: 10.8,
      metaFontSizePt: 8.7,
      nameSizePt: 23,
      headlineSizePt: 10.7,
      sectionGapMm: 4.9,
      itemGapMm: 4,
      columnGapMm: 8.5,
      listGapMm: 0.6,
      headerAlign: "left",
      sectionTitleAlign: "left",
      sectionTitleStyle: "minimal",
      pageShadowVisible: true,
      showSectionDividers: false,
      pageSize: "A4",
    },
    starterSeeds: {
      experienced: engineerExperiencedSeed(),
      campus: engineerCampusSeed(),
      "career-switch": engineerSwitchSeed(),
    },
  },
];

export const templateCatalogById = Object.fromEntries(
  templateCatalog.map((item) => [item.id, item]),
) as Record<ResumeTemplate, TemplateCatalogItem>;

export const templateCategories = ["全部", "通用", "校招", "设计", "技术"] as const;

export const resumeTemplateOptions = templateCatalog.map((template) => ({
  value: template.id,
  label: template.name,
  description: template.summary,
}));

export function getTemplateCatalogItem(template: ResumeTemplate) {
  return templateCatalogById[template];
}

export function getTemplateFamily(template: ResumeTemplate) {
  return templateCatalogById[template].family;
}

export function getTemplateStarterSeed(
  template: ResumeTemplate,
  writerProfile: ResumeWriterProfile,
) {
  return templateCatalogById[template].starterSeeds[writerProfile];
}
