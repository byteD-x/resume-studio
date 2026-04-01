import { createItem, createLinks, createSection } from "./shared";
import type { TemplateCatalogItem, TemplateStarterSeed } from "./shared";

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

export const engineerProTemplate: TemplateCatalogItem = {
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
};
