import type { ResumeImportSnapshot } from "@/types/resume";

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

export interface UrlImportMessages {
  pendingReview: string[];
  unmapped: string[];
  sourceRefs: string[];
}

export interface UrlImportRawPortfolio {
  portfolio: Readonly<PortfolioData>;
  urlSummary: UrlImportSummary | null;
}

export interface UrlImportResult {
  document: import("@/types/resume").ResumeDocument;
  rawPortfolio: UrlImportRawPortfolio;
  summary: string;
  sourcePath: string;
  urlSummary: UrlImportSummary | null;
}

export type UrlImportSnapshots = ResumeImportSnapshot[];
