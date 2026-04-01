import { stripHtml } from "@/lib/utils";
import type { ResumeAiSettings, ResumeDocument } from "@/types/resume";
import { DEFAULT_TIMEOUT_MS } from "@/lib/resume-ai/constants";
import { buildAuthHeaders, getRemoteResumeAiConfigError, isLikelyLocalOllamaBaseUrl, normalizeResumeAiBaseUrl } from "@/lib/resume-ai/config";
import { extractMessageText } from "@/lib/resume-ai/parsing";
import type { ResumeAiHealthCheck, ResumeAiMessage } from "@/lib/resume-ai/types";

function matchesRequestedModel(modelId: string, requestedModel: string) {
  if (modelId === requestedModel) return true;

  const normalizedModelId = modelId.toLowerCase();
  const normalizedRequested = requestedModel.toLowerCase();
  return (
    normalizedModelId === normalizedRequested ||
    normalizedModelId.startsWith(`${normalizedRequested}:`) ||
    normalizedRequested.startsWith(`${normalizedModelId}:`)
  );
}

export function collectEvidenceLines(document: ResumeDocument) {
  return document.sections
    .flatMap((section) =>
      section.items.flatMap((item) => {
        const context = [item.title, item.subtitle].filter(Boolean).join(" / ");
        const bullets = item.bulletPoints
          .map((bullet) => bullet.trim())
          .filter(Boolean)
          .slice(0, 2)
          .map((bullet) => (context ? `${context}: ${bullet}` : bullet));

        const summary = stripHtml(item.summaryHtml);
        if (summary) {
          bullets.unshift(context ? `${context}: ${summary}` : summary);
        }

        return bullets;
      }),
    )
    .filter(Boolean)
    .slice(0, 8);
}

export async function checkRemoteResumeAiConnection(
  settings: ResumeAiSettings,
  apiKeyOverride?: string,
): Promise<ResumeAiHealthCheck> {
  const configError = getRemoteResumeAiConfigError(settings);
  if (configError) {
    throw new Error(configError);
  }

  const response = await fetch(`${normalizeResumeAiBaseUrl(settings.baseUrl)}/models`, {
    method: "GET",
    headers: buildAuthHeaders(settings, apiKeyOverride),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: Array<{ id?: string }>;
        error?: { message?: string };
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Remote AI request failed: ${response.status}`);
  }

  const availableModels = Array.from(
    new Set(
      (payload?.data ?? [])
        .map((item) => (typeof item?.id === "string" ? item.id.trim() : ""))
        .filter(Boolean),
    ),
  );
  const model = settings.model.trim();
  const modelFound = availableModels.some((item) => matchesRequestedModel(item, model));
  const isLocalOllama = isLikelyLocalOllamaBaseUrl(settings.baseUrl);

  return {
    availableModels: availableModels.slice(0, 12),
    baseUrl: normalizeResumeAiBaseUrl(settings.baseUrl),
    isLocalOllama,
    message: modelFound
      ? `Connected to ${isLocalOllama ? "local Ollama" : "the configured AI service"} and found ${model}.`
      : isLocalOllama
        ? `Connected to local Ollama, but ${model} is not installed yet.`
        : `Connected to the configured AI service, but ${model} was not listed.`,
    model,
    modelFound,
  };
}

export async function requestRemoteResumeAiText(
  settings: ResumeAiSettings,
  messages: ResumeAiMessage[],
  temperature = 0.3,
  apiKeyOverride?: string,
) {
  const configError = getRemoteResumeAiConfigError(settings);
  if (configError) {
    throw new Error(configError);
  }

  const response = await fetch(`${normalizeResumeAiBaseUrl(settings.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(settings, apiKeyOverride),
    },
    body: JSON.stringify({
      model: settings.model.trim(),
      temperature,
      messages,
    }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: unknown } }>;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Remote AI request failed: ${response.status}`);
  }

  const text = extractMessageText(payload?.choices?.[0]?.message?.content);
  if (!text) {
    throw new Error("Remote AI returned an empty response.");
  }

  return text;
}
