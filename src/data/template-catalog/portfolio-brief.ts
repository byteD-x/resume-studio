import { createItem, createLinks, createSection } from "./shared";
import type { TemplateCatalogItem, TemplateStarterSeed } from "./shared";

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


export const portfolioBriefTemplate: TemplateCatalogItem = {
    id: "portfolio-brief",
    name: "作品集简报",
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
    previewAlt: "作品集简报 模板预览图",
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
};
