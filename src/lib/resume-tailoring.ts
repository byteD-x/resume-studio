import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "@/types/resume";
import { mergeDerivedSourceRefs } from "@/lib/resume-derivatives";
import { extractFocusKeywordsFromJobDescription } from "@/lib/resume-targeting";
import { nowIso, stripHtml } from "@/lib/utils";

export interface TailoringItemPlan {
  sectionId: string;
  sectionTitle: string;
  itemId: string;
  itemTitle: string;
  score: number;
  matchedKeywords: string[];
  action: "keep" | "drop" | "fallback";
}

export interface TailoringSectionPlan {
  sectionId: string;
  title: string;
  type: ResumeSection["type"];
  score: number;
  keptItems: number;
  totalItems: number;
  action: "keep" | "drop";
}

export interface TailoredVariantPlan {
  keywordSource: "manual" | "job-description" | "none";
  keywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  keptSections: number;
  droppedSections: number;
  keptItems: number;
  droppedItems: number;
  sectionPlans: TailoringSectionPlan[];
  itemPlans: TailoringItemPlan[];
  titleSuggestion: string;
  canGenerate: boolean;
}

function normalizeKeyword(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}+.#/&-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(corpus: string, keyword: string) {
  if (!corpus || !keyword) return false;

  if (/[\u4e00-\u9fff]/.test(keyword)) {
    return corpus.includes(keyword);
  }

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`).test(corpus);
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

function getTailoringKeywords(document: ResumeDocument) {
  const manualKeywords = dedupeKeywords(document.targeting.focusKeywords);
  if (manualKeywords.length > 0) {
    return {
      keywords: manualKeywords,
      keywordSource: "manual" as const,
    };
  }

  const jdKeywords = extractFocusKeywordsFromJobDescription(document.targeting.jobDescription);
  if (jdKeywords.length > 0) {
    return {
      keywords: jdKeywords,
      keywordSource: "job-description" as const,
    };
  }

  return {
    keywords: [] as string[],
    keywordSource: "none" as const,
  };
}

function collectItemText(item: ResumeSectionItem) {
  return {
    title: normalizeKeyword([item.title, item.subtitle, item.meta].join(" ")),
    body: normalizeKeyword(
      [stripHtml(item.summaryHtml), item.bulletPoints.join(" "), item.tags.join(" ")]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

function computeItemPlan(
  section: ResumeSection,
  item: ResumeSectionItem,
  keywords: string[],
): TailoringItemPlan {
  const text = collectItemText(item);
  const matchedKeywords = keywords.filter((keyword) => {
    const normalized = normalizeKeyword(keyword);
    return containsKeyword(text.title, normalized) || containsKeyword(text.body, normalized);
  });
  const titleMatches = matchedKeywords.filter((keyword) =>
    containsKeyword(text.title, normalizeKeyword(keyword)),
  ).length;
  const bodyMatches = matchedKeywords.length - titleMatches;
  const sectionBonus =
    section.type === "experience" || section.type === "projects" || section.type === "custom"
      ? 1
      : 0;

  return {
    sectionId: section.id,
    sectionTitle: section.title,
    itemId: item.id,
    itemTitle: item.title || "Untitled item",
    score: titleMatches * 5 + bodyMatches * 3 + sectionBonus,
    matchedKeywords,
    action: matchedKeywords.length > 0 ? ("keep" as const) : ("drop" as const),
  };
}

function sortItemPlans(left: TailoringItemPlan, right: TailoringItemPlan) {
  return right.score - left.score || left.itemTitle.localeCompare(right.itemTitle);
}

function buildTitleSuggestion(document: ResumeDocument) {
  const target = document.targeting.company || document.targeting.role || "Tailored";
  return `${document.meta.title} · ${target}`;
}

export function buildTailoredVariantPlan(document: ResumeDocument): TailoredVariantPlan {
  const { keywords, keywordSource } = getTailoringKeywords(document);
  const itemPlans = document.sections.flatMap((section) =>
    section.items.map((item) => computeItemPlan(section, item, keywords)),
  );
  const matchedKeywordSet = new Set(
    itemPlans.flatMap((itemPlan) => itemPlan.matchedKeywords),
  );

  let keepCount = itemPlans.filter((itemPlan) => itemPlan.action === "keep").length;
  if (keywords.length > 0 && keepCount < 3) {
    for (const itemPlan of [...itemPlans].sort(sortItemPlans)) {
      if (keepCount >= 3) break;
      if (itemPlan.action !== "drop") continue;
      itemPlan.action = "fallback";
      keepCount += 1;
    }
  }

  const sectionPlans = document.sections.map((section) => {
    const sectionItemPlans = itemPlans.filter((itemPlan) => itemPlan.sectionId === section.id);
    const keptItems = sectionItemPlans.filter((itemPlan) => itemPlan.action !== "drop").length;
    const score = sectionItemPlans.reduce((sum, itemPlan) => sum + itemPlan.score, 0);
    const keepSection =
      section.type === "summary" ||
      section.type === "skills" ||
      keptItems > 0 ||
      Boolean(section.contentHtml);

    return {
      sectionId: section.id,
      title: section.title,
      type: section.type,
      score,
      keptItems,
      totalItems: section.items.length,
      action: keepSection ? ("keep" as const) : ("drop" as const),
    } satisfies TailoringSectionPlan;
  });

  const matchedKeywords = keywords.filter((keyword) => matchedKeywordSet.has(keyword));
  const missingKeywords = keywords.filter((keyword) => !matchedKeywordSet.has(keyword));

  return {
    keywordSource,
    keywords,
    matchedKeywords,
    missingKeywords,
    keptSections: sectionPlans.filter((section) => section.action === "keep").length,
    droppedSections: sectionPlans.filter((section) => section.action === "drop").length,
    keptItems: itemPlans.filter((itemPlan) => itemPlan.action !== "drop").length,
    droppedItems: itemPlans.filter((itemPlan) => itemPlan.action === "drop").length,
    sectionPlans,
    itemPlans,
    titleSuggestion: buildTitleSuggestion(document),
    canGenerate: keywords.length > 0,
  };
}

function filterSectionItems(
  section: ResumeSection,
  itemPlans: TailoringItemPlan[],
) {
  if (section.items.length === 0) return section.items;

  const plansById = new Map(itemPlans.map((itemPlan) => [itemPlan.itemId, itemPlan]));
  const keptItems = section.items
    .filter((item) => {
      const plan = plansById.get(item.id);
      return plan ? plan.action !== "drop" : false;
    })
    .sort((left, right) => {
      const leftPlan = plansById.get(left.id);
      const rightPlan = plansById.get(right.id);
      return sortItemPlans(
        leftPlan ?? {
          sectionId: section.id,
          sectionTitle: section.title,
          itemId: left.id,
          itemTitle: left.title,
          score: 0,
          matchedKeywords: [],
          action: "drop",
        },
        rightPlan ?? {
          sectionId: section.id,
          sectionTitle: section.title,
          itemId: right.id,
          itemTitle: right.title,
          score: 0,
          matchedKeywords: [],
          action: "drop",
        },
      );
    });

  return keptItems.length > 0 ? keptItems : section.items;
}

export function createTailoredVariantDocument(
  sourceDocument: ResumeDocument,
  input: {
    nextId: string;
    nextTitle?: string;
  },
) {
  const plan = buildTailoredVariantPlan(sourceDocument);
  const sectionPlans = new Map(plan.sectionPlans.map((sectionPlan) => [sectionPlan.sectionId, sectionPlan]));
  const itemPlans = plan.itemPlans.filter((itemPlan) => itemPlan.action !== "drop");
  const sections = sourceDocument.sections
    .filter((section) => sectionPlans.get(section.id)?.action !== "drop")
    .map((section) => ({
      ...section,
      items: filterSectionItems(
        section,
        itemPlans.filter((itemPlan) => itemPlan.sectionId === section.id),
      ),
    }));

  const title = input.nextTitle?.trim() || plan.titleSuggestion;

  return {
    ...sourceDocument,
    meta: {
      ...sourceDocument.meta,
      id: input.nextId,
      title,
      updatedAt: nowIso(),
      sourceRefs: mergeDerivedSourceRefs(sourceDocument.meta.sourceRefs, sourceDocument.meta.id, "tailored"),
    },
    sections,
    importTrace: {
      ...sourceDocument.importTrace,
      pendingReview: Array.from(
        new Set([
          ...sourceDocument.importTrace.pendingReview,
          `Auto-tailored variant kept ${plan.keptItems} items across ${plan.keptSections} sections.`,
          plan.missingKeywords.length > 0
            ? `Still missing keywords: ${plan.missingKeywords.join(", ")}.`
            : "All tailoring keywords are represented in the generated variant.",
        ]),
      ),
    },
  } satisfies ResumeDocument;
}
