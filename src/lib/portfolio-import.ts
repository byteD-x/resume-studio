import { promises as fs } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createEmptyResumeDocument, validateResumeDocument } from "@/lib/resume-document";
import { nowIso, stripHtml, textToHtml, createId } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";

interface PortfolioExperience {
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

interface PortfolioSkillCategory {
  category: string;
  description?: string;
  items: string[];
}

interface PortfolioData {
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

export const DEFAULT_PORTFOLIO_PATH = path.resolve(
  process.cwd(),
  "../portfolio/src/data.ts",
);

async function loadPortfolioModule(filePath: string) {
  const source = await fs.readFile(filePath, "utf8");
  const transpiled = ts.transpileModule(source.replace(/^\uFEFF/, ""), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      esModuleInterop: true,
    },
  }).outputText;

  const cjsModule = { exports: {} as Record<string, unknown> };
  const sandbox = {
    module: cjsModule,
    exports: cjsModule.exports,
    require: () => {
      throw new Error("Portfolio importer only supports type-only imports.");
    },
  };

  vm.runInNewContext(transpiled, sandbox, { filename: filePath });
  return cjsModule.exports;
}

export async function readPortfolioData(filePath = DEFAULT_PORTFOLIO_PATH) {
  const exports = await loadPortfolioModule(filePath);
  const portfolioData = exports.defaultPortfolioData;

  if (!portfolioData) {
    throw new Error(`Could not read defaultPortfolioData from ${filePath}`);
  }

  return portfolioData as PortfolioData;
}

function mapListSection(
  title: string,
  type: "experience" | "projects",
  items: PortfolioExperience[],
) {
  return {
    id: createId("section"),
    type,
    title,
    visible: true,
    layout: "stacked-list" as const,
    contentHtml: "",
    items: items.map((item) => ({
      id: item.id,
      title: item.company ?? item.name ?? "",
      subtitle: item.role ?? "",
      location: item.location ?? "",
      dateRange: item.year,
      meta: item.techTags.join(" · "),
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
    visible: true,
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

export async function importPortfolioToResume(
  options: {
    portfolioPath?: string;
    existingDocument?: ResumeDocument;
    resumeId?: string;
  } = {},
) {
  const filePath = options.portfolioPath ?? DEFAULT_PORTFOLIO_PATH;
  const portfolio = await readPortfolioData(filePath);
  const baseDocument =
    options.existingDocument ??
    createEmptyResumeDocument(options.resumeId ?? "default", "Portfolio Draft");

  const links = [...(portfolio.contact.websiteLinks ?? [])];
  if (portfolio.contact.github) {
    links.unshift({ label: "GitHub", url: portfolio.contact.github });
  }

  const document = validateResumeDocument({
    ...baseDocument,
    basics: {
      ...baseDocument.basics,
      name: portfolio.hero.name,
      headline: portfolio.hero.title,
      location: portfolio.hero.location ?? "",
      email: portfolio.contact.email,
      phone: portfolio.contact.phone,
      website: links[0]?.url ?? "",
      summaryHtml: textToHtml(
        [portfolio.hero.subtitle, portfolio.about.zh].filter(Boolean).join("\n\n"),
      ),
      links,
    },
    meta: {
      ...baseDocument.meta,
      id: options.resumeId ?? baseDocument.meta.id,
      title: `${portfolio.hero.name} Resume`,
      sourceRefs: Array.from(new Set([...baseDocument.meta.sourceRefs, filePath])),
      updatedAt: nowIso(),
    },
    sections: [
      {
        id: createId("section"),
        type: "summary",
        title: "Profile",
        visible: true,
        layout: "rich-text",
        contentHtml: textToHtml(
          [portfolio.hero.subtitle, portfolio.about.zh].filter(Boolean).join("\n\n"),
        ),
        items: [],
      },
      mapListSection("Experience", "experience", portfolio.timeline),
      mapListSection("Projects", "projects", portfolio.projects),
      mapSkillsSection(portfolio.skills),
    ],
    importTrace: {
      portfolioImportedAt: nowIso(),
      pdfImportedAt: baseDocument.importTrace.pdfImportedAt,
      unmapped: [
        "impact metrics",
        "services",
        "audience cards",
        "consultation checklist",
      ],
      pendingReview: [
        "Review wording length for one-page fit",
        "Trim highlighted portfolio metrics if not relevant to target role",
      ],
    },
  });

  return {
    document,
    rawPortfolio: portfolio,
    summary: stripHtml(document.basics.summaryHtml),
    sourcePath: filePath,
  };
}
