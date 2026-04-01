import type { PortfolioData } from "@/lib/portfolio-import";
import type { ResumeAiSettings } from "@/types/resume";
import { extractJsonObject } from "@/lib/resume-ai/parsing";
import { requestRemoteResumeAiText } from "@/lib/resume-ai/remote-client";

function ensureString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function ensureStringArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      )
    : [];
}

function normalizeExperienceArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const summary = ensureString(record.summary);

      return {
        id: ensureString(record.id, `ai-import-${index + 1}`),
        year: ensureString(record.year),
        role: ensureString(record.role),
        company: ensureString(record.company),
        name: ensureString(record.name),
        location: ensureString(record.location),
        summary,
        techTags: ensureStringArray(record.techTags),
        keyOutcomes: ensureStringArray(record.keyOutcomes),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.summary || item.company || item.name || item.role);
}

function normalizeSkillArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const category = ensureString(record.category);
      const items = ensureStringArray(record.items);
      if (!category && items.length === 0) return null;

      return {
        category: category || "Skills",
        description: ensureString(record.description),
        items,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function mergePortfolioData(fallback: PortfolioData, payload: Record<string, unknown> | null): PortfolioData {
  if (!payload) return fallback;

  const hero = payload.hero && typeof payload.hero === "object" ? (payload.hero as Record<string, unknown>) : {};
  const about = payload.about && typeof payload.about === "object" ? (payload.about as Record<string, unknown>) : {};
  const contact =
    payload.contact && typeof payload.contact === "object" ? (payload.contact as Record<string, unknown>) : {};

  const websiteLinks = Array.isArray(contact.websiteLinks)
    ? contact.websiteLinks
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const record = item as Record<string, unknown>;
          const url = ensureString(record.url);
          if (!url) return null;
          return {
            label: ensureString(record.label, "Website"),
            url,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : fallback.contact.websiteLinks ?? [];

  return {
    hero: {
      name: ensureString(hero.name, fallback.hero.name),
      title: ensureString(hero.title, fallback.hero.title),
      subtitle: ensureString(hero.subtitle, fallback.hero.subtitle),
      location: ensureString(hero.location, fallback.hero.location ?? ""),
    },
    about: {
      zh: ensureString(about.zh, fallback.about.zh),
    },
    timeline: normalizeExperienceArray(payload.timeline).length > 0 ? normalizeExperienceArray(payload.timeline) : fallback.timeline,
    projects: normalizeExperienceArray(payload.projects).length > 0 ? normalizeExperienceArray(payload.projects) : fallback.projects,
    skills: normalizeSkillArray(payload.skills).length > 0 ? normalizeSkillArray(payload.skills) : fallback.skills,
    contact: {
      email: ensureString(contact.email, fallback.contact.email),
      phone: ensureString(contact.phone, fallback.contact.phone),
      websiteLinks,
      github: ensureString(contact.github, fallback.contact.github ?? ""),
    },
  };
}

export async function generateWebsiteImportPortfolio(options: {
  sourceUrl: string;
  aggregatedText: string;
  settings: ResumeAiSettings;
  fallback: PortfolioData;
  apiKey?: string;
}) {
  const prompt = [
    "You are extracting resume-ready data from a personal website.",
    "Return JSON only.",
    "Do not invent employers, roles, metrics, skills, dates, or education.",
    "If a field is unclear, keep it empty instead of guessing.",
    "Use this JSON shape exactly:",
    '{"hero":{"name":"","title":"","subtitle":"","location":""},"about":{"zh":""},"timeline":[{"id":"","year":"","role":"","company":"","name":"","location":"","summary":"","techTags":[],"keyOutcomes":[]}],"projects":[{"id":"","year":"","role":"","company":"","name":"","location":"","summary":"","techTags":[],"keyOutcomes":[]}],"skills":[{"category":"","description":"","items":[]}],"contact":{"email":"","phone":"","websiteLinks":[{"label":"","url":""}],"github":""}}',
    "",
    `Source URL: ${options.sourceUrl}`,
    "Website content:",
    options.aggregatedText.slice(0, 18000),
  ].join("\n");

  const responseText = await requestRemoteResumeAiText(
    options.settings,
    [
      {
        role: "system",
        content:
          "You extract structured resume data from portfolio websites. Use only facts from the provided pages. Output JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    0.2,
    options.apiKey,
  );

  const payload = extractJsonObject(responseText);
  return mergePortfolioData(options.fallback, payload);
}
