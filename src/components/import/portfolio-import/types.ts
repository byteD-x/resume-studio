export type ImportSource = "url" | "markdown" | "text" | "pdf";

export type ImportAiMode = "rules" | "ai";

export type ImportedSection = {
  type: string;
  items?: unknown[];
};

export type ImportedDocumentSummary = {
  meta: { id: string };
  basics: { name: string };
  sections: ImportedSection[];
  importTrace?: {
    fieldSuggestions?: Array<{ id: string }>;
  };
};

export type ImportedUrlSummary = {
  baseUrl: string;
  mode: "single-page" | "multi-page";
  pageCount: number;
  selectedCandidateCount: number;
  discoveredCandidateCount: number;
  visitedUrls: string[];
  skippedUrls: string[];
  extractionMode?: "rules" | "ai" | "ai-fallback";
  modelLabel?: string;
};

export type PortfolioImportResult = {
  resumeId: string;
  summary: {
    projects: number;
    experience: number;
    name: string;
    fieldSuggestionCount: number;
  };
  isPdf?: boolean;
  urlSummary?: ImportedUrlSummary | null;
};
