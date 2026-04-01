import type { ResumeAiSettings } from "@/types/resume";

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

export type ResumeAiMessage = {
  role: "system" | "user";
  content: string;
};
