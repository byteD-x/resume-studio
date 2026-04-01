import { assertSafeAiBaseUrl } from "@/lib/network-safety";
import type { ResumeAiSettings } from "@/types/resume";

export function normalizeResumeAiBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function isLikelyLocalOllamaBaseUrl(value: string) {
  const normalized = normalizeResumeAiBaseUrl(value).toLowerCase();

  return normalized === "http://127.0.0.1:11434/v1" || normalized === "http://localhost:11434/v1";
}

function resolveApiKey(settings: ResumeAiSettings, override?: string) {
  assertSafeAiBaseUrl(settings.baseUrl);

  if (override?.trim()) {
    return override.trim();
  }

  return (
    process.env.RESUME_STUDIO_AI_API_KEY?.trim() ||
    process.env.OPENAI_COMPATIBLE_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    ""
  );
}

export function buildAuthHeaders(settings: ResumeAiSettings, apiKeyOverride?: string) {
  const apiKey = resolveApiKey(settings, apiKeyOverride);
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export function canUseRemoteResumeAi(settings: ResumeAiSettings) {
  if (
    settings.provider !== "openai-compatible" ||
    settings.model.trim().length === 0 ||
    normalizeResumeAiBaseUrl(settings.baseUrl).length === 0
  ) {
    return false;
  }

  try {
    assertSafeAiBaseUrl(settings.baseUrl);
    return true;
  } catch {
    return false;
  }
}

export function getRemoteResumeAiConfigError(settings: ResumeAiSettings) {
  if (settings.provider !== "openai-compatible") {
    return "Switch provider to OpenAI Compatible first.";
  }

  if (!settings.model.trim()) {
    return "Set an AI model before requesting remote AI suggestions.";
  }

  if (!normalizeResumeAiBaseUrl(settings.baseUrl)) {
    return "Set a Base URL before requesting remote AI suggestions.";
  }

  try {
    assertSafeAiBaseUrl(settings.baseUrl);
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid AI Base URL.";
  }

  return null;
}
