import { createEmptyResumeDocument, validateResumeDocument } from "@/lib/resume-document";
import { canUseRemoteResumeAi, generateWebsiteImportPortfolio } from "@/lib/resume-ai";
import { buildBasicsImportFieldSuggestions } from "@/lib/resume-import-review";
import { assertSafeUrlImportTarget } from "@/lib/network-safety";
import { createId, nowIso, stripHtml, textToHtml } from "@/lib/utils";
import type { ResumeAiSettings, ResumeDocument, ResumeImportSnapshot } from "@/types/resume";

const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 10_000;

export interface PortfolioExperience {
  id: string;
  year: string;
  role?: string;
  company?: string;
  name?: string;
  location?: string;
  summary: string;
  techTags: string[];
  keyOutcomes?: string[];
}

export interface PortfolioSkillCategory {
  category: string;
  description?: string;
  items: string[];
}

export interface PortfolioData {
  hero: {
    name: string;
    title: string;
    subtitle: string;
    location?: string;
  };
  about: {
    zh: string;
  };
  timeline: PortfolioExperience[];
  projects: PortfolioExperience[];
  skills: PortfolioSkillCategory[];
  contact: {
    email: string;
    phone: string;
    websiteLinks?: Array<{ label: string; url: string }>;
    github?: string;
  };
}

export interface UrlImportOptions {
  includeLinkedPages?: boolean;
  maxPages?: number;
}

export interface UrlImportSummary {
  baseUrl: string;
  mode: "single-page" | "multi-page";
  pageCount: number;
  selectedCandidateCount: number;
  discoveredCandidateCount: number;
  visitedUrls: string[];
  skippedUrls: string[];
  extractionMode?: "rules" | "ai" | "ai-fallback";
  modelLabel?: string;
}

interface ParsedAnchor {
  href: string;
  text: string;
}

interface ParsedHtmlPage {
  url: string;
  title: string;
  text: string;
  anchors: ParsedAnchor[];
}

const defaultPortfolioPayload = [
  "Resume Candidate",
  "Product-minded Engineer",
  "Builds structured resume workflows and editing experiences.",
  "Project",
  "Resume Studio",
  "Built a local-first editor for writing and refining resumes.",
  "Skills",
  "React",
  "TypeScript",
  "Next.js",
].join("\n");

const crawlKeywords = [
  "about",
  "profile",
  "resume",
  "cv",
  "experience",
  "work",
  "project",
  "portfolio",
  "case",
  "case-study",
  "intern",
  "career",
  "timeline",
  "education",
  "skills",
] as const;

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function htmlToReadableText(html: string) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<(br|\/p|\/div|\/section|\/article|\/li|\/h[1-6])>/gi, "\n")
        .replace(/<(p|div|section|article|li|h[1-6])[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\n{2,}/g, "\n"),
    ),
  )
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join("\n");
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeWhitespace(decodeHtmlEntities(stripTags(match[1] ?? ""))) : "";
}

function extractAnchors(html: string) {
  const anchors: ParsedAnchor[] = [];
  const anchorPattern = /<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = normalizeWhitespace(match[1] ?? match[2] ?? "");
    const text = normalizeWhitespace(decodeHtmlEntities(stripTags(match[3] ?? "")));
    if (!href) continue;
    anchors.push({ href, text });
  }

  return anchors;
}

async function fetchHtmlPage(url: string): Promise<ParsedHtmlPage> {
  const safeUrl = assertSafeUrlImportTarget(url).toString();
  const response = await fetch(safeUrl, {
    headers: { "User-Agent": "Mozilla/5.0 Resume-Studio-Importer" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    throw new Error("Only HTML pages can be imported from a URL.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > MAX_HTML_BYTES) {
    throw new Error("The selected page is too large to import safely.");
  }

  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error("The selected page is too large to import safely.");
  }
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const targetHtml = bodyMatch ? bodyMatch[1] : html;

  return {
    url: safeUrl,
    title: extractTitle(html),
    text: htmlToReadableText(targetHtml),
    anchors: extractAnchors(targetHtml),
  };
}

function shouldSkipUrl(url: URL) {
  if (url.hash) url.hash = "";

  const pathname = url.pathname.toLowerCase();
  if (
    pathname.endsWith(".pdf")
    || pathname.endsWith(".png")
    || pathname.endsWith(".jpg")
    || pathname.endsWith(".jpeg")
    || pathname.endsWith(".gif")
    || pathname.endsWith(".svg")
    || pathname.endsWith(".zip")
  ) {
    return true;
  }

  return false;
}

function scoreCandidate(url: URL, anchorText: string) {
  const source = `${url.pathname} ${anchorText}`.toLowerCase();
  let score = 0;

  for (const keyword of crawlKeywords) {
    if (source.includes(keyword)) score += 4;
  }

  if (url.pathname.split("/").filter(Boolean).length <= 2) score += 1;
  if (anchorText.length > 0 && anchorText.length <= 40) score += 1;
  if (/blog|article|post|news/.test(source)) score -= 3;
  if (/contact|login|signin|signup|privacy|terms/.test(source)) score -= 5;

  return score;
}

function rankCandidateLinks(baseUrl: string, anchors: ParsedAnchor[]) {
  const base = new URL(baseUrl);
  const deduped = new Map<string, { url: string; score: number }>();

  for (const anchor of anchors) {
    try {
      const candidate = new URL(anchor.href, base);
      if (candidate.origin !== base.origin || shouldSkipUrl(candidate)) continue;

      const normalized = `${candidate.origin}${candidate.pathname}${candidate.search}`;
      const score = scoreCandidate(candidate, anchor.text);
      if (score <= 0 || normalized === baseUrl) continue;

      const current = deduped.get(normalized);
      if (!current || current.score < score) {
        deduped.set(normalized, { url: normalized, score });
      }
    } catch {
      continue;
    }
  }

  return [...deduped.values()]
    .sort((left, right) => right.score - left.score || left.url.localeCompare(right.url))
    .map((item) => item.url);
}

async function crawlPortfolioSite(url: string, options: UrlImportOptions = {}) {
  const normalizedUrl = assertSafeUrlImportTarget(url).toString();
  const includeLinkedPages = options.includeLinkedPages ?? true;
  const maxPages = Math.min(Math.max(options.maxPages ?? 3, 1), 6);
  const rootPage = await fetchHtmlPage(normalizedUrl);
  const discoveredCandidates = includeLinkedPages ? rankCandidateLinks(normalizedUrl, rootPage.anchors) : [];
  const selectedCandidates = discoveredCandidates.slice(0, Math.max(maxPages - 1, 0));
  const pages: ParsedHtmlPage[] = [rootPage];
  const skippedUrls = discoveredCandidates.slice(selectedCandidates.length);

  for (const candidateUrl of selectedCandidates) {
    try {
      pages.push(await fetchHtmlPage(candidateUrl));
    } catch {
      skippedUrls.push(candidateUrl);
    }
  }

  const aggregatedText = pages
    .map((page, index) => {
      const label = index === 0 ? "Root Page" : `Linked Page ${index}`;
      const heading = page.title ? `${label}: ${page.title}` : `${label}: ${page.url}`;
      return `${heading}\n${page.text}`;
    })
    .join("\n\n");

  return {
    aggregatedText,
    summary: {
      baseUrl: normalizedUrl,
      mode: pages.length > 1 ? "multi-page" : "single-page",
      pageCount: pages.length,
      selectedCandidateCount: selectedCandidates.length,
      discoveredCandidateCount: discoveredCandidates.length,
      visitedUrls: pages.map((page) => page.url),
      skippedUrls,
    } satisfies UrlImportSummary,
    pages,
  };
}

function summarizeExcerpt(value: string, maxLength = 150) {
  const normalized = value.split("\n").map((line) => normalizeWhitespace(line)).filter(Boolean).join(" ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function inferMappedTarget(page: ParsedHtmlPage) {
  const source = `${page.title} ${page.url}`.toLowerCase();
  if (/project|case|portfolio/.test(source)) return "项目经历 / Projects";
  if (/experience|work|career|timeline/.test(source)) return "工作经历 / Experience";
  if (/skill/.test(source)) return "技能 / Skills";
  return "个人摘要 / Summary";
}

function buildUrlSnapshots(pages: ParsedHtmlPage[]) {
  return pages.slice(0, 4).map((page, index) => ({
    id: createId("snapshot"),
    label: index === 0 ? "原始入口页" : `关联页面 ${index}`,
    source: page.url,
    excerpt: summarizeExcerpt(page.text),
    mappedTo: inferMappedTarget(page),
  })) satisfies ResumeImportSnapshot[];
}

export function parseTextPortfolio(content = defaultPortfolioPayload): PortfolioData {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const emailMatch = content.match(/[\w-.]+@([\w-]+\.)+[\w-]{2,4}/);
  const phoneMatch = content.match(/1[3-9]\d{9}/);
  const urlMatches = content.match(/https?:\/\/[^\s]+/g) || [];

  const github = urlMatches.find((url) => url.includes("github.com")) || "";
  const otherLinks = urlMatches
    .filter((url) => !url.includes("github.com"))
    .map((url) => ({ label: "Website", url }));

  let name = "未命名";
  let title = "求职者";
  let subtitle = "";

  if (lines.length > 0) name = lines[0].slice(0, 30).replace(/#+\s*/g, "");
  if (lines.length > 1) title = lines[1].slice(0, 50).replace(/#+\s*/g, "");
  if (lines.length > 2) subtitle = lines.slice(2, 5).join(" ").slice(0, 200);

  const timeline: PortfolioExperience[] = [];
  const projects: PortfolioExperience[] = [];
  const contentBlocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines.slice(2)) {
    if (line.match(/^(项目|经历|工作|Project|Experience|Root Page|Linked Page|#)/i)) {
      if (currentBlock.length > 0) {
        contentBlocks.push(currentBlock);
        currentBlock = [];
      }
    }
    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    contentBlocks.push(currentBlock);
  }

  contentBlocks.forEach((block) => {
    if (block.length < 2) return;

    const header = block[0].replace(/#+\s*/g, "");
    const isProject = /项目|project/i.test(header);
    const roleOrName = header;
    const summary = block.slice(1).join("\n");

    const item: PortfolioExperience = {
      id: createId("exp"),
      year: "未知时间",
      name: isProject ? roleOrName : undefined,
      company: !isProject ? roleOrName : undefined,
      role: isProject ? "" : "相关角色",
      summary,
      techTags: [],
    };

    if (isProject) {
      projects.push(item);
    } else {
      timeline.push(item);
    }
  });

  if (projects.length === 0 && timeline.length === 0 && lines.length > 5) {
    projects.push({
      id: createId("exp"),
      year: "近期",
      name: "导入项目",
      summary: lines.slice(5, 15).join("\n"),
      techTags: [],
    });
  }

  return {
    hero: { name, title, subtitle, location: "" },
    about: { zh: subtitle },
    timeline,
    projects,
    skills: [],
    contact: {
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      github,
      websiteLinks: otherLinks,
    },
  };
}

function mapListSection(title: string, type: "experience" | "projects", items: PortfolioExperience[]) {
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
      meta: item.techTags.join(" 路 "),
      summaryHtml: textToHtml(item.summary),
      bulletPoints: item.keyOutcomes ?? [],
      tags: item.techTags,
    })),
  };
}

function mapSkillsSection(skills: PortfolioSkillCategory[]) {
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

function buildUrlImportMessages(summary: UrlImportSummary | null) {
  if (!summary) {
    return {
      pendingReview: [] as string[],
      unmapped: [] as string[],
      sourceRefs: [] as string[],
    };
  }

  const pendingReview = [
    summary.mode === "multi-page"
      ? `已额外抓取 ${summary.pageCount - 1} 个同站页面，请核对是否覆盖完整。`
      : "当前按单页内容导入，如站点详情分散在子页面中，建议开启扩展抓取。",
  ];

  if (summary.discoveredCandidateCount > summary.selectedCandidateCount) {
    pendingReview.push(`发现 ${summary.discoveredCandidateCount} 个候选页面，本次优先抓取了 ${summary.selectedCandidateCount} 个。`);
  }

  const unmapped = ["网页中的视觉样式、交互状态和部分动态内容不会完整保留。"];
  if (summary.skippedUrls.length > 0) {
    unmapped.push(`有 ${summary.skippedUrls.length} 个候选页面未导入，请手动核对是否需要补充。`);
  }

  return {
    pendingReview,
    unmapped,
    sourceRefs: summary.visitedUrls,
  };
}

export async function importPortfolioToResume(options: {
  source?: "url" | "markdown" | "text";
  payload?: string;
  existingDocument?: ResumeDocument;
  resumeId?: string;
  urlOptions?: UrlImportOptions;
  aiSettings?: ResumeAiSettings;
  apiKey?: string;
}) {
  let portfolio: Readonly<PortfolioData>;
  let urlSummary: UrlImportSummary | null = null;
  let urlSnapshots: ResumeImportSnapshot[] = [];
  const source = options.source ?? "text";
  const payload = options.payload ?? defaultPortfolioPayload;

  if (source === "url") {
    const crawlResult = await crawlPortfolioSite(payload, options.urlOptions);
    const fallbackPortfolio = parseTextPortfolio(crawlResult.aggregatedText);
    const aiSettings = options.aiSettings;
    const canUseAi = aiSettings ? canUseRemoteResumeAi(aiSettings) : false;
    let nextUrlSummary: UrlImportSummary = {
      ...crawlResult.summary,
      extractionMode: "rules",
    };

    if (canUseAi && aiSettings) {
      try {
        portfolio = await generateWebsiteImportPortfolio({
          sourceUrl: payload,
          aggregatedText: crawlResult.aggregatedText,
          settings: aiSettings,
          fallback: fallbackPortfolio,
          apiKey: options.apiKey,
        });
        nextUrlSummary = {
          ...crawlResult.summary,
          extractionMode: "ai",
          modelLabel: aiSettings.model,
        };
      } catch {
        portfolio = fallbackPortfolio;
        nextUrlSummary = {
          ...crawlResult.summary,
          extractionMode: "ai-fallback",
          modelLabel: aiSettings.model,
        };
      }
    } else {
      portfolio = fallbackPortfolio;
    }

    urlSummary = nextUrlSummary;
    urlSnapshots = buildUrlSnapshots(crawlResult.pages);
  } else {
    portfolio = parseTextPortfolio(payload);
  }

  const baseDocument =
    options.existingDocument ?? createEmptyResumeDocument(options.resumeId ?? "default", "Imported Draft");
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
    source === "url" ? "网址导入" : "作品集导入",
  );
  const document = validateResumeDocument({
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
      id: options.resumeId ?? baseDocument.meta.id,
      title: `${portfolio.hero.name} 的简历`,
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
        title: "个人简介",
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
  });

  return {
    document,
    rawPortfolio: {
      portfolio,
      urlSummary,
    },
    summary: stripHtml(document.basics.summaryHtml),
    sourcePath: source === "url" ? payload : "pasted-content",
    urlSummary,
  };
}
