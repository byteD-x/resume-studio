import {
  CURRENT_RESUME_SCHEMA_VERSION,
  resumeDocumentSchema,
  type ResumeDocument,
  type ResumeSection,
  type ResumeTemplate,
  type ResumeWriterProfile,
} from "@/types/resume";
import { getTemplateCatalogItem, templateCatalog } from "@/data/template-catalog";
import { createId, nowIso } from "@/lib/utils";

export type ResumeStarterPreset = "blank" | "guided" | "template";

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
    summaryPrompt: "先写清求职方向与阶段，再补一句最能证明潜力或成果的经历。",
    workflowSteps: [
      "先补齐教育、求职方向和联系方式。",
      "优先把实习、校园经历和项目写成结果导向要点。",
      "最后补目标岗位和关键词，再生成岗位定制版。",
    ],
  },
  experienced: {
    label: "有经验求职",
    shortLabel: "社招",
    description: "适合已有工作经验的求职者，优先突出业务影响、职责范围和结果证明。",
    summaryPrompt: "先用 2 到 3 句话写清方向、年限和核心能力，再补一句代表性结果。",
    workflowSteps: [
      "先填写姓名、职位标题、联系方式和职业摘要。",
      "按影响力排序重写工作经历和项目经历，优先保留结果型内容。",
      "最后补目标岗位、JD 和关键词，用于生成岗位定制版。",
    ],
  },
  "career-switch": {
    label: "转岗 / 跨行业",
    shortLabel: "转岗",
    description: "适合跨岗位或跨行业求职，重点强调可迁移能力、相关项目和转向证明。",
    summaryPrompt: "先说明目标岗位，再补充过去经历里可迁移的能力与转型准备度。",
    workflowSteps: [
      "先写清新方向、可迁移能力和联系方式。",
      "把旧岗位经历改写成与新方向相关的结果与能力证明。",
      "补充目标岗位、JD 和关键词，检查转岗叙事是否足够聚焦。",
    ],
  },
};

export const resumeTemplateLayoutPresets = Object.fromEntries(
  templateCatalog.map((template) => [template.id, template.layoutPreset]),
) as Record<ResumeTemplate, ResumeDocument["layout"]>;

export function getResumeTemplateLayoutPreset(template: ResumeTemplate) {
  return {
    ...resumeTemplateLayoutPresets[template],
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
      title: "核心技能",
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

function createBaseResumeDocument(
  id: string,
  title: string,
  writerProfile: ResumeWriterProfile,
  template: ResumeTemplate,
) {
  const templateDefinition = getTemplateCatalogItem(template);

  return {
    meta: {
      id,
      title,
      schemaVersion: CURRENT_RESUME_SCHEMA_VERSION,
      locale: "zh-CN",
      writerProfile,
      template,
      workflowState: "drafting" as const,
      updatedAt: nowIso(),
      sourceRefs: [`writer-profile:${writerProfile}`, `template:${templateDefinition.id}`],
    },
    targeting: {
      role: "",
      company: "",
      postingUrl: "",
      jobDescription: "",
      focusKeywords: [],
      notes: "",
    },
    ai: {
      provider: "openai-compatible" as const,
      model: "qwen/qwen3-32b",
      baseUrl: "https://api.groq.com/openai/v1",
    },
    layout: getResumeTemplateLayoutPreset(template),
    importTrace: {
      portfolioImportedAt: "",
      pdfImportedAt: "",
      unmapped: [],
      pendingReview: [],
      snapshots: [],
      fieldSuggestions: [],
      reviewState: {
        completedTaskIds: [],
        reviewedPendingItems: [],
        reviewedSnapshotIds: [],
        reviewedFieldSuggestionIds: [],
        reviewedUnmappedItems: [],
      },
    },
  };
}

export function createEmptyResumeDocument(
  id = "default",
  title = "未命名简历",
  options: { writerProfile?: ResumeWriterProfile; template?: ResumeTemplate } = {},
) {
  const writerProfile = options.writerProfile ?? "experienced";
  const template = options.template ?? "aurora-grid";
  const base = createBaseResumeDocument(id, title, writerProfile, template);
  const document: ResumeDocument = {
    meta: base.meta,
    basics: {
      name: "",
      headline: "",
      location: "",
      email: "",
      phone: "",
      website: "",
      summaryHtml: "",
      links: [],
      photoUrl: "",
      photoAlt: "",
      photoVisible: false,
      photoShape: "rounded",
      photoPosition: "top-right",
      photoSizeMm: 28,
    },
    targeting: base.targeting,
    ai: base.ai,
    layout: base.layout,
    sections: createBlankSections(writerProfile),
    importTrace: base.importTrace,
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
      sourceRefs: Array.from(new Set([...document.meta.sourceRefs, "starter:guided"])),
    },
    sections: createGuidedSections(writerProfile),
  });
}

export function createTemplateResumeDocument(
  id = "default",
  title = "未命名简历",
  writerProfile: ResumeWriterProfile = "experienced",
  template: ResumeTemplate = "aurora-grid",
) {
  const document = createEmptyResumeDocument(id, title, { writerProfile, template });

  return resumeDocumentSchema.parse({
    ...document,
    meta: {
      ...document.meta,
      sourceRefs: Array.from(new Set([...document.meta.sourceRefs, "starter:template"])),
    },
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
