import { createId, textToHtml } from "@/lib/utils";
import type { ResumeDocument, ResumeSection } from "@/types/resume";
import { buildStructuredItems } from "./content-parsers";
import type { ImportedPdfSection } from "./shared";
import {
  buildSectionTitle,
  normalizeImportedLine,
  resolveSectionType,
  splitSkillTags,
} from "./text-helpers";

export function buildPdfSection(section: ImportedPdfSection): ResumeSection {
  const type = resolveSectionType(section.heading);
  const title = buildSectionTitle(section.heading, type);

  if (type === "skills") {
    const tags = splitSkillTags(section.lines);
    return {
      id: createId("section"),
      type,
      title,
      visible: true,
      layout: "tag-grid",
      contentHtml: tags.length === 0 ? textToHtml(section.lines.join("\n")) : "",
      items: tags.length > 0
        ? [
            {
              id: createId("item"),
              title: "技能清单",
              subtitle: "",
              location: "",
              dateRange: "",
              meta: "",
              summaryHtml: "",
              bulletPoints: [],
              tags,
            },
          ]
        : [],
      };
  }

  if (type === "experience" || type === "projects" || type === "education") {
    const items = buildStructuredItems(section.lines, type);
    if (items.length > 0) {
      return {
        id: createId("section"),
        type,
        title,
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items,
      };
    }
  }

  return {
    id: createId("section"),
    type,
    title,
    visible: true,
    layout: "rich-text",
    contentHtml: textToHtml(section.lines.join("\n")),
    items: [],
  };
}

function buildLinkLabel(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.includes("github.com")) return "GitHub";
  if (normalized.includes("linkedin.com")) return "LinkedIn";
  if (normalized.includes("behance.net")) return "Behance";
  return "作品链接";
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function stripContactTokens(line: string) {
  const emailMatches = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const urlMatches = line.match(/(?:https?:\/\/|www\.)\S+|(?:github|linkedin)\.com\/\S+/gi) ?? [];
  const phoneMatches = line.match(/(?:\+?\d[\d\s\-()]{6,}\d)/g) ?? [];

  let remainder = line;
  for (const value of [...emailMatches, ...urlMatches, ...phoneMatches]) {
    remainder = remainder.replace(value, " ");
  }

  remainder = remainder.replace(/[·•|/]/g, " ");

  return {
    emails: emailMatches.map(normalizeImportedLine),
    urls: urlMatches.map((value) => normalizeImportedLine(value).replace(/[.,;]+$/, "")),
    phones: phoneMatches.map(normalizeImportedLine),
    remainder: normalizeImportedLine(remainder),
  };
}

export function extractBasicsFromPrelude(lines: string[], baseDocument: ResumeDocument) {
  const emails = new Set<string>();
  const urls = new Set<string>();
  const phones = new Set<string>();
  const narrativeLines: string[] = [];

  for (const line of lines) {
    const result = stripContactTokens(line);
    result.emails.forEach((value) => emails.add(value));
    result.urls.forEach((value) => urls.add(normalizeUrl(value)));
    result.phones.forEach((value) => phones.add(value));
    if (result.remainder) {
      narrativeLines.push(result.remainder);
    }
  }

  const name = narrativeLines[0] ?? baseDocument.basics.name;
  const headline = narrativeLines[1] ?? baseDocument.basics.headline;
  const remainingLines = narrativeLines.slice(2);
  const links = [...urls].map((url) => ({
    label: buildLinkLabel(url),
    url,
  }));

  return {
    basics: {
      ...baseDocument.basics,
      name,
      headline,
      email: [...emails][0] ?? baseDocument.basics.email,
      phone: [...phones][0] ?? baseDocument.basics.phone,
      website: [...urls][0] ?? baseDocument.basics.website,
      summaryHtml:
        remainingLines.length > 0
          ? textToHtml(remainingLines.join("\n"))
          : baseDocument.basics.summaryHtml,
      links: links.length > 0 ? links : baseDocument.basics.links,
    },
    remainingLines,
  };
}
