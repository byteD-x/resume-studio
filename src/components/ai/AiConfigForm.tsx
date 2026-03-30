"use client";

import { ChevronDown, LoaderCircle, PlugZap } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { handleSanitizedPaste } from "@/lib/editor-input";
import {
  enhancedResumeAiPresets,
  isLikelyLocalOllamaBaseUrl,
  type ResumeAiHealthCheck,
  type ResumeAiPresetKind,
} from "@/lib/resume-ai";
import type { ResumeAiProvider } from "@/types/resume";

type HealthState =
  | { tone: "success" | "warning"; result: ResumeAiHealthCheck }
  | { tone: "warning"; message: string };

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function resolveSelectedPresetId(provider: ResumeAiProvider, model: string, baseUrl: string) {
  if (provider !== "openai-compatible") {
    return "custom";
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedModel = model.trim();
  const matchedPreset = enhancedResumeAiPresets.find(
    (preset) =>
      normalizeBaseUrl(preset.settings.baseUrl) === normalizedBaseUrl && preset.settings.model === normalizedModel,
  );

  return matchedPreset?.id ?? "custom";
}

function getKindTone(kind: ResumeAiPresetKind) {
  if (kind === "cloud-credit") {
    return "warning";
  }

  return kind === "local-free" ? "neutral" : "accent";
}

export function AiConfigForm({
  apiKey,
  baseUrl,
  description,
  disabled = false,
  model,
  onApiKeyChange,
  onApplyPreset,
  onBaseUrlChange,
  onModelChange,
  onProviderChange,
  provider,
  showProvider = true,
  title,
}: {
  apiKey: string;
  baseUrl: string;
  description: string;
  disabled?: boolean;
  model: string;
  onApiKeyChange: (value: string) => void;
  onApplyPreset: (presetId: string) => void;
  onBaseUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onProviderChange?: (value: ResumeAiProvider) => void;
  provider: ResumeAiProvider;
  showProvider?: boolean;
  title: string;
}) {
  const [healthState, setHealthState] = useState<HealthState | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const usesRemoteProvider = provider === "openai-compatible";
  const usesLocalOllama = usesRemoteProvider && isLikelyLocalOllamaBaseUrl(baseUrl);
  const selectedPresetId = resolveSelectedPresetId(provider, model, baseUrl);
  const selectedPreset =
    selectedPresetId === "custom" ? null : enhancedResumeAiPresets.find((preset) => preset.id === selectedPresetId) ?? null;

  useEffect(() => {
    setHealthState(null);
  }, [apiKey, baseUrl, model, provider]);

  async function handleCheckConnection() {
    if (!usesRemoteProvider) {
      return;
    }

    setIsChecking(true);
    setHealthState(null);

    try {
      const response = await fetch("/api/ai/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            provider,
            model,
            baseUrl,
          },
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || `Request failed: ${response.status}`);
      }

      const result = (await response.json()) as ResumeAiHealthCheck;
      setHealthState({
        tone: result.modelFound ? "success" : "warning",
        result,
      });
    } catch (error) {
      setHealthState({
        tone: "warning",
        message: error instanceof Error ? error.message : "连接失败",
      });
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="resume-editor-group-head">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>

      {showProvider ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className={`rounded-[1rem] border px-4 py-3 text-left transition ${
              provider === "local"
                ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]"
                : "border-[color:var(--line)] bg-white/80"
            }`}
            disabled={disabled}
            onClick={() => onProviderChange?.("local")}
            type="button"
          >
            <strong className="block text-sm text-[color:var(--ink-strong)]">本地规则</strong>
          </button>
          <button
            className={`rounded-[1rem] border px-4 py-3 text-left transition ${
              provider === "openai-compatible"
                ? "border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]"
                : "border-[color:var(--line)] bg-white/80"
            }`}
            disabled={disabled}
            onClick={() => onProviderChange?.("openai-compatible")}
            type="button"
          >
            <strong className="block text-sm text-[color:var(--ink-strong)]">AI 模型</strong>
          </button>
        </div>
      ) : null}

      {usesRemoteProvider ? (
        <>
          <div className="space-y-3 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[color:var(--ink-strong)]">选择方案</p>
              {selectedPreset ? (
                <Badge tone={getKindTone(selectedPreset.kind)}>{selectedPreset.freeLabel}</Badge>
              ) : (
                <Badge tone="neutral">自定义</Badge>
              )}
            </div>

            <div className="grid gap-2">
              {enhancedResumeAiPresets.map((preset) => {
                const active = selectedPresetId === preset.id;

                return (
                  <button
                    className={`rounded-[0.9rem] border px-4 py-3 text-left transition ${
                      active
                        ? "border-[color:var(--accent-strong)] bg-white shadow-sm"
                        : "border-[color:var(--line)] bg-white/70 hover:bg-white"
                    }`}
                    disabled={disabled}
                    key={preset.id}
                    onClick={() => onApplyPreset(preset.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="block text-sm text-[color:var(--ink-strong)]">{preset.label}</strong>
                        <span className="mt-1 block text-xs text-[color:var(--ink-muted)]">{preset.providerName}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={getKindTone(preset.kind)}>{preset.freeLabel}</Badge>
                        {active ? <Badge tone="accent">已选</Badge> : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[color:var(--ink-strong)]">API Key</p>
              <div className="flex flex-wrap gap-2">
                {selectedPreset?.apiKeyUrl ? (
                  <a className="btn btn-secondary" href={selectedPreset.apiKeyUrl} rel="noreferrer" target="_blank">
                    获取 Key
                  </a>
                ) : null}
                {selectedPreset?.docsUrl ? (
                  <a className="btn btn-ghost" href={selectedPreset.docsUrl} rel="noreferrer" target="_blank">
                    文档
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="field-shell flex-1">
                <span className="field-label">Key</span>
                <input
                  className="input-control"
                  disabled={disabled}
                  onChange={(event) => onApiKeyChange(event.target.value)}
                  onPaste={(event) =>
                    handleSanitizedPaste(event, {
                      currentValue: apiKey,
                      mode: "single-line",
                      onValueChange: onApiKeyChange,
                    })
                  }
                  placeholder={usesLocalOllama ? "可留空" : "输入 API Key"}
                  type="password"
                  value={apiKey}
                />
              </label>

              <div className="sm:self-end">
                <Button
                  disabled={disabled || isChecking}
                  onClick={() => void handleCheckConnection()}
                  type="button"
                  variant="secondary"
                >
                  {isChecking ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
                  测试
                </Button>
              </div>
            </div>

            {healthState ? (
              <div className="space-y-2 rounded-[0.9rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] p-4">
                <Badge tone={healthState.tone}>
                  {"result" in healthState
                    ? healthState.result.modelFound
                      ? "已连接"
                      : "模型不可用"
                    : "连接失败"}
                </Badge>
                <p className="text-sm text-[color:var(--ink-soft)]">
                  {"result" in healthState ? healthState.result.message : healthState.message}
                </p>
              </div>
            ) : null}
          </div>

          <details className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[color:var(--ink-strong)]">
              <span>高级设置</span>
              <ChevronDown className="size-4" />
            </summary>

            <div className="mt-4 grid gap-3">
              <label className="field-shell">
                <span className="field-label">Model</span>
                <input
                  className="input-control"
                  disabled={disabled}
                  onChange={(event) => onModelChange(event.target.value)}
                  onPaste={(event) =>
                    handleSanitizedPaste(event, {
                      currentValue: model,
                      mode: "single-line",
                      onValueChange: onModelChange,
                    })
                  }
                  placeholder="例如：qwen/qwen3-32b"
                  value={model}
                />
              </label>

              <label className="field-shell">
                <span className="field-label">Base URL</span>
                <input
                  className="input-control"
                  disabled={disabled}
                  inputMode="url"
                  onChange={(event) => onBaseUrlChange(event.target.value)}
                  onPaste={(event) =>
                    handleSanitizedPaste(event, {
                      currentValue: baseUrl,
                      mode: "single-line",
                      onValueChange: onBaseUrlChange,
                    })
                  }
                  placeholder="例如：https://api.groq.com/openai/v1"
                  value={baseUrl}
                />
              </label>
            </div>
          </details>
        </>
      ) : (
        <div className="rounded-[1rem] border border-dashed border-[color:var(--line)] bg-[color:var(--paper-soft)] p-4 text-sm text-[color:var(--ink-soft)]">
          当前无需配置。
        </div>
      )}
    </div>
  );
}
