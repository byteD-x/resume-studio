"use client";

import { DEFAULT_FREE_CLOUD_BASE_URL, DEFAULT_FREE_CLOUD_MODEL } from "@/lib/resume-ai";
import type { ResumeAiSettings } from "@/types/resume";

export interface ClientAiConfig extends ResumeAiSettings {
  apiKey: string;
}

export const CLIENT_AI_CONFIG_STORAGE_KEY = "resume-studio-ai-config";

export function getDefaultClientAiConfig(): ClientAiConfig {
  return {
    provider: "openai-compatible",
    model: DEFAULT_FREE_CLOUD_MODEL,
    baseUrl: DEFAULT_FREE_CLOUD_BASE_URL,
    apiKey: "",
  };
}

export function readClientAiConfig(): ClientAiConfig {
  if (typeof window === "undefined") {
    return getDefaultClientAiConfig();
  }

  try {
    const raw = window.localStorage.getItem(CLIENT_AI_CONFIG_STORAGE_KEY);
    if (!raw) return getDefaultClientAiConfig();
    const parsed = JSON.parse(raw) as Partial<ClientAiConfig>;
    const looksLikeLegacyLocalDefault =
      parsed.provider !== "local" &&
      parsed.model === "qwen3:4b" &&
      (parsed.baseUrl === "http://127.0.0.1:11434/v1" || parsed.baseUrl === "http://localhost:11434/v1") &&
      (!parsed.apiKey || parsed.apiKey === "");

    if (looksLikeLegacyLocalDefault) {
      const migrated = getDefaultClientAiConfig();
      writeClientAiConfig(migrated);
      return migrated;
    }

    return {
      provider: parsed.provider === "local" ? "local" : "openai-compatible",
      model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model : DEFAULT_FREE_CLOUD_MODEL,
      baseUrl:
        typeof parsed.baseUrl === "string" && parsed.baseUrl.trim()
          ? parsed.baseUrl
          : DEFAULT_FREE_CLOUD_BASE_URL,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
    };
  } catch {
    return getDefaultClientAiConfig();
  }
}

export function writeClientAiConfig(config: ClientAiConfig) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CLIENT_AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
}
