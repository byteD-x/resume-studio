import { createId, textToHtml } from "@/lib/utils";
import type { ResumeSection, ResumeSectionItem } from "@/types/resume";
import { cleanBulletLine, isBulletLine, looksLikeMetaLine, normalizeImportedLine } from "./text-helpers";
import {
  isRoleOnlyLine,
  normalizeStructuredHeaderBlock,
  parseEducationHeaderLine,
  parseEntryHeaderLine,
  parseMetaLine,
  splitStructuredEntryBlocks,
} from "./header-parsers";

function looksLikeEducationMetaLine(line: string) {
  return /^(?:gpa|cgpa|绩点|平均绩点|honors?|awards?|scholarships?|奖学金|荣誉|奖项|排名|coursework|relevant coursework|courses|relevant courses|主修课程|核心课程|相关课程)[:：]?\s*/i
    .test(line);
}

function looksLikeEducationNarrativeLine(line: string) {
  return /^(?:research|research interests?|thesis|dissertation|capstone|毕业设计|毕业论文|论文题目|研究方向|研究课题|课题方向)[:：]?\s*/i
    .test(line);
}

function extractEducationContent(contentLines: string[]) {
  const metaParts: string[] = [];
  const summaryLines: string[] = [];
  const bulletPoints = contentLines
    .filter((line) => isBulletLine(line))
    .map(cleanBulletLine)
    .filter(Boolean);

  for (const line of contentLines.filter((entry) => !isBulletLine(entry))) {
    if (looksLikeEducationMetaLine(line)) {
      metaParts.push(line);
      continue;
    }

    if (looksLikeEducationNarrativeLine(line)) {
      summaryLines.push(line);
      continue;
    }

    if (/^(?:gpa|绩点)\b/i.test(line) || /(?:奖学金|荣誉|课程|coursework|courses)/i.test(line)) {
      metaParts.push(line);
      continue;
    }

    summaryLines.push(line);
  }

  return {
    meta: metaParts.join(" · "),
    summaryHtml: summaryLines.length > 0 ? textToHtml(summaryLines.join("\n")) : "",
    bulletPoints,
  };
}

function looksLikeProjectStackLine(line: string) {
  return /^(?:tech stack|stack|tools|technologies|built with|技术栈|技术选型|使用技术|核心技术)[:：]?\s*/i
    .test(line);
}

function extractProjectTags(line: string) {
  const normalized = normalizeImportedLine(
    line.replace(/^(?:tech stack|stack|tools|technologies|built with|技术栈|技术选型|使用技术|核心技术)[:：]?\s*/i, ""),
  );

  return Array.from(
    new Set(
      normalized
        .split(/[，,、|/·]/)
        .map((entry) => normalizeImportedLine(entry))
        .filter((entry) => entry.length > 0 && entry.length <= 48),
    ),
  );
}

function looksLikeProjectOutcomeLine(line: string) {
  return /(?:\d+%|\d+\s*(?:ms|s|sec|秒|分钟|天|周|月|年|x|倍|万|千|M|K)|提升|降低|减少|缩短|增长|节省|优化|improved|reduced|decreased|increased|grew|cut|saved|launched|shipped|delivered)/i
    .test(line);
}

function extractProjectContent(contentLines: string[]) {
  const tags = new Set<string>();
  const bulletPoints: string[] = [];
  const summaryLines: string[] = [];

  for (const line of contentLines) {
    if (isBulletLine(line)) {
      bulletPoints.push(cleanBulletLine(line));
      continue;
    }

    if (looksLikeProjectStackLine(line)) {
      for (const tag of extractProjectTags(line)) {
        tags.add(tag);
      }
      continue;
    }

    if (looksLikeProjectOutcomeLine(line) && line.length <= 160) {
      bulletPoints.push(line);
      continue;
    }

    summaryLines.push(line);
  }

  return {
    tags: Array.from(tags),
    summaryHtml: summaryLines.length > 0 ? textToHtml(summaryLines.join("\n")) : "",
    bulletPoints,
  };
}

export function buildStructuredItems(lines: string[], type: ResumeSection["type"]) {
  return splitStructuredEntryBlocks(lines)
    .map((block) => {
      const normalizedBlock = normalizeStructuredHeaderBlock(
        block.map(normalizeImportedLine).filter(Boolean),
        type,
      );
      const headerInfo = type === "education"
        ? parseEducationHeaderLine(normalizedBlock[0] ?? "")
        : parseEntryHeaderLine(normalizedBlock[0] ?? "");
      const metaCandidate = normalizedBlock[1] ?? "";
      const hasMetaLine = looksLikeMetaLine(metaCandidate);
      const hasRoleOnlyMeta = !hasMetaLine && (type === "experience" || type === "projects") && isRoleOnlyLine(metaCandidate);
      const metaInfo = hasMetaLine ? parseMetaLine(metaCandidate) : hasRoleOnlyMeta ? {
        subtitle: metaCandidate,
        location: "",
        dateRange: "",
        meta: "",
      } : {
        subtitle: "",
        location: "",
        dateRange: "",
        meta: "",
      };
      const contentLines = normalizedBlock.slice(hasMetaLine || hasRoleOnlyMeta ? 2 : 1);
      const defaultBulletPoints = contentLines
        .filter((line) => isBulletLine(line))
        .map(cleanBulletLine)
        .filter(Boolean);
      const defaultSummaryLines = contentLines.filter((line) => !isBulletLine(line));
      const educationContent = type === "education" ? extractEducationContent(contentLines) : null;
      const projectContent = type === "projects" ? extractProjectContent(contentLines) : null;
      const bulletPoints = educationContent?.bulletPoints ?? defaultBulletPoints;
      const summaryHtml = educationContent?.summaryHtml
        ?? projectContent?.summaryHtml
        ?? (defaultSummaryLines.length > 0 ? textToHtml(defaultSummaryLines.join("\n")) : "");
      const finalBulletPoints = projectContent?.bulletPoints ?? bulletPoints;

      const mergedMeta = [headerInfo.meta, metaInfo.meta, educationContent?.meta ?? ""]
        .filter(Boolean)
        .join(" · ");

      return {
        id: createId("item"),
        title: headerInfo.title,
        subtitle: metaInfo.subtitle || headerInfo.subtitle,
        location: metaInfo.location || headerInfo.location,
        dateRange: metaInfo.dateRange || headerInfo.dateRange,
        meta: mergedMeta,
        summaryHtml,
        bulletPoints: finalBulletPoints,
        tags: projectContent?.tags ?? [],
      } satisfies ResumeSectionItem;
    })
    .filter((item) =>
      [item.title, item.subtitle, item.location, item.dateRange, item.meta, item.summaryHtml]
        .join("")
        .trim().length > 0 || item.bulletPoints.length > 0 || item.tags.length > 0,
    );
}
