import type { ImportSource, ImportedSection, ImportedUrlSummary } from "@/components/import/portfolio-import/types";

const importSources: ImportSource[] = ["url", "markdown", "text", "pdf"];

export function countImportedItems(sections: ImportedSection[], sectionType: string) {
  return sections.find((section) => section.type === sectionType)?.items?.length ?? 0;
}

export function isImportSource(value: string | null): value is ImportSource {
  return value != null && importSources.includes(value as ImportSource);
}

export function getImportPlaceholder(source: Exclude<ImportSource, "pdf">) {
  switch (source) {
    case "url":
      return "https://your-portfolio.com 或 Notion 页面链接...";
    case "markdown":
      return "粘贴简历或作品集的 Markdown 源码...";
    case "text":
      return "粘贴工作经历、项目介绍或关于我的描述...";
    default:
      return "";
  }
}

export function buildExtractionSummary(urlSummary: ImportedUrlSummary) {
  if (urlSummary.extractionMode === "ai") {
    return `已用 ${urlSummary.modelLabel ?? "AI"} 完成结构化抽取`;
  }

  if (urlSummary.extractionMode === "ai-fallback") {
    return "AI 抽取失败，已回退为规则导入";
  }

  if (urlSummary.mode === "multi-page") {
    return `已抓取 ${urlSummary.pageCount} 个页面并合并整理`;
  }

  return "当前按单页内容导入";
}
