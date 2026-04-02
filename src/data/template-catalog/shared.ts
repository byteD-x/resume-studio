import type { ResumeDocument, ResumeTemplate, ResumeWriterProfile } from "@/types/resume";

export type TemplateCategory = "通用" | "校招" | "设计" | "技术";
export type ResumeTemplateFamily = "two-column" | "single-column";

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
}
