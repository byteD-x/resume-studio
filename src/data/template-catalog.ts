import type { ResumeTemplate } from "@/types/resume";
import { auroraGridTemplate } from "./template-catalog/aurora-grid";
import { campusLineTemplate } from "./template-catalog/campus-line";
import { engineerProTemplate } from "./template-catalog/engineer-pro";
import { portfolioBriefTemplate } from "./template-catalog/portfolio-brief";
export type {
  ResumeTemplateFamily,
  TemplateCatalogItem,
  TemplateCategory,
} from "./template-catalog/shared";

export const templateCatalog = [
  auroraGridTemplate,
  campusLineTemplate,
  portfolioBriefTemplate,
  engineerProTemplate,
];

export const templateCatalogById = Object.fromEntries(
  templateCatalog.map((item) => [item.id, item]),
) as Record<ResumeTemplate, (typeof templateCatalog)[number]>;

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
