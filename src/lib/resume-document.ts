import {
  CURRENT_RESUME_SCHEMA_VERSION,
  resumeDocumentSchema,
  type ResumeDocument,
  type ResumeSection,
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
  return createBlankSections(writerProfile);
}

export function createEmptyResumeDocument(
  id = "default",
  title = "未命名简历",
  options: { writerProfile?: ResumeWriterProfile; template?: ResumeTemplate } = {},
) {
  const writerProfile = options.writerProfile ?? "experienced";
  const template = options.template ?? "modern-two-column";
  const document: ResumeDocument = {
    meta: {
      id,
      title,
      schemaVersion: CURRENT_RESUME_SCHEMA_VERSION,
      locale: "zh-CN",
      writerProfile,
      template,
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
      summaryHtml: "",
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
    layout: getResumeTemplateLayoutPreset(template),
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
  title = "未命名简历",
  writerProfile: ResumeWriterProfile = "experienced",
  template?: ResumeTemplate,
) {
  const document = createEmptyResumeDocument(id, title, { writerProfile, template });

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
