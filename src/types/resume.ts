import { z } from "zod";

export const CURRENT_RESUME_SCHEMA_VERSION = 1;

export const resumeTemplateSchema = z.enum([
  "classic-single-column",
  "modern-two-column",
]);

export const resumeWriterProfileSchema = z.enum([
  "campus",
  "experienced",
  "career-switch",
]);

export const resumeWorkflowStateSchema = z.preprocess(
  (value) => (value === "applied" ? "ready" : value),
  z.enum([
    "drafting",
    "tailoring",
    "ready",
  ]),
);

export const resumeSectionTypeSchema = z.enum([
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "custom",
]);

export const resumeLinkSchema = z.object({
  label: z.string().trim().min(1),
  url: z.string().trim().min(1),
});

export const resumeTargetingSchema = z.object({
  role: z.string().default(""),
  company: z.string().default(""),
  postingUrl: z.string().default(""),
  jobDescription: z.string().default(""),
  focusKeywords: z.array(z.string().trim().min(1)).default([]),
  notes: z.string().default(""),
});

export const resumeSectionItemSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  location: z.string().default(""),
  dateRange: z.string().default(""),
  meta: z.string().default(""),
  summaryHtml: z.string().default(""),
  bulletPoints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const resumeSectionSchema = z.object({
  id: z.string().trim().min(1),
  type: resumeSectionTypeSchema,
  title: z.string().default(""),
  visible: z.boolean().default(true),
  layout: z.enum(["rich-text", "stacked-list", "tag-grid"]).default("stacked-list"),
  contentHtml: z.string().default(""),
  items: z.array(resumeSectionItemSchema).default([]),
});

export const resumeDocumentSchema = z.object({
  meta: z.object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    schemaVersion: z.number().int().min(1).default(CURRENT_RESUME_SCHEMA_VERSION),
    locale: z.string().default("zh-CN"),
    writerProfile: resumeWriterProfileSchema.default("experienced"),
    template: resumeTemplateSchema.default("modern-two-column"),
    workflowState: resumeWorkflowStateSchema.default("drafting"),
    updatedAt: z.string(),
    sourceRefs: z.array(z.string()).default([]),
  }),
  basics: z.object({
    name: z.string().default(""),
    headline: z.string().default(""),
    location: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    website: z.string().default(""),
    summaryHtml: z.string().default(""),
    links: z.array(resumeLinkSchema).default([]),
  }),
  targeting: resumeTargetingSchema.default({
    role: "",
    company: "",
    postingUrl: "",
    jobDescription: "",
    focusKeywords: [],
    notes: "",
  }),
  layout: z.object({
    accentColor: z.string().default("#3559b7"),
    bodyFont: z.string().default("Aptos"),
    headingFont: z.string().default("Iowan Old Style"),
    marginsMm: z.number().min(8).max(24).default(14),
    lineHeight: z.number().min(1.1).max(2).default(1.45),
    paragraphGapMm: z.number().min(1).max(8).default(3),
    pageSize: z.literal("A4").default("A4"),
  }),
  sections: z.array(resumeSectionSchema).default([]),
  importTrace: z.object({
    portfolioImportedAt: z.string().default(""),
    pdfImportedAt: z.string().default(""),
    unmapped: z.array(z.string()).default([]),
    pendingReview: z.array(z.string()).default([]),
  }),
});

export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;
export type ResumeSection = z.infer<typeof resumeSectionSchema>;
export type ResumeSectionItem = z.infer<typeof resumeSectionItemSchema>;
export type ResumeTemplate = z.infer<typeof resumeTemplateSchema>;
export type ResumeWorkflowState = z.infer<typeof resumeWorkflowStateSchema>;
export type ResumeTargeting = z.infer<typeof resumeTargetingSchema>;
export type ResumeWriterProfile = z.infer<typeof resumeWriterProfileSchema>;
