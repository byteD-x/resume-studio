export {
  DEFAULT_FALLBACK_FREE_CLOUD_BASE_URL,
  DEFAULT_FALLBACK_FREE_CLOUD_MODEL,
  DEFAULT_FREE_CLOUD_BASE_URL,
  DEFAULT_FREE_CLOUD_MODEL,
} from "@/lib/resume-ai/constants";
export {
  canUseRemoteResumeAi,
  getRemoteResumeAiConfigError,
  isLikelyLocalOllamaBaseUrl,
  normalizeResumeAiBaseUrl,
} from "@/lib/resume-ai/config";
export {
  enhancedResumeAiPresets,
  freeResumeAiPresets,
  preferredResumeAiPresets,
} from "@/lib/resume-ai/presets";
export { generateWebsiteImportPortfolio } from "@/lib/resume-ai/portfolio";
export { checkRemoteResumeAiConnection } from "@/lib/resume-ai/remote-client";
export { applySummaryText, generateRemoteResumeSummary } from "@/lib/resume-ai/remote-summary";
export {
  generateRemoteItemSuggestions,
  generateRemoteSummarySuggestions,
} from "@/lib/resume-ai/remote-assist";
export type {
  ResumeAiHealthCheck,
  ResumeAiPresetKind,
  ResumeAiPresetOption,
} from "@/lib/resume-ai/types";
