import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createEmptyResumeDocument, validateResumeDocument } from "@/lib/resume-document";
import { buildBasicsImportFieldSuggestions } from "@/lib/resume-import-review";
import { createId, nowIso, textToHtml } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";
import { extractBasicsFromPrelude, buildPdfSection } from "./section-builders";
import type { ImportedPdfSection, RawPdfLine } from "./shared";
import { joinTextFragments, normalizeHeadingKey, normalizeImportedLine, resolveSectionType } from "./text-helpers";

const MAX_PDF_IMPORT_PAGES = 20;

export function groupPdfLines(lines: RawPdfLine[]) {
  const byPage = new Map<number, RawPdfLine[]>();

  for (const line of lines) {
    const current = byPage.get(line.page) ?? [];
    current.push(line);
    byPage.set(line.page, current);
  }

  return [...byPage.entries()]
    .sort((left, right) => left[0] - right[0])
    .flatMap(([, pageLines]) => {
      const sorted = [...pageLines].sort((left, right) =>
        right.y === left.y ? left.x - right.x : right.y - left.y,
      );
      const visualLines: RawPdfLine[][] = [];

      for (const line of sorted) {
        const currentLine = visualLines[visualLines.length - 1];
        if (!currentLine) {
          visualLines.push([line]);
          continue;
        }

        const referenceY = currentLine[0]?.y ?? line.y;
        if (Math.abs(referenceY - line.y) <= 2.5) {
          currentLine.push(line);
        } else {
          visualLines.push([line]);
        }
      }

      return visualLines
        .map((fragments) =>
          joinTextFragments(
            [...fragments]
              .sort((left, right) => left.x - right.x)
              .map((entry) => entry.text),
          ),
        )
        .filter(Boolean);
    });
}

export function splitImportedPdfSections(lines: string[]) {
  const sections: ImportedPdfSection[] = [];
  const prelude: string[] = [];
  let currentSection: ImportedPdfSection | null = null;

  for (const rawLine of lines) {
    const line = normalizeImportedLine(rawLine);
    if (!line) continue;

    const sectionType = resolveSectionType(line);
    if (sectionType !== "custom" && normalizeHeadingKey(line).length <= 32) {
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: line.replace(/[：:]+$/, ""),
        lines: [],
      };
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      prelude.push(line);
    }
  }

  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return { prelude, sections };
}

export function buildResumeFromPdfLines(
  lines: string[],
  options: {
    existingDocument?: ResumeDocument;
    resumeId?: string;
  } = {},
) {
  const baseDocument =
    options.existingDocument ??
    createEmptyResumeDocument(options.resumeId ?? "default", "导入的 PDF 简历");
  const { prelude, sections } = splitImportedPdfSections(lines);
  const extracted = extractBasicsFromPrelude(prelude, baseDocument);
  const mappedSections = sections.map(buildPdfSection);

  if (mappedSections.length === 0 && extracted.remainingLines.length > 0) {
    mappedSections.push({
      id: createId("section"),
      type: "custom",
      title: "导入内容",
      visible: true,
      layout: "rich-text",
      contentHtml: textToHtml(extracted.remainingLines.join("\n")),
      items: [],
    });
  }

  const importedAt = nowIso();
  const pendingReview = [
    "请检查换行、项目符号和时间范围是否被正确识别。",
    "请核对导入后的内容顺序，确保最重要的经历仍排在前面。",
  ];
  const unmapped = ["PDF 中的视觉样式、双栏布局和字号层级不会被完整保留。"];

  if (sections.length === 0) {
    pendingReview.unshift("没有识别出标准章节标题，当前按原始阅读顺序导入。");
  }

  if (!extracted.basics.name.trim() || !extracted.basics.headline.trim()) {
    pendingReview.unshift("页眉信息未完整识别，请补全姓名、职位标题和联系方式。");
  }

  if (mappedSections.some((section) => section.type === "custom")) {
    unmapped.push("部分内容未识别为标准章节，已作为自定义内容导入。");
  }

  const fieldSuggestions = buildBasicsImportFieldSuggestions(baseDocument.basics, extracted.basics, "PDF 导入");

  return validateResumeDocument({
    ...baseDocument,
    basics: extracted.basics,
    meta: {
      ...baseDocument.meta,
      id: options.resumeId ?? baseDocument.meta.id,
      title: baseDocument.meta.title || "导入的 PDF 简历",
      updatedAt: importedAt,
    },
    sections: mappedSections.length > 0 ? mappedSections : baseDocument.sections,
    importTrace: {
      ...baseDocument.importTrace,
      portfolioImportedAt: baseDocument.importTrace.portfolioImportedAt,
      pdfImportedAt: importedAt,
      unmapped,
      pendingReview,
      snapshots: [],
      fieldSuggestions,
      reviewState: {
        completedTaskIds: [],
        reviewedPendingItems: [],
        reviewedSnapshotIds: [],
        reviewedFieldSuggestionIds: [],
      },
    },
  });
}

export async function importPdfToResume(
  buffer: Buffer,
  options: {
    existingDocument?: ResumeDocument;
    resumeId?: string;
  } = {},
) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  if (pdf.numPages > MAX_PDF_IMPORT_PAGES) {
    throw new Error(`PDF import supports up to ${MAX_PDF_IMPORT_PAGES} pages.`);
  }
  const rawLines: RawPdfLine[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      rawLines.push({
        page: pageNumber,
        text: item.str,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        fontName: item.fontName ?? "",
        fontSize: Number(item.height ?? 0),
      });
    }
  }

  const lines = groupPdfLines(rawLines);
  const document = buildResumeFromPdfLines(lines, options);

  return {
    document,
    rawPdf: {
      pageCount: pdf.numPages,
      lines: rawLines,
    },
  };
}

export type { ImportedPdfSection, RawPdfLine } from "./shared";
