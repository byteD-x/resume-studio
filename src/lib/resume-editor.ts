import { getResumeTemplateLayoutPreset } from "@/lib/resume-document";
import type {
  ResumeDocument,
  ResumeSection,
  ResumeSectionItem,
  ResumeSectionType,
  ResumeTemplate,
} from "@/types/resume";
import { createId, stripHtml, textToHtml } from "@/lib/utils";

export interface EditorSectionDefinition {
  type: Extract<ResumeSectionType, "experience" | "projects" | "education" | "skills">;
  title: string;
  description: string;
  layout: ResumeSection["layout"];
  emptyState: string;
}

export const editorSectionDefinitions: EditorSectionDefinition[] = [
  {
    type: "experience",
    title: "工作经历",
    description: "时间、角色、结果",
    layout: "stacked-list",
    emptyState: "还没有工作经历",
  },
  {
    type: "projects",
    title: "项目经历",
    description: "项目和成果",
    layout: "stacked-list",
    emptyState: "还没有项目",
  },
  {
    type: "education",
    title: "教育经历",
    description: "学校、专业、时间",
    layout: "stacked-list",
    emptyState: "还没有教育经历",
  },
  {
    type: "skills",
    title: "核心技能",
    description: "按分组整理",
    layout: "tag-grid",
    emptyState: "还没有技能",
  },
];

const defaultSectionTitleAliases: Partial<Record<EditorSectionDefinition["type"], string[]>> = {
  skills: ["技能", "技能清单", "核心技能"],
};

function resolveSectionTitle(definition: EditorSectionDefinition, currentTitle: string) {
  const trimmedTitle = currentTitle.trim();
  if (!trimmedTitle) {
    return definition.title;
  }

  const aliases = defaultSectionTitleAliases[definition.type];
  if (aliases?.includes(trimmedTitle)) {
    return definition.title;
  }

  return trimmedTitle;
}

export function cloneResumeDocument(document: ResumeDocument) {
  return JSON.parse(JSON.stringify(document)) as ResumeDocument;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createEditorItem(_type: EditorSectionDefinition["type"]): ResumeSectionItem {
  return {
    id: createId("item"),
    title: "",
    subtitle: "",
    location: "",
    dateRange: "",
    meta: "",
    summaryHtml: "",
    bulletPoints: [],
    tags: [],
  };
}

export function createEditorSection(definition: EditorSectionDefinition): ResumeSection {
  return {
    id: createId("section"),
    type: definition.type,
    title: definition.title,
    visible: true,
    layout: definition.layout,
    contentHtml: "",
    items: [],
  };
}

export function ensureEditorDocument(document: ResumeDocument) {
  const cloned = cloneResumeDocument(document);
  const nextSections = [...cloned.sections];

  for (const definition of editorSectionDefinitions) {
    const current = nextSections.find((section) => section.type === definition.type);

    if (!current) {
      nextSections.push(createEditorSection(definition));
      continue;
    }

    current.title = resolveSectionTitle(definition, current.title);
    current.layout = definition.layout;
  }

  return {
    ...cloned,
    sections: nextSections,
  };
}

export function getEditorSection(
  document: ResumeDocument,
  type: EditorSectionDefinition["type"],
) {
  return document.sections.find((section) => section.type === type) ?? null;
}

export function applyTemplateSelection(document: ResumeDocument, template: ResumeTemplate) {
  return {
    ...document,
    meta: {
      ...document.meta,
      template,
    },
    layout: getResumeTemplateLayoutPreset(template),
  };
}

export function htmlFieldToText(value: string) {
  return stripHtml(value);
}

export function textFieldToHtml(value: string) {
  return textToHtml(value.trim());
}

export function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function tagsToList(value: string) {
  return value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function moveItem<T>(items: T[], index: number, direction: "up" | "down") {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  const [current] = next.splice(index, 1);
  next.splice(targetIndex, 0, current);
  return next;
}

export function duplicateEditorItem(item: ResumeSectionItem): ResumeSectionItem {
  return {
    ...item,
    id: createId("item"),
  };
}

export function sectionItemToPlainText(item: ResumeSectionItem) {
  const lines = [
    item.title,
    item.subtitle,
    item.dateRange,
    item.location,
    item.meta,
    stripHtml(item.summaryHtml),
    ...item.bulletPoints.map((bullet) => `- ${bullet}`),
    item.tags.length > 0 ? `技能：${item.tags.join("、")}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}
