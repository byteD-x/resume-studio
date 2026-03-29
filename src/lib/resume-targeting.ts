import type { ResumeDocument, ResumeSection } from "@/types/resume";
import { stripHtml } from "@/lib/utils";

type KeywordSourceArea =
  | "headline"
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "custom";

export interface ResumeKeywordMatch {
  keyword: string;
  matched: boolean;
  matchedAreas: KeywordSourceArea[];
}

export interface ResumeTargetingAnalysis {
  active: boolean;
  targetLabel: string;
  keywordSource: "manual" | "job-description" | "none";
  suggestedKeywords: string[];
  evaluatedKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  coveragePercent: number | null;
  keywordMatches: ResumeKeywordMatch[];
}

const ENGLISH_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your",
  "our",
  "their",
  "this",
  "will",
  "have",
  "has",
  "had",
  "using",
  "build",
  "building",
  "develop",
  "developing",
  "deliver",
  "delivering",
  "create",
  "creating",
  "product",
  "products",
  "platform",
  "platforms",
  "system",
  "systems",
  "team",
  "teams",
  "role",
  "roles",
  "work",
  "working",
  "years",
  "year",
  "experience",
  "preferred",
  "required",
  "strong",
  "ability",
  "excellent",
  "skills",
  "skill",
  "plus",
  "nice",
  "have",
  "understanding",
  "knowledge",
  "support",
  "supporting",
  "across",
  "within",
  "through",
  "while",
  "more",
  "least",
  "about",
]);

const CJK_STOPWORDS = new Set([
  "负责",
  "相关",
  "经验",
  "以上",
  "优先",
  "能力",
  "团队",
  "工作",
  "参与",
  "具备",
  "熟悉",
  "了解",
  "良好",
  "能够",
  "岗位",
  "要求",
  "加分",
]);

function normalizeKeyword(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}+.#/&-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeKeywords(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalized = normalizeKeyword(trimmed);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed.replace(/\s+/g, " "));
  }

  return result;
}

export function parseFocusKeywords(value: string) {
  return dedupeKeywords(value.split(/[\n,，;；•]+/g));
}

function isKeywordCandidate(raw: string, normalized: string) {
  if (!normalized) return false;

  if (/[\u4e00-\u9fff]/.test(normalized)) {
    return !CJK_STOPWORDS.has(normalized);
  }

  const words = normalized.split(" ");
  if (words.length === 1) {
    return words[0].length >= 3 && !ENGLISH_STOPWORDS.has(words[0]);
  }

  if (words.every((word) => ENGLISH_STOPWORDS.has(word))) {
    return false;
  }

  return !/years? of experience|cross functional|problem solving|communication skills?/i.test(
    normalized,
  );
}

export function extractFocusKeywordsFromJobDescription(value: string, limit = 12) {
  const segments = value
    .split(/[\n,，;；•]+|(?<=[.!?。！？])\s+/)
    .flatMap((segment) => segment.split(/\b(?:and|or)\b/gi))
    .map((segment) =>
      segment
        .trim()
        .replace(
          /^(we are hiring|we are looking for|looking for|seeking|experience with|strong experience with|strong|familiarity with|knowledge of|ability to|responsible for|build|building|develop|developing|with|in)\s+/i,
          "",
        )
        .replace(/\b(experience|skills?|knowledge|background)\b\.?$/i, "")
        .trim(),
    )
    .filter(Boolean);

  const matches = segments.flatMap((segment) =>
    segment.match(
      /[A-Za-z0-9][A-Za-z0-9+.#/&-]*(?:\s+[A-Za-z0-9][A-Za-z0-9+.#/&-]*){0,2}|[\u4e00-\u9fff]{2,12}/g,
    ) ?? [],
  );
  if (matches.length === 0) return [];

  const scored = new Map<string, { label: string; score: number }>();

  for (const rawCandidate of matches) {
    const label = rawCandidate
      .trim()
      .replace(/^(?:with|using|for|in|on|a|an)\s+/i, "")
      .replace(/\s+/g, " ");
    const normalized = normalizeKeyword(label);
    if (!isKeywordCandidate(label, normalized)) continue;

    const current = scored.get(normalized) ?? { label, score: 0 };
    current.score += 1;

    if (/[A-Z]/.test(label)) current.score += 2;
    if (/[+.#/&-]/.test(label)) current.score += 2;
    if (label.includes(" ")) current.score += 1;
    if (/[\u4e00-\u9fff]/.test(label)) current.score += 1;

    scored.set(normalized, current);
  }

  return [...scored.values()]
    .sort((left, right) => right.score - left.score || right.label.length - left.label.length)
    .slice(0, limit)
    .map((entry) => entry.label);
}

function stripSection(section: ResumeSection) {
  return [
    section.title,
    stripHtml(section.contentHtml),
    ...section.items.flatMap((item) => [
      item.title,
      item.subtitle,
      item.location,
      item.dateRange,
      item.meta,
      stripHtml(item.summaryHtml),
      ...item.bulletPoints,
      ...item.tags,
    ]),
  ]
    .filter(Boolean)
    .join(" ");
}

function buildCorpusByArea(document: ResumeDocument) {
  const summarySections = document.sections.filter((section) => section.type === "summary");

  return {
    headline: normalizeKeyword(document.basics.headline),
    summary: normalizeKeyword(
      [
        stripHtml(document.basics.summaryHtml),
        ...summarySections.map((section) => stripSection(section)),
      ].join(" "),
    ),
    experience: normalizeKeyword(
      document.sections
        .filter((section) => section.type === "experience")
        .map(stripSection)
        .join(" "),
    ),
    projects: normalizeKeyword(
      document.sections
        .filter((section) => section.type === "projects")
        .map(stripSection)
        .join(" "),
    ),
    skills: normalizeKeyword(
      document.sections
        .filter((section) => section.type === "skills")
        .map(stripSection)
        .join(" "),
    ),
    education: normalizeKeyword(
      document.sections
        .filter((section) => section.type === "education")
        .map(stripSection)
        .join(" "),
    ),
    custom: normalizeKeyword(
      document.sections
        .filter((section) => section.type === "custom")
        .map(stripSection)
        .join(" "),
    ),
  } satisfies Record<KeywordSourceArea, string>;
}

function containsKeyword(corpus: string, keyword: string) {
  if (!corpus || !keyword) return false;

  if (/[\u4e00-\u9fff]/.test(keyword)) {
    return corpus.includes(keyword);
  }

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`).test(corpus);
}

export function analyzeResumeTargeting(document: ResumeDocument): ResumeTargetingAnalysis {
  const manualKeywords = dedupeKeywords(document.targeting.focusKeywords);
  const suggestedKeywords =
    manualKeywords.length === 0
      ? extractFocusKeywordsFromJobDescription(document.targeting.jobDescription)
      : [];
  const evaluatedKeywords = manualKeywords.length > 0 ? manualKeywords : suggestedKeywords;
  const corpusByArea = buildCorpusByArea(document);

  const keywordMatches = evaluatedKeywords.map((keyword) => {
    const normalized = normalizeKeyword(keyword);
    const matchedAreas = (Object.entries(corpusByArea) as Array<[KeywordSourceArea, string]>)
      .filter(([, corpus]) => containsKeyword(corpus, normalized))
      .map(([area]) => area);

    return {
      keyword,
      matched: matchedAreas.length > 0,
      matchedAreas,
    } satisfies ResumeKeywordMatch;
  });

  const matchedKeywords = keywordMatches.filter((entry) => entry.matched).map((entry) => entry.keyword);
  const missingKeywords = keywordMatches
    .filter((entry) => !entry.matched)
    .map((entry) => entry.keyword);
  const targetLabel = [document.targeting.role, document.targeting.company]
    .filter(Boolean)
    .join(" @ ");

  return {
    active: Boolean(
      document.targeting.role ||
        document.targeting.company ||
        document.targeting.postingUrl ||
        document.targeting.jobDescription ||
        manualKeywords.length > 0,
    ),
    targetLabel,
    keywordSource:
      manualKeywords.length > 0
        ? "manual"
        : suggestedKeywords.length > 0
          ? "job-description"
          : "none",
    suggestedKeywords,
    evaluatedKeywords,
    matchedKeywords,
    missingKeywords,
    coveragePercent:
      evaluatedKeywords.length > 0
        ? Math.round((matchedKeywords.length / evaluatedKeywords.length) * 100)
        : null,
    keywordMatches,
  };
}
