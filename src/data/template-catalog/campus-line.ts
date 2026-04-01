import { createItem, createLinks, createSection } from "./shared";
import type { TemplateCatalogItem, TemplateStarterSeed } from "./shared";

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


export const campusLineTemplate: TemplateCatalogItem = {
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
};
