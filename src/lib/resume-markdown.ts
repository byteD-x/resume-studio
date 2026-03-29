import { createEmptyResumeDocument, validateResumeDocument } from "@/lib/resume-document";
import { htmlToMarkdown, markdownToHtml, normalizeMarkdown } from "@/lib/markdown";
import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "@/types/resume";
import { createId, stripHtml } from "@/lib/utils";

const SECTION_TYPE_MAP = new Map<string, ResumeSection["type"]>([
  ["summary", "summary"],
  ["profile", "summary"],
  ["about", "summary"],
  ["experience", "experience"],
  ["work experience", "experience"],
  ["projects", "projects"],
  ["project experience", "projects"],
  ["education", "education"],
  ["skills", "skills"],
]);

function detectSectionType(title: string): ResumeSection["type"] {
  return SECTION_TYPE_MAP.get(title.trim().toLowerCase()) ?? "custom";
}

function sectionToMarkdown(section: ResumeSection) {
  const heading = `## ${section.title || "Untitled Section"} [${section.type}]`;
  const intro = normalizeMarkdown(htmlToMarkdown(section.contentHtml));

  if (section.layout === "rich-text" && section.items.length === 0) {
    return [heading, intro].filter(Boolean).join("\n\n");
  }

  const items = section.items.map((item) => itemToMarkdown(item)).join("\n\n");
  return [heading, intro, items].filter(Boolean).join("\n\n");
}

function itemToMarkdown(item: ResumeSectionItem) {
  const lines = [`### ${item.title || "Untitled Item"}`];

  if (item.subtitle) lines.push(`- Subtitle: ${item.subtitle}`);
  if (item.dateRange) lines.push(`- Date: ${item.dateRange}`);
  if (item.location) lines.push(`- Location: ${item.location}`);
  if (item.meta) lines.push(`- Meta: ${item.meta}`);
  if (item.tags.length) lines.push(`- Tags: ${item.tags.join(", ")}`);

  const summary = normalizeMarkdown(htmlToMarkdown(item.summaryHtml));
  if (summary) lines.push("", summary);

  if (item.bulletPoints.length) {
    lines.push("", ...item.bulletPoints.map((bullet) => `- ${bullet}`));
  }

  return lines.join("\n");
}

export function serializeResumeToMarkdown(document: ResumeDocument) {
  const lines = [
    `# ${document.basics.name || document.meta.title}`,
    document.basics.headline ? `> ${document.basics.headline}` : "",
    document.basics.location ? `- Location: ${document.basics.location}` : "",
    document.basics.email ? `- Email: ${document.basics.email}` : "",
    document.basics.phone ? `- Phone: ${document.basics.phone}` : "",
    document.basics.website ? `- Website: ${document.basics.website}` : "",
    ...document.basics.links.map((link) => `- Link: ${link.label} | ${link.url}`),
    "",
    "## Summary [summary]",
    normalizeMarkdown(htmlToMarkdown(document.basics.summaryHtml)),
    "",
    ...document.sections.filter((section) => section.visible).map(sectionToMarkdown),
  ];

  return lines.filter((line, index, array) => {
    if (line !== "") return true;
    return array[index - 1] !== "";
  }).join("\n");
}

function parseKeyValue(line: string) {
  const match = /^-\s*([^:]+):\s*(.*)$/.exec(line.trim());
  if (!match) return null;
  return {
    key: match[1].trim().toLowerCase(),
    value: match[2].trim(),
  };
}

function flushItemBuffer(
  lines: string[],
  title: string,
): ResumeSectionItem {
  const item: ResumeSectionItem = {
    id: createId("item"),
    title,
    subtitle: "",
    location: "",
    dateRange: "",
    meta: "",
    summaryHtml: "",
    bulletPoints: [],
    tags: [],
  };
  const bodyLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const parsed = parseKeyValue(line);

    if (parsed) {
      switch (parsed.key) {
        case "subtitle":
          item.subtitle = parsed.value;
          continue;
        case "date":
          item.dateRange = parsed.value;
          continue;
        case "location":
          item.location = parsed.value;
          continue;
        case "meta":
          item.meta = parsed.value;
          continue;
        case "tags":
          item.tags = parsed.value
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
          continue;
        default:
          break;
      }
    }

    if (/^-\s+/.test(line)) {
      item.bulletPoints.push(line.replace(/^-\s+/, "").trim());
      continue;
    }

    bodyLines.push(rawLine);
  }

  const bodyMarkdown = normalizeMarkdown(bodyLines.join("\n"));
  item.summaryHtml = bodyMarkdown ? markdownToHtml(bodyMarkdown) : "";
  return item;
}

function flushSectionBuffer(
  sectionHeading: string,
  sectionLines: string[],
): ResumeSection | null {
  const headingMatch = /^##\s+(.+?)(?:\s+\[(.+)\])?$/.exec(sectionHeading.trim());
  if (!headingMatch) return null;

  const title = headingMatch[1].trim();
  const explicitType = headingMatch[2]?.trim().toLowerCase();
  const type =
    explicitType && ["summary", "experience", "projects", "education", "skills", "custom"].includes(explicitType)
      ? (explicitType as ResumeSection["type"])
      : detectSectionType(title);

  const section: ResumeSection = {
    id: createId("section"),
    type,
    title,
    visible: true,
    layout: type === "skills" ? "tag-grid" : type === "summary" ? "rich-text" : "stacked-list",
    contentHtml: "",
    items: [],
  };

  const introLines: string[] = [];
  let activeItemTitle: string | null = null;
  let activeItemLines: string[] = [];

  const flushCurrentItem = () => {
    if (!activeItemTitle) return;
    section.items.push(flushItemBuffer(activeItemLines, activeItemTitle));
    activeItemTitle = null;
    activeItemLines = [];
  };

  for (const line of sectionLines) {
    if (/^###\s+/.test(line)) {
      flushCurrentItem();
      activeItemTitle = line.replace(/^###\s+/, "").trim();
      continue;
    }

    if (activeItemTitle) {
      activeItemLines.push(line);
    } else {
      introLines.push(line);
    }
  }

  flushCurrentItem();

  const introMarkdown = normalizeMarkdown(introLines.join("\n"));
  if (introMarkdown) {
    section.contentHtml = markdownToHtml(introMarkdown);
  }

  if (type === "skills" && section.items.length === 0) {
    const tags = sectionLines
      .flatMap((line) =>
        line
          .replace(/^-\s+/, "")
          .split(",")
          .map((value) => value.trim()),
      )
      .filter(Boolean);
    section.items.push({
      id: createId("item"),
      title: "Skills",
      subtitle: "",
      location: "",
      dateRange: "",
      meta: "",
      summaryHtml: "",
      bulletPoints: [],
      tags,
    });
  }

  return section;
}

export function parseResumeFromMarkdown(
  markdown: string,
  options: {
    existingDocument?: ResumeDocument;
    resumeId?: string;
  } = {},
) {
  const normalized = normalizeMarkdown(markdown);
  const lines = normalized.split("\n");
  const baseDocument =
    options.existingDocument ??
    createEmptyResumeDocument(options.resumeId ?? "default", "Markdown Draft");

  let name = "";
  let headline = "";
  let location = "";
  let email = "";
  let phone = "";
  let website = "";
  const links: ResumeDocument["basics"]["links"] = [];

  const sections: ResumeSection[] = [];
  let activeSectionHeading: string | null = null;
  let activeSectionLines: string[] = [];
  const headerLines: string[] = [];

  const flushSection = () => {
    if (!activeSectionHeading) return;
    const parsed = flushSectionBuffer(activeSectionHeading, activeSectionLines);
    if (parsed) sections.push(parsed);
    activeSectionHeading = null;
    activeSectionLines = [];
  };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      flushSection();
      activeSectionHeading = line;
      continue;
    }

    if (activeSectionHeading) {
      activeSectionLines.push(line);
    } else {
      headerLines.push(line);
    }
  }

  flushSection();

  for (const line of headerLines) {
    if (/^#\s+/.test(line)) {
      name = line.replace(/^#\s+/, "").trim();
      continue;
    }
    if (/^>\s+/.test(line)) {
      headline = line.replace(/^>\s+/, "").trim();
      continue;
    }

    const parsed = parseKeyValue(line);
    if (!parsed) continue;

    switch (parsed.key) {
      case "location":
        location = parsed.value;
        break;
      case "email":
        email = parsed.value;
        break;
      case "phone":
        phone = parsed.value;
        break;
      case "website":
        website = parsed.value;
        break;
      case "link": {
        const [label, url] = parsed.value.split("|").map((value) => value.trim());
        if (label && url) {
          links.push({ label, url });
        }
        break;
      }
      default:
        break;
    }
  }

  const summarySection = sections.find((section) => section.type === "summary");
  const remainingSections = sections.filter((section) => section !== summarySection);

  return validateResumeDocument({
    ...baseDocument,
    meta: {
      ...baseDocument.meta,
      id: options.resumeId ?? baseDocument.meta.id,
      title: name ? `${name} Resume` : baseDocument.meta.title,
    },
    basics: {
      ...baseDocument.basics,
      name: name || baseDocument.basics.name,
      headline: headline || baseDocument.basics.headline,
      location: location || baseDocument.basics.location,
      email: email || baseDocument.basics.email,
      phone: phone || baseDocument.basics.phone,
      website: website || baseDocument.basics.website,
      links: links.length > 0 ? links : baseDocument.basics.links,
      summaryHtml:
        summarySection?.contentHtml ||
        (summarySection?.items[0]?.summaryHtml ?? baseDocument.basics.summaryHtml),
    },
    sections: remainingSections.length > 0 ? remainingSections : baseDocument.sections,
    importTrace: {
      ...baseDocument.importTrace,
      pendingReview: Array.from(
        new Set([
          ...baseDocument.importTrace.pendingReview,
          "Review markdown-imported section structure and item grouping.",
        ]),
      ),
    },
  });
}

export function summarizeMarkdownDocument(document: ResumeDocument) {
  return {
    title: document.meta.title,
    sectionCount: document.sections.length,
    visibleSectionTitles: document.sections.filter((section) => section.visible).map((section) => section.title),
    summary: stripHtml(document.basics.summaryHtml).slice(0, 180),
  };
}
