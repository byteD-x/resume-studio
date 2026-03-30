import { createEmptyResumeDocument, validateResumeDocument } from "@/lib/resume-document";
import { nowIso, stripHtml, textToHtml, createId } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";

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

export function parseTextPortfolio(content: string): PortfolioData {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  const emailMatch = content.match(/[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/);
  const phoneMatch = content.match(/1[3-9]\d{9}/);
  const urlMatches = content.match(/https?:\/\/[^\s]+/g) || [];
  
  const github = urlMatches.find(u => u.includes('github.com')) || "";
  const otherLinks = urlMatches.filter(u => !u.includes('github.com')).map(u => ({ label: "Website", url: u }));

  let name = "未命名";
  let title = "求职者";
  let subtitle = "";
  
  if (lines.length > 0) name = lines[0].substring(0, 30).replace(/#+\s*/g, '');
  if (lines.length > 1) title = lines[1].substring(0, 50).replace(/#+\s*/g, '');
  if (lines.length > 2) subtitle = lines.slice(2, 5).join(' ').substring(0, 200);

  const timeline: PortfolioExperience[] = [];
  const projects: PortfolioExperience[] = [];
  
  // A heuristic to split content into blocks based on blank lines or common headers
  const contentBlocks: string[][] = [];
  let currentBlock: string[] = [];
  for (const line of lines.slice(2)) {
    if (line.match(/^(项目|经历|工作|Project|Experience|#)/)) {
      if (currentBlock.length > 0) {
        contentBlocks.push(currentBlock);
        currentBlock = [];
      }
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) contentBlocks.push(currentBlock);

  // Distribute blocks
  contentBlocks.forEach((block, index) => {
    if (block.length < 2) return;
    const header = block[0].replace(/#+\s*/, '');
    const isProject = header.toLowerCase().includes('项目') || header.toLowerCase().includes('project');
    const roleOrName = header;
    const summary = block.slice(1).join('\n');
    
    const item: PortfolioExperience = {
      id: createId("exp"),
      year: "未知时间",
      name: isProject ? roleOrName : undefined,
      company: !isProject ? roleOrName : undefined,
      role: isProject ? "" : "相关角色",
      summary: summary,
      techTags: [],
    };
    
    if (isProject) {
      projects.push(item);
    } else {
      timeline.push(item);
    }
  });

  // Fallback if empty
  if (projects.length === 0 && timeline.length === 0 && lines.length > 5) {
     projects.push({
       id: createId("exp"),
       year: "近期",
       name: "导入项目",
       summary: lines.slice(5, 15).join('\n'),
       techTags: []
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
      websiteLinks: otherLinks
    }
  };
}

export async function fetchAndParseUrl(url: string): Promise<PortfolioData> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Portfolio-Importer" }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // simplistic text extraction
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const targetHtml = bodyMatch ? bodyMatch[1] : html;
    
    const text = targetHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    return parseTextPortfolio(text);
  } catch (error) {
    throw new Error(`无法抓取网页: ${error instanceof Error ? error.message : String(error)}`);
  }
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

export async function importPortfolioToResume(
  options: {
    source: "url" | "markdown" | "text";
    payload: string;
    existingDocument?: ResumeDocument;
    resumeId?: string;
  }
) {
  let portfolio: Readonly<PortfolioData>;
  
  if (options.source === "url") {
    portfolio = await fetchAndParseUrl(options.payload);
  } else {
    portfolio = parseTextPortfolio(options.payload);
  }

  const baseDocument =
    options.existingDocument ??
    createEmptyResumeDocument(options.resumeId ?? "default", "Imported Draft");

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
      title: `${portfolio.hero.name} 的简历`,
      updatedAt: nowIso(),
    },
    sections: [
      {
        id: createId("section"),
        type: "summary",
        title: "个人简介",
        visible: !!portfolio.about.zh || !!portfolio.hero.subtitle,
        layout: "rich-text",
        contentHtml: textToHtml(
          [portfolio.hero.subtitle, portfolio.about.zh].filter(Boolean).join("\n\n"),
        ),
        items: [],
      },
      mapListSection("工作经历", "experience", portfolio.timeline),
      mapListSection("项目经历", "projects", portfolio.projects),
      mapSkillsSection(portfolio.skills),
    ],
    importTrace: {
      ...baseDocument.importTrace,
      portfolioImportedAt: nowIso(),
    },
  });

  return {
    document,
    rawPortfolio: portfolio,
    summary: stripHtml(document.basics.summaryHtml),
    sourcePath: options.source === "url" ? options.payload : "pasted-content",
  };
}
