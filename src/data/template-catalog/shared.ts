import type {
  ResumeDocument,
  ResumeSection,
  ResumeSectionItem,
  ResumeTemplate,
  ResumeWriterProfile,
} from "@/types/resume";

export type TemplateCategory = "通用" | "校招" | "设计" | "技术";
export type ResumeTemplateFamily = "two-column" | "single-column";

export type TemplateStarterSeed = Pick<ResumeDocument, "basics" | "sections">;

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
  starterSeeds: Record<ResumeWriterProfile, TemplateStarterSeed>;
}

export function createItem(input: {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  dateRange?: string;
  meta?: string;
  summaryHtml?: string;
  bulletPoints?: string[];
  tags?: string[];
}): ResumeSectionItem {
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle ?? "",
    location: input.location ?? "",
    dateRange: input.dateRange ?? "",
    meta: input.meta ?? "",
    summaryHtml: input.summaryHtml ?? "",
    bulletPoints: input.bulletPoints ?? [],
    tags: input.tags ?? [],
  };
}

export function createSection(input: {
  id: string;
  type: ResumeSection["type"];
  title: string;
  layout?: ResumeSection["layout"];
  contentHtml?: string;
  items?: ResumeSectionItem[];
}): ResumeSection {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    visible: true,
    layout: input.layout ?? "stacked-list",
    contentHtml: input.contentHtml ?? "",
    items: input.items ?? [],
  };
}

export function createLinks(...links: Array<[label: string, url: string]>) {
  return links.map(([label, url]) => ({ label, url }));
}
