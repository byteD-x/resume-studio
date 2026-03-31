import { stripHtml, textToHtml } from "@/lib/utils";
import { assertSafeAiBaseUrl } from "@/lib/network-safety";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeAiSettings, ResumeDocument, ResumeSectionItem, ResumeSectionType } from "@/types/resume";
import type { PortfolioData } from "@/lib/portfolio-import";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_FREE_BASE_URL = "http://127.0.0.1:11434/v1";

export const freeResumeAiPresets = [
  {
    id: "qwen3-4b",
    label: "Qwen3 4B",
    description: "免费、本地、响应更快，适合网站导入和日常编辑建议。",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:4b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    } satisfies ResumeAiSettings,
  },
  {
    id: "qwen3-8b",
    label: "Qwen3 8B",
    description: "免费、本地、效果更稳，适合摘要和经历润色。",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:8b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    } satisfies ResumeAiSettings,
  },
] as const;

export const DEFAULT_FREE_CLOUD_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_FREE_CLOUD_MODEL = "qwen/qwen3-32b";
export const DEFAULT_FALLBACK_FREE_CLOUD_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_FALLBACK_FREE_CLOUD_MODEL = "openrouter/free";

export const preferredResumeAiPresets = [
  {
    apiKeyUrl: "https://console.groq.com/keys",
    docsUrl: "https://console.groq.com/docs/openai",
    id: "groq-qwen3-32b",
    kind: "cloud-free",
    label: "Groq Qwen3 32B",
    description: "Cloud free default via Groq's OpenAI-compatible API.",
    providerName: "Groq",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FREE_CLOUD_BASE_URL,
    } satisfies ResumeAiSettings,
  },
  {
    apiKeyUrl: "https://openrouter.ai/settings/keys",
    docsUrl: "https://openrouter.ai/openrouter/free/api",
    id: "openrouter-free",
    kind: "cloud-free",
    label: "OpenRouter Free",
    description: "Cloud free router that selects from OpenRouter's currently free models.",
    providerName: "OpenRouter",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FALLBACK_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FALLBACK_FREE_CLOUD_BASE_URL,
    } satisfies ResumeAiSettings,
  },
  {
    docsUrl: "https://ollama.com/download",
    id: "ollama-qwen3-4b",
    kind: "local-free",
    label: "Ollama Qwen3 4B",
    description: "Local free fallback for self-hosted development.",
    providerName: "Ollama",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:4b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    } satisfies ResumeAiSettings,
  },
] as const;

export interface ResumeAiHealthCheck {
  availableModels: string[];
  baseUrl: string;
  isLocalOllama: boolean;
  message: string;
  model: string;
  modelFound: boolean;
}

export type ResumeAiPresetKind = "cloud-free" | "cloud-credit" | "local-free";

export interface ResumeAiPresetOption {
  apiKeyUrl?: string;
  docsUrl?: string;
  freeLabel: string;
  id: string;
  kind: ResumeAiPresetKind;
  label: string;
  providerName: string;
  settings: ResumeAiSettings;
}

export const enhancedResumeAiPresets: readonly ResumeAiPresetOption[] = [
  {
    apiKeyUrl: "https://console.groq.com/keys",
    docsUrl: "https://console.groq.com/docs/openai",
    freeLabel: "永久免费",
    id: "groq-qwen3-32b",
    kind: "cloud-free",
    label: "Groq Qwen3 32B",
    providerName: "Groq",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FREE_CLOUD_BASE_URL,
    },
  },
  {
    apiKeyUrl: "https://openrouter.ai/settings/keys",
    docsUrl: "https://openrouter.ai/docs/guides/routing/routers/free-models-router",
    freeLabel: "免费路由",
    id: "openrouter-free",
    kind: "cloud-free",
    label: "OpenRouter Free",
    providerName: "OpenRouter",
    settings: {
      provider: "openai-compatible",
      model: DEFAULT_FALLBACK_FREE_CLOUD_MODEL,
      baseUrl: DEFAULT_FALLBACK_FREE_CLOUD_BASE_URL,
    },
  },
  {
    apiKeyUrl: "https://cloud.siliconflow.cn/account/ak",
    docsUrl: "https://docs.siliconflow.cn/en/api-reference/chat-completions/chat-completions",
    freeLabel: "免费模型",
    id: "siliconflow-qwen3-8b",
    kind: "cloud-free",
    label: "SiliconFlow Qwen3 8B",
    providerName: "SiliconFlow",
    settings: {
      provider: "openai-compatible",
      model: "Qwen/Qwen3-8B",
      baseUrl: "https://api.siliconflow.cn/v1",
    },
  },
  {
    apiKeyUrl: "https://cloud.cerebras.ai",
    docsUrl: "https://inference-docs.cerebras.ai/resources/openai",
    freeLabel: "永久免费",
    id: "cerebras-gpt-oss-120b",
    kind: "cloud-free",
    label: "Cerebras GPT-OSS 120B",
    providerName: "Cerebras",
    settings: {
      provider: "openai-compatible",
      model: "gpt-oss-120b",
      baseUrl: "https://api.cerebras.ai/v1",
    },
  },
  {
    apiKeyUrl: "https://cloud.sambanova.ai",
    docsUrl: "https://docs.sambanova.ai/docs/en/get-started/quickstart",
    freeLabel: "赠送额度",
    id: "sambanova-llama-3-3-70b",
    kind: "cloud-credit",
    label: "SambaNova Llama 3.3 70B",
    providerName: "SambaNova",
    settings: {
      provider: "openai-compatible",
      model: "Meta-Llama-3.3-70B-Instruct",
      baseUrl: "https://api.sambanova.ai/v1",
    },
  },
  {
    apiKeyUrl: "https://www.alibabacloud.com/help/en/model-studio/get-api-key",
    docsUrl: "https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen",
    freeLabel: "新人额度",
    id: "alibaba-qwq-plus",
    kind: "cloud-credit",
    label: "Model Studio QwQ Plus",
    providerName: "Alibaba Cloud",
    settings: {
      provider: "openai-compatible",
      model: "qwq-plus",
      baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    },
  },
  {
    docsUrl: "https://ollama.com/download",
    freeLabel: "本地免费",
    id: "ollama-qwen3-4b",
    kind: "local-free",
    label: "Ollama Qwen3 4B",
    providerName: "Ollama",
    settings: {
      provider: "openai-compatible",
      model: "qwen3:4b",
      baseUrl: DEFAULT_FREE_BASE_URL,
    },
  },
];

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

function buildAuthHeaders(settings: ResumeAiSettings, apiKeyOverride?: string) {
  const apiKey = resolveApiKey(settings, apiKeyOverride);
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

function cleanSummaryText(value: string) {
  return value
    .replace(/^摘要[:：]\s*/u, "")
    .replace(/^[\-\u2022]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectEvidenceLines(document: ResumeDocument) {
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

function buildSummaryMessages(document: ResumeDocument) {
  const evidenceLines = collectEvidenceLines(document);
  const currentSummary = stripHtml(document.basics.summaryHtml);
  const focusKeywords = document.targeting.focusKeywords.join(", ");
  const jdExcerpt = document.targeting.jobDescription.trim().slice(0, 1200);

  return [
    {
      role: "system",
      content:
        "你是简历写作助手。只基于用户提供的事实整理成中文简历摘要，不要编造经历、指标、公司背景或技术栈。",
    },
    {
      role: "user",
      content: [
        "请输出 2 到 3 句中文简历摘要。",
        "要求：",
        "1. 只保留与目标岗位最相关的信息。",
        "2. 不要使用项目符号、标题、引号或解释。",
        "3. 如果缺少量化结果，不要编造数字。",
        "4. 语气专业、克制，适合直接放进简历摘要。",
        "",
        `目标岗位：${document.targeting.role || "未填写"}`,
        `目标公司：${document.targeting.company || "未填写"}`,
        `关键词：${focusKeywords || "未填写"}`,
        `JD：${jdExcerpt || "未填写"}`,
        `当前标题：${document.basics.headline || "未填写"}`,
        `当前摘要：${currentSummary || "未填写"}`,
        "经历证据：",
        ...(evidenceLines.length > 0 ? evidenceLines.map((line) => `- ${line}`) : ["- 未提供更多经历证据"]),
      ].join("\n"),
    },
  ];
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

export async function generateRemoteResumeSummary(document: ResumeDocument, apiKeyOverride?: string) {
  const configError = getRemoteResumeAiConfigError(document.ai);
  if (configError) {
    throw new Error(configError);
  }

  const response = await fetch(`${normalizeResumeAiBaseUrl(document.ai.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(document.ai, apiKeyOverride),
    },
    body: JSON.stringify({
      model: document.ai.model.trim(),
      temperature: 0.3,
      messages: buildSummaryMessages(document),
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

  const text = cleanSummaryText(extractMessageText(payload?.choices?.[0]?.message?.content));
  if (!text) {
    throw new Error("Remote AI returned an empty summary.");
  }

  return text;
}

export function applySummaryText(document: ResumeDocument, summary: string): ResumeDocument {
  return {
    ...document,
    basics: {
      ...document.basics,
      summaryHtml: textToHtml(summary),
    },
  };
}

function cleanBulletLines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/^[\-\u2022\d.\s]+/, "").trim())
    .filter(Boolean);
}

function cleanTagLines(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,，、;；]+/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

function extractJsonObject(value: string) {
  const fencedMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? value;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function requestRemoteResumeAiText(
  settings: ResumeAiSettings,
  messages: Array<{ role: "system" | "user"; content: string }>,
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

function buildRemoteSummaryAssistMessages(document: ResumeDocument) {
  const evidenceLines = collectEvidenceLines(document);
  const currentSummary = stripHtml(document.basics.summaryHtml);

  return [
    {
      role: "system" as const,
      content:
        "You are a resume writing assistant. Use only provided facts. Return JSON only. Write all user-facing text in Simplified Chinese.",
    },
    {
      role: "user" as const,
      content: [
        "Return JSON with this shape:",
        '{"variants":[{"label":"string","detail":"string","text":"string"}]}',
        "Need 1 or 2 summary variants for a Chinese resume.",
        "Rules:",
        "1. Do not invent metrics or experience.",
        "2. Keep each variant to 2-3 sentences.",
        "3. Focus on the target role and JD when available.",
        "",
        `Target role: ${document.targeting.role || "N/A"}`,
        `Target company: ${document.targeting.company || "N/A"}`,
        `Keywords: ${document.targeting.focusKeywords.join(", ") || "N/A"}`,
        `JD: ${document.targeting.jobDescription.trim().slice(0, 1200) || "N/A"}`,
        `Headline: ${document.basics.headline || "N/A"}`,
        `Current summary: ${currentSummary || "N/A"}`,
        "Evidence:",
        ...(evidenceLines.length > 0 ? evidenceLines.map((line) => `- ${line}`) : ["- N/A"]),
      ].join("\n"),
    },
  ];
}

export async function generateRemoteSummarySuggestions(
  document: ResumeDocument,
  apiKeyOverride?: string,
): Promise<ResumeAssistSuggestion[]> {
  const text = await requestRemoteResumeAiText(document.ai, buildRemoteSummaryAssistMessages(document), 0.35, apiKeyOverride);
  const payload = extractJsonObject(text);
  const variants = Array.isArray(payload?.variants) ? payload.variants : [];

  const suggestions = variants
    .map((variant, index) => {
      if (!variant || typeof variant !== "object") return null;
      const label = typeof variant.label === "string" ? variant.label.trim() : "";
      const detail = typeof variant.detail === "string" ? variant.detail.trim() : "";
      const value = typeof variant.text === "string" ? cleanSummaryText(variant.text) : "";
      if (!value) return null;

      return {
        id: `remote-summary-${index + 1}`,
        label: label || `远程摘要建议 ${index + 1}`,
        detail: detail || "基于当前简历内容和岗位信息生成。",
        previewLines: value.split(/\n+/).filter(Boolean).slice(0, 3),
        applyLabel: "应用远程摘要",
        target: "summary",
        nextValue: value,
      } satisfies ResumeAssistSuggestion;
    })
    .filter(Boolean) as ResumeAssistSuggestion[];

  if (suggestions.length > 0) {
    return suggestions.slice(0, 2);
  }

  const fallback = cleanSummaryText(text);
  return [
    {
      id: "remote-summary-fallback",
      label: "远程摘要建议",
      detail: "基于当前简历内容和岗位信息生成。",
      previewLines: fallback.split(/\n+/).filter(Boolean).slice(0, 3),
      applyLabel: "应用远程摘要",
      target: "summary",
      nextValue: fallback,
    },
  ];
}

function buildRemoteItemAssistMessages(
  document: ResumeDocument,
  sectionType: ResumeSectionType,
  item: ResumeSectionItem,
) {
  return [
    {
      role: "system" as const,
      content:
        "You are a resume writing assistant. Use only provided facts. Return JSON only. Write all user-facing text in Simplified Chinese.",
    },
    {
      role: "user" as const,
      content: [
        `Section type: ${sectionType}`,
        `Target role: ${document.targeting.role || "N/A"}`,
        `Keywords: ${document.targeting.focusKeywords.join(", ") || "N/A"}`,
        `JD: ${document.targeting.jobDescription.trim().slice(0, 1000) || "N/A"}`,
        `Item title: ${item.title || "N/A"}`,
        `Item subtitle: ${item.subtitle || "N/A"}`,
        `Item meta: ${item.meta || "N/A"}`,
        `Item summary: ${stripHtml(item.summaryHtml) || "N/A"}`,
        `Item bullets: ${item.bulletPoints.join(" | ") || "N/A"}`,
        `Item tags: ${item.tags.join(", ") || "N/A"}`,
        "",
        sectionType === "skills"
          ? [
              "Return JSON with this shape:",
              '{"detail":"string","tags":["string"]}',
              "Need a cleaned list of resume-ready skills. Keep only relevant skill keywords.",
            ].join("\n")
          : [
              "Return JSON with this shape:",
              '{"detail":"string","summary":"string","bullets":["string"]}',
              "Need resume-ready Chinese phrasing.",
              "Rules:",
              "1. Do not invent metrics.",
              "2. Summary is optional and should be 1-2 sentences.",
              "3. Bullets should be 2-4 lines, concise and resume-ready.",
            ].join("\n"),
      ].join("\n"),
    },
  ];
}

export async function generateRemoteItemSuggestions(
  document: ResumeDocument,
  sectionType: ResumeSectionType,
  item: ResumeSectionItem,
  apiKeyOverride?: string,
): Promise<ResumeAssistSuggestion[]> {
  const text = await requestRemoteResumeAiText(
    document.ai,
    buildRemoteItemAssistMessages(document, sectionType, item),
    0.35,
    apiKeyOverride,
  );
  const payload = extractJsonObject(text);

  if (sectionType === "skills") {
    const tags = Array.isArray(payload?.tags)
      ? Array.from(new Set(payload.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)))
      : cleanTagLines(text);

    if (tags.length === 0) {
      throw new Error("Remote AI did not return usable skill tags.");
    }

    return [
      {
        id: "remote-tags",
        label: "远程技能整理",
        detail:
          typeof payload?.detail === "string" && payload.detail.trim()
            ? payload.detail.trim()
            : "基于当前技能和岗位信息整理出更适合简历展示的技能标签。",
        previewLines: tags.slice(0, 8),
        applyLabel: "应用技能整理",
        target: "tags",
        nextValue: tags,
      },
    ];
  }

  const summary = typeof payload?.summary === "string" ? cleanSummaryText(payload.summary) : "";
  const bullets = Array.isArray(payload?.bullets)
    ? payload.bullets
        .filter((line): line is string => typeof line === "string")
        .map((line) => line.trim())
        .filter(Boolean)
    : cleanBulletLines(text);
  const detail =
    typeof payload?.detail === "string" && payload.detail.trim()
      ? payload.detail.trim()
      : "基于当前经历和岗位信息生成。";

  const suggestions: ResumeAssistSuggestion[] = [];

  if (summary) {
    suggestions.push({
      id: "remote-item-summary",
      label: "远程经历说明",
      detail,
      previewLines: summary.split(/\n+/).filter(Boolean).slice(0, 3),
      applyLabel: "应用经历说明",
      target: "summary",
      nextValue: summary,
    });
  }

  if (bullets.length > 0) {
    suggestions.push({
      id: "remote-item-bullets",
      label: "远程经历要点",
      detail,
      previewLines: bullets.slice(0, 4),
      applyLabel: "应用经历要点",
      target: "bullets",
      nextValue: bullets,
    });
  }

  if (suggestions.length === 0) {
    throw new Error("Remote AI did not return usable resume suggestions.");
  }

  return suggestions.slice(0, 2);
}

function ensureString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function ensureStringArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)))
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
