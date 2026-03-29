import {
  CURRENT_RESUME_SCHEMA_VERSION,
  resumeDocumentSchema,
  type ResumeDocument,
  type ResumeSection,
  type ResumeSectionItem,
  type ResumeTemplate,
  type ResumeWriterProfile,
} from "@/types/resume";
import { createId, nowIso } from "@/lib/utils";

export type ResumeStarterPreset = "blank" | "guided";

export const resumeWriterProfileMeta: Record<
  ResumeWriterProfile,
  {
    label: string;
    shortLabel: string;
    description: string;
    summaryPrompt: string;
    workflowSteps: string[];
  }
> = {
  campus: {
    label: "校招 / 应届",
    shortLabel: "校招",
    description: "适合应届、实习和校园转正申请，优先突出项目、实习和学习成果。",
    summaryPrompt:
      "先写清楚你的求职方向、教育阶段或实习阶段，再补一句最能证明潜力或成果的经历。",
    workflowSteps: [
      "先补齐教育信息、求职方向和联系方式。",
      "优先把实习、校园经历和项目经历写成结果型要点。",
      "最后再补目标岗位和关键词，生成岗位定制版。",
    ],
  },
  experienced: {
    label: "有经验求职",
    shortLabel: "社招",
    description: "适合已有工作经验的求职者，优先突出业务影响、职责范围和结果证明。",
    summaryPrompt:
      "先用 2 到 3 句话写清楚你的方向、年限、核心能力，再补一句最能证明价值的结果。",
    workflowSteps: [
      "先填写姓名、职位标题、联系方式和职业摘要。",
      "按影响力排序重写工作经历和项目经历，优先保留结果型内容。",
      "最后补齐目标岗位、JD 和关键词，用于生成岗位定制版。",
    ],
  },
  "career-switch": {
    label: "转岗 / 跨行业",
    shortLabel: "转岗",
    description: "适合跨岗位或跨行业求职，重点强调可迁移能力、相关项目和新方向证明。",
    summaryPrompt:
      "先交代你要转向的岗位，再补充过往经验里可迁移的能力，以及最能证明转型准备度的结果。",
    workflowSteps: [
      "先写清楚新方向、可迁移能力和联系方式。",
      "把旧岗位经历改写成与新方向相关的成果和能力证明。",
      "补充目标岗位、JD 和关键词，检查转岗叙事是否足够聚焦。",
    ],
  },
};

export const resumeTemplateLayoutPresets: Record<
  ResumeTemplate,
  ResumeDocument["layout"]
> = {
  "modern-two-column": {
    accentColor: "#3559b7",
    bodyFont: "Aptos",
    headingFont: "Iowan Old Style",
    marginsMm: 14,
    lineHeight: 1.45,
    paragraphGapMm: 3,
    pageSize: "A4",
  },
  "classic-single-column": {
    accentColor: "#7b4b32",
    bodyFont: "Georgia",
    headingFont: "Times New Roman",
    marginsMm: 16,
    lineHeight: 1.5,
    paragraphGapMm: 2.5,
    pageSize: "A4",
  },
};

export function getResumeTemplateLayoutPreset(template: ResumeTemplate) {
  return resumeTemplateLayoutPresets[template];
}

function createStarterItem(input: Partial<ResumeSectionItem>): ResumeSectionItem {
  return {
    id: createId("item"),
    title: "",
    subtitle: "",
    location: "",
    dateRange: "",
    meta: "",
    summaryHtml: "<p></p>",
    bulletPoints: [],
    tags: [],
    ...input,
  };
}

function createStarterSection(input: Partial<ResumeSection> & Pick<ResumeSection, "type" | "title">) {
  return {
    id: createId("section"),
    visible: true,
    layout: "stacked-list",
    contentHtml: "",
    items: [],
    ...input,
  } satisfies ResumeSection;
}

function createBlankSections(writerProfile: ResumeWriterProfile) {
  const sections: ResumeSection[] = [];

  if (writerProfile === "campus") {
    sections.push(
      createStarterSection({
        type: "education",
        title: "教育经历",
      }),
    );
  }

  sections.push(
    createStarterSection({
      type: "experience",
      title: writerProfile === "campus" ? "实习 / 校园经历" : "工作经历",
    }),
    createStarterSection({
      type: "projects",
      title: "项目经历",
    }),
    createStarterSection({
      type: "skills",
      title: "技能清单",
      layout: "tag-grid",
    }),
  );

  if (writerProfile !== "campus") {
    sections.push(
      createStarterSection({
        type: "education",
        title: "教育经历",
      }),
    );
  }

  return sections;
}

function createGuidedSections(writerProfile: ResumeWriterProfile) {
  if (writerProfile === "campus") {
    return [
      createStarterSection({
        type: "education",
        title: "教育经历",
        items: [
          createStarterItem({
            title: "学校 / 专业",
            subtitle: "学历 / 年级",
            dateRange: "2021 - 2025",
            meta: "课程 / 荣誉 / GPA（如需要）",
            summaryHtml: "<p>如果成绩、竞赛、奖学金或课题和目标岗位强相关，可以补在这里。</p>",
          }),
        ],
      }),
      createStarterSection({
        type: "experience",
        title: "实习 / 校园经历",
        contentHtml: "<p>优先写最能证明执行力、协作能力和岗位相关度的经历。</p>",
        items: [
          createStarterItem({
            title: "公司 / 社团 / 实验室",
            subtitle: "实习岗位 / 校园角色",
            location: "城市 / 远程",
            dateRange: "2024.06 - 2024.09",
            meta: "团队 / 场景 / 职责范围",
            summaryHtml: "<p>先交代这段经历是什么场景、你负责什么，再写具体成果。</p>",
            bulletPoints: [
              "写 1 条结果型要点：动作 + 场景 + 做法 + 结果。",
              "写 1 条能体现潜力或责任心的要点，尽量补上数字或影响。",
            ],
            tags: ["实习", "校园经历"],
          }),
        ],
      }),
      createStarterSection({
        type: "projects",
        title: "项目经历",
        contentHtml: "<p>优先保留能体现能力密度、完成度和个人贡献的项目。</p>",
        items: [
          createStarterItem({
            title: "项目名称",
            subtitle: "你的角色",
            dateRange: "2024.01 - 2024.04",
            meta: "课程项目 / 个人项目 / 比赛项目",
            summaryHtml: "<p>用一句话说清项目目标、用户或场景，再写你负责的关键部分。</p>",
            bulletPoints: [
              "写 1 条最能体现方案设计、实现或推进能力的要点。",
              "写 1 条结果型要点，说明项目最终交付了什么、带来了什么结果。",
            ],
            tags: ["项目类型", "关键词"],
          }),
        ],
      }),
      createStarterSection({
        type: "skills",
        title: "技能清单",
        layout: "tag-grid",
        contentHtml: "<p>按领域分组列技能，避免把名词堆成一行。</p>",
        items: [
          createStarterItem({
            title: "核心能力分组",
            summaryHtml: "<p>例如：产品分析、数据工具、前端开发、办公协作。</p>",
            tags: ["技能 A", "技能 B", "技能 C"],
          }),
        ],
      }),
    ];
  }

  if (writerProfile === "career-switch") {
    return [
      createStarterSection({
        type: "experience",
        title: "相关经历",
        contentHtml: "<p>优先重写与你要转向的岗位最相关、最可迁移的经历，不需要平均分配篇幅。</p>",
        items: [
          createStarterItem({
            title: "公司名称",
            subtitle: "原岗位 / 可迁移职责",
            location: "城市 / 远程",
            dateRange: "2022.03 - 至今",
            meta: "业务场景 / 团队 / 关键职责",
            summaryHtml: "<p>先交代背景，再说明这段经历里哪些能力可以迁移到目标岗位。</p>",
            bulletPoints: [
              "写 1 条与你目标岗位最相关的成果或推进动作。",
              "写 1 条证明你具备可迁移能力的要点，例如沟通、分析、交付或系统化能力。",
            ],
            tags: ["可迁移能力", "相关经验"],
          }),
        ],
      }),
      createStarterSection({
        type: "projects",
        title: "转岗证明项目",
        contentHtml: "<p>优先放转岗准备阶段做过的项目、作品或课程产出，证明你不是只停留在兴趣层面。</p>",
        items: [
          createStarterItem({
            title: "项目名称 / 作品名称",
            subtitle: "你的角色",
            dateRange: "2024.01 - 2024.06",
            meta: "项目目标 / 证明点",
            summaryHtml: "<p>用一句话说清这个项目为什么能证明你适合新方向。</p>",
            bulletPoints: [
              "写 1 条最能体现新方向能力的动作或方案。",
              "写 1 条结果型要点，说明交付、反馈、效率或质量提升。",
            ],
            tags: ["新方向", "转岗证明"],
          }),
        ],
      }),
      createStarterSection({
        type: "skills",
        title: "相关能力",
        layout: "tag-grid",
        contentHtml: "<p>只保留与目标岗位有关的技能和方法论，避免继续围绕旧岗位堆信息。</p>",
        items: [
          createStarterItem({
            title: "能力分组",
            summaryHtml: "<p>例如：项目推进、用户研究、数据分析、前端开发。</p>",
            tags: ["能力 A", "能力 B", "能力 C"],
          }),
        ],
      }),
      createStarterSection({
        type: "education",
        title: "教育 / 补充学习",
        items: [
          createStarterItem({
            title: "学校 / 课程 / 训练营",
            subtitle: "学历 / 证书",
            dateRange: "2018 - 2022",
            meta: "如与转岗强相关，可写课程、训练项目或认证。",
            summaryHtml: "<p>如果你通过课程、训练营或证书来补足转岗能力，可以在这里补充。</p>",
          }),
        ],
      }),
    ];
  }

  return [
    createStarterSection({
      type: "experience",
      title: "工作经历",
      contentHtml: "<p>优先保留最能证明岗位匹配度的经历，按影响力排序。</p>",
      items: [
        createStarterItem({
          title: "公司名称",
          subtitle: "职位名称",
          location: "城市 / 远程",
          dateRange: "2022.03 - 至今",
          meta: "业务线 / 团队 / 技术栈",
          summaryHtml:
            "<p>先交代你的职责范围、负责模块或业务背景，让招聘方知道你处在什么场景里。</p>",
          bulletPoints: [
            "写 1 条结果型要点：动词开头，补充指标、规模或业务影响。",
            "写 1 条难题型要点：说明你解决了什么问题，以及关键做法。",
          ],
          tags: ["领域", "技术栈"],
        }),
      ],
    }),
    createStarterSection({
      type: "projects",
      title: "项目经历",
      contentHtml: "<p>挑能体现能力密度、ownership 和结果的项目，不需要堆数量。</p>",
      items: [
        createStarterItem({
          title: "项目名称",
          subtitle: "你的角色",
          dateRange: "2024.01 - 2024.06",
          meta: "项目目标 / 使用场景",
          summaryHtml:
            "<p>用一句话概括项目的目标、用户对象或业务价值，再写你负责的关键部分。</p>",
          bulletPoints: [
            "写 1 条最能体现方案设计或落地能力的要点。",
            "写 1 条有数据、有结果的要点，证明这不是只做了而已。",
          ],
          tags: ["项目类型", "关键词"],
        }),
      ],
    }),
    createStarterSection({
      type: "skills",
      title: "技能清单",
      layout: "tag-grid",
      contentHtml: "<p>把技能按领域分组，避免简单罗列所有会过的名词。</p>",
      items: [
        createStarterItem({
          title: "核心能力分组",
          summaryHtml: "<p>例如：前端工程、后端工程、数据分析、产品设计。</p>",
          tags: ["技能 A", "技能 B", "技能 C"],
        }),
      ],
    }),
    createStarterSection({
      type: "education",
      title: "教育经历",
      items: [
        createStarterItem({
          title: "学校 / 专业",
          subtitle: "学历",
          dateRange: "2018 - 2022",
          meta: "相关课程 / 荣誉 / GPA（如需要）",
          summaryHtml: "<p>如果是校招生或转岗阶段，这一节可以适当补充亮点。</p>",
        }),
      ],
    }),
  ];
}

export function createEmptyResumeDocument(
  id = "default",
  title = "主简历",
  options: { writerProfile?: ResumeWriterProfile } = {},
) {
  const writerProfile = options.writerProfile ?? "experienced";
  const document: ResumeDocument = {
    meta: {
      id,
      title,
      schemaVersion: CURRENT_RESUME_SCHEMA_VERSION,
      locale: "zh-CN",
      writerProfile,
      template: "modern-two-column",
      workflowState: "drafting",
      updatedAt: nowIso(),
      sourceRefs: [`writer-profile:${writerProfile}`],
    },
    basics: {
      name: "",
      headline: "",
      location: "",
      email: "",
      phone: "",
      website: "",
      summaryHtml: `<p>${resumeWriterProfileMeta[writerProfile].summaryPrompt}</p>`,
      links: [],
    },
    targeting: {
      role: "",
      company: "",
      postingUrl: "",
      jobDescription: "",
      focusKeywords: [],
      notes: "",
    },
    layout: getResumeTemplateLayoutPreset("modern-two-column"),
    sections: createBlankSections(writerProfile),
    importTrace: {
      portfolioImportedAt: "",
      pdfImportedAt: "",
      unmapped: [],
      pendingReview: [],
    },
  };

  return resumeDocumentSchema.parse(document);
}

export function createGuidedResumeDocument(
  id = "default",
  title = "主简历",
  writerProfile: ResumeWriterProfile = "experienced",
) {
  const document = createEmptyResumeDocument(id, title, { writerProfile });

  return resumeDocumentSchema.parse({
    ...document,
    meta: {
      ...document.meta,
      sourceRefs: Array.from(
        new Set([
          ...document.meta.sourceRefs,
          "starter:guided",
        ]),
      ),
    },
    basics: {
      ...document.basics,
      summaryHtml: `<p>${resumeWriterProfileMeta[writerProfile].summaryPrompt}</p>`,
    },
    sections: createGuidedSections(writerProfile),
  });
}

export function validateResumeDocument(input: unknown) {
  return resumeDocumentSchema.parse(input);
}

export function withUpdatedTimestamp(document: ResumeDocument) {
  return {
    ...document,
    meta: {
      ...document.meta,
      updatedAt: nowIso(),
    },
  };
}
