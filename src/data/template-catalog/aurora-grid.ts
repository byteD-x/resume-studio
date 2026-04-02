import { createItem, createLinks, createSection } from "./shared";
import type { TemplateCatalogItem, TemplateStarterSeed } from "./shared";

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


export const auroraGridTemplate: TemplateCatalogItem = {
    id: "aurora-grid",
    name: "极光网格",
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
    previewAlt: "极光网格 模板预览图",
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
};
