import { createEmptyResumeDocument, validateResumeDocument } from "@/lib/resume-document";
import { canUseRemoteResumeAi, generateWebsiteImportPortfolio } from "@/lib/resume-ai";
import type { ResumeAiSettings, ResumeDocument, ResumeImportSnapshot } from "@/types/resume";
import { defaultPortfolioPayload } from "./constants";
import { crawlPortfolioSite } from "./crawl";
import { buildImportedResumeDocument, buildImportResponse, buildUrlSnapshots } from "./mapping";
import { parseTextPortfolio } from "./parse";
import type { PortfolioData, UrlImportOptions, UrlImportResult, UrlImportSummary } from "./types";

export async function importPortfolioToResume(options: {
  source?: "url" | "markdown" | "text";
  payload?: string;
  existingDocument?: ResumeDocument;
  resumeId?: string;
  urlOptions?: UrlImportOptions;
  aiSettings?: ResumeAiSettings;
  apiKey?: string;
}): Promise<UrlImportResult> {
  let portfolio: Readonly<PortfolioData>;
  let urlSummary: UrlImportSummary | null = null;
  let urlSnapshots: ResumeImportSnapshot[] = [];
  const source = options.source ?? "text";
  const payload = options.payload ?? defaultPortfolioPayload;

  if (source === "url") {
    const crawlResult = await crawlPortfolioSite(payload, options.urlOptions);
    const fallbackPortfolio = parseTextPortfolio(crawlResult.aggregatedText);
    const aiSettings = options.aiSettings;
    const canUseAi = aiSettings ? canUseRemoteResumeAi(aiSettings) : false;
    let nextUrlSummary: UrlImportSummary = {
      ...crawlResult.summary,
      extractionMode: "rules",
    };

    if (canUseAi && aiSettings) {
      try {
        portfolio = await generateWebsiteImportPortfolio({
          sourceUrl: payload,
          aggregatedText: crawlResult.aggregatedText,
          settings: aiSettings,
          fallback: fallbackPortfolio,
          apiKey: options.apiKey,
        });
        nextUrlSummary = {
          ...crawlResult.summary,
          extractionMode: "ai",
          modelLabel: aiSettings.model,
        };
      } catch {
        portfolio = fallbackPortfolio;
        nextUrlSummary = {
          ...crawlResult.summary,
          extractionMode: "ai-fallback",
          modelLabel: aiSettings.model,
        };
      }
    } else {
      portfolio = fallbackPortfolio;
    }

    urlSummary = nextUrlSummary;
    urlSnapshots = buildUrlSnapshots(crawlResult.pages);
  } else {
    portfolio = parseTextPortfolio(payload);
  }

  const baseDocument =
    options.existingDocument ?? createEmptyResumeDocument(options.resumeId ?? "default", "Imported Draft");
  const importedDocument = buildImportedResumeDocument({
    baseDocument,
    portfolio,
    source,
    payload,
    resumeId: options.resumeId,
    urlSummary,
    urlSnapshots,
    aiSettings: options.aiSettings,
  });
  const document = validateResumeDocument(importedDocument.documentInput);

  return buildImportResponse({
    document,
    portfolio,
    source,
    payload,
    urlSummary,
  });
}
