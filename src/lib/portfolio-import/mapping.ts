import type { ResumeAiSettings, ResumeDocument, ResumeImportSnapshot } from "@/types/resume";
import { buildBasicsImportFieldSuggestions } from "@/lib/resume-import-review";
import { createId, nowIso, stripHtml, textToHtml } from "@/lib/utils";
import type { ParsedHtmlPage } from "./crawl";
import { normalizeWhitespace } from "./text";
import type {
  PortfolioData,
  PortfolioExperience,
  PortfolioSkillCategory,
  UrlImportMessages,
  UrlImportResult,
  UrlImportSnapshots,
  UrlImportSummary,
} from "./types";

export function mapListSection(title: string, type: "experience" | "projects", items: PortfolioExperience[]) {
  return {
    id: createId("section"),
    type,
    title,
    visible: items.length > 0,
    layout: "stacked-list" as const,
    contentHtml: "",
    items: items.map((item) => ({
      id: item.id,
      title: item.company ?? item.name ?? "",
      subtitle: item.role ?? "",
      location: item.location ?? "",
      dateRange: item.year,
      meta: item.techTags.join(" / "),
      summaryHtml: textToHtml(item.summary),
      bulletPoints: item.keyOutcomes ?? [],
      tags: item.techTags,
    })),
  };
}

export function mapSkillsSection(skills: PortfolioSkillCategory[]) {
  return {
    id: createId("section"),
    type: "skills" as const,
    title: "Skills",
    visible: skills.length > 0,
    layout: "tag-grid" as const,
    contentHtml: "",
    items: skills.map((item) => ({
      id: createId("skill"),
      title: item.category,
      subtitle: "",
      location: "",
      dateRange: "",
      meta: "",
      summaryHtml: item.description ? textToHtml(item.description) : "",
      bulletPoints: [],
      tags: item.items,
    })),
  };
}

function summarizeExcerpt(value: string, maxLength = 150) {
  const normalized = value
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join(" ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function inferMappedTarget(page: ParsedHtmlPage) {
  const source = `${page.title} ${page.url}`.toLowerCase();
  if (/project|case|portfolio/.test(source)) return "项目 / Projects";
  if (/experience|work|career|timeline/.test(source)) return "经历 / Experience";
  if (/skill/.test(source)) return "技能 / Skills";
  return "摘要 / Summary";
}

export function buildUrlSnapshots(pages: ParsedHtmlPage[]): UrlImportSnapshots {
  return pages.slice(0, 4).map((page, index) => ({
    id: createId("snapshot"),
    label: index === 0 ? "入口页面" : `关联页面 ${index}`,
    source: page.url,
    excerpt: summarizeExcerpt(page.text),
    mappedTo: inferMappedTarget(page),
  })) satisfies ResumeImportSnapshot[];
}

export function buildUrlImportMessages(summary: UrlImportSummary | null): UrlImportMessages {
  if (!summary) {
    return {
      pendingReview: [] as string[],
      unmapped: [] as string[],
      sourceRefs: [] as string[],
    };
  }

  const pendingReview = [
    summary.mode === "multi-page"
      ? `本次抓取合并了 ${summary.pageCount} 个页面，请重点检查不同页面内容是否被映射到正确分区。`
      : "本次导入来自单页内容，请重点检查摘要、经历和项目是否被正确拆分。",
  ];

  if (summary.discoveredCandidateCount > summary.selectedCandidateCount) {
    pendingReview.push(
      `共发现 ${summary.discoveredCandidateCount} 个候选页面，实际仅纳入 ${summary.selectedCandidateCount} 个，请确认没有漏掉关键内容。`,
    );
  }

  const unmapped = ["部分原始内容可能只适合作为参考资料，没有直接写入结构化简历字段，请人工复核。"];
  if (summary.skippedUrls.length > 0) {
    unmapped.push(`有 ${summary.skippedUrls.length} 个链接未被导入，可能是非正文页面、重复页面或无法解析。`);
  }

  return {
    pendingReview,
    unmapped,
    sourceRefs: summary.visitedUrls,
  };
}

export function buildImportedResumeDocument(options: {
  baseDocument: ResumeDocument;
  portfolio: Readonly<PortfolioData>;
  source: "url" | "markdown" | "text";
  payload: string;
  resumeId?: string;
  urlSummary: UrlImportSummary | null;
  urlSnapshots: ResumeImportSnapshot[];
  aiSettings?: ResumeAiSettings;
}) {
  const { baseDocument, payload, portfolio, resumeId, source, urlSnapshots, urlSummary } = options;
  const links = [...(portfolio.contact.websiteLinks ?? [])];

  if (portfolio.contact.github) {
    links.unshift({ label: "GitHub", url: portfolio.contact.github });
  }

  const urlImportMessages = buildUrlImportMessages(urlSummary);
  const nextBasics = {
    ...baseDocument.basics,
    name: portfolio.hero.name,
    headline: portfolio.hero.title,
    location: portfolio.hero.location ?? "",
    email: portfolio.contact.email,
    phone: portfolio.contact.phone,
    website: links[0]?.url ?? (source === "url" ? payload : ""),
    summaryHtml: textToHtml([portfolio.hero.subtitle, portfolio.about.zh].filter(Boolean).join("\n\n")),
    links,
  } satisfies ResumeDocument["basics"];
  const fieldSuggestions = buildBasicsImportFieldSuggestions(
    baseDocument.basics,
    nextBasics,
    source === "url" ? "网站导入" : "粘贴内容导入",
  );

  return {
    nextBasics,
    fieldSuggestions,
    documentInput: {
      ...baseDocument,
      basics: nextBasics,
      ai: options.aiSettings
        ? {
            ...baseDocument.ai,
            ...options.aiSettings,
          }
        : baseDocument.ai,
      meta: {
        ...baseDocument.meta,
        id: resumeId ?? baseDocument.meta.id,
        title: `${portfolio.hero.name} 导入草稿`,
        updatedAt: nowIso(),
        sourceRefs: Array.from(
          new Set([
            ...baseDocument.meta.sourceRefs,
            ...(source === "url" ? urlImportMessages.sourceRefs : []),
            ...(source === "url" ? [payload] : []),
          ]),
        ),
      },
      sections: [
        {
          id: createId("section"),
          type: "summary",
          title: "个人摘要",
          visible: !!portfolio.about.zh || !!portfolio.hero.subtitle,
          layout: "rich-text",
          contentHtml: textToHtml([portfolio.hero.subtitle, portfolio.about.zh].filter(Boolean).join("\n\n")),
          items: [],
        },
        mapListSection("工作经历", "experience", portfolio.timeline),
        mapListSection("项目经历", "projects", portfolio.projects),
        mapSkillsSection(portfolio.skills),
      ],
      importTrace: {
        ...baseDocument.importTrace,
        portfolioImportedAt: nowIso(),
        unmapped: urlImportMessages.unmapped,
        pendingReview: urlImportMessages.pendingReview,
        snapshots: urlSnapshots,
        fieldSuggestions,
        reviewState: {
          completedTaskIds: [],
          reviewedPendingItems: [],
          reviewedSnapshotIds: [],
          reviewedFieldSuggestionIds: [],
          reviewedUnmappedItems: [],
        },
      },
    },
  };
}

export function buildImportResponse(options: {
  document: ResumeDocument;
  portfolio: Readonly<PortfolioData>;
  source: "url" | "markdown" | "text";
  payload: string;
  urlSummary: UrlImportSummary | null;
}): UrlImportResult {
  return {
    document: options.document,
    rawPortfolio: {
      portfolio: options.portfolio,
      urlSummary: options.urlSummary,
    },
    summary: stripHtml(options.document.basics.summaryHtml),
    sourcePath: options.source === "url" ? options.payload : "pasted-content",
    urlSummary: options.urlSummary,
  };
}
