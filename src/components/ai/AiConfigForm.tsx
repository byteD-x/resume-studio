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
    <div className="ai-config-stack">
      <div className="resume-editor-group-head">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>

      {showProvider ? (
        <div className="ai-config-provider-grid">
          <button
            className={`ai-config-provider-card ${
              provider === "local"
                ? "ai-config-provider-card-active"
                : "ai-config-provider-card-idle"
            }`}
            disabled={disabled}
            onClick={() => onProviderChange?.("local")}
            type="button"
          >
            <strong>本地规则</strong>
          </button>
          <button
            className={`ai-config-provider-card ${
              provider === "openai-compatible"
                ? "ai-config-provider-card-active"
                : "ai-config-provider-card-idle"
            }`}
            disabled={disabled}
            onClick={() => onProviderChange?.("openai-compatible")}
            type="button"
          >
            <strong>AI 模型</strong>
          </button>
        </div>
      ) : null}

      {usesRemoteProvider ? (
        <>
          <div className="ai-config-surface ai-config-surface-soft">
            <div className="ai-config-head">
              <p className="ai-config-heading">选择方案</p>
              {selectedPreset ? (
                <Badge tone={getKindTone(selectedPreset.kind)}>{selectedPreset.freeLabel}</Badge>
              ) : (
                <Badge tone="neutral">自定义</Badge>
              )}
            </div>

            <div className="ai-config-preset-list">
              {enhancedResumeAiPresets.map((preset) => {
                const active = selectedPresetId === preset.id;

                return (
                  <button
                    className={`ai-config-preset-card ${
                      active
                        ? "ai-config-preset-card-active"
                        : "ai-config-preset-card-idle"
                    }`}
                    disabled={disabled}
                    key={preset.id}
                    onClick={() => onApplyPreset(preset.id)}
                    type="button"
                  >
                    <div className="ai-config-preset-head">
                      <div className="ai-config-preset-copy">
                        <strong>{preset.label}</strong>
                        <span>{preset.providerName}</span>
                      </div>
                      <div className="ai-config-preset-meta">
                        <Badge tone={getKindTone(preset.kind)}>{preset.freeLabel}</Badge>
                        {active ? <Badge tone="accent">已选</Badge> : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ai-config-surface">
            <div className="ai-config-head ai-config-head-wrap">
              <p className="ai-config-heading">API Key</p>
              <div className="ai-config-inline-actions">
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

            <div className="ai-config-connection-row">
              <label className="field-shell ai-config-field-grow">
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

              <div className="ai-config-action-slot">
                <Button
                  disabled={disabled || isChecking}
                  onClick={() => void handleCheckConnection()}
                  type="button"
                  variant="secondary"
                >
                  {isChecking ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
                  检查连接
                </Button>
              </div>
            </div>

            {healthState ? (
              <div className="ai-config-health">
                <Badge tone={healthState.tone}>
                  {"result" in healthState
                    ? healthState.result.modelFound
                      ? "已连接"
                      : "模型不可用"
                    : "连接失败"}
                </Badge>
                <p className="ai-config-health-copy">
                  {"result" in healthState ? healthState.result.message : healthState.message}
                </p>
              </div>
            ) : null}
          </div>

          <details className="ai-config-advanced">
            <summary className="ai-config-advanced-summary">
              <span>高级设置</span>
              <ChevronDown className="size-4" />
            </summary>

            <div className="ai-config-advanced-fields">
              <label className="field-shell">
                <span className="field-label">模型名称</span>
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
                <span className="field-label">接口地址</span>
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
        <div className="ai-config-empty">
          当前无需配置。
        </div>
      )}
    </div>
  );
}
