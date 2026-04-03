"use client";

import { CheckCircle2, ChevronDown, ExternalLink, LoaderCircle, PlugZap } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { handleSanitizedPaste } from "@/lib/editor-input";
import {
  enhancedResumeAiPresets,
  isLikelyLocalOllamaBaseUrl,
  type ResumeAiHealthCheck,
  type ResumeAiPresetKind,
  type ResumeAiPresetOption,
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

function getSelectionDescription(selectedPreset: ResumeAiPresetOption | null, usesLocalOllama: boolean) {
  if (selectedPreset?.description) {
    return selectedPreset.description;
  }

  if (usesLocalOllama) {
    return "当前是本地兼容接口，不需要云端 Key，可先检查模型是否已安装。";
  }

  return "当前使用自定义兼容 OpenAI 的接口配置，可在高级设置里继续覆盖模型和接口地址。";
}

function AiConfigDisclosure({
  badge,
  children,
  defaultOpen = false,
  title,
}: {
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
}) {
  return (
    <details className="ai-config-disclosure" {...(defaultOpen ? { open: true } : {})}>
      <summary className="ai-config-disclosure-summary">
        <span className="ai-config-disclosure-title">{title}</span>
        <span className="ai-config-disclosure-meta">
          {badge}
          <ChevronDown className="ai-config-disclosure-chevron size-4" />
        </span>
      </summary>

      <div className="ai-config-disclosure-body">{children}</div>
    </details>
  );
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
  const selectionDescription = getSelectionDescription(selectedPreset, usesLocalOllama);

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
        <AiConfigDisclosure title="接入方式">
          <div className="ai-config-provider-grid">
            <button
              className={`ai-config-provider-card ${
                provider === "local" ? "ai-config-provider-card-active" : "ai-config-provider-card-idle"
              }`}
              disabled={disabled}
              onClick={() => onProviderChange?.("local")}
              type="button"
            >
              <strong>本地规则</strong>
            </button>
            <button
              className={`ai-config-provider-card ${
                provider === "openai-compatible" ? "ai-config-provider-card-active" : "ai-config-provider-card-idle"
              }`}
              disabled={disabled}
              onClick={() => onProviderChange?.("openai-compatible")}
              type="button"
            >
              <strong>AI 模型</strong>
            </button>
          </div>
        </AiConfigDisclosure>
      ) : null}

      {usesRemoteProvider ? (
        <>
          <AiConfigDisclosure
            badge={
              selectedPreset ? (
                <Badge tone={getKindTone(selectedPreset.kind)}>{selectedPreset.freeLabel}</Badge>
              ) : (
                <Badge tone="neutral">自定义</Badge>
              )
            }
            title="选择方案"
          >
            <div className="ai-config-surface ai-config-surface-soft">
              <div className="ai-config-preset-list">
                {enhancedResumeAiPresets.map((preset) => {
                  const active = selectedPresetId === preset.id;

                  return (
                    <button
                      className={`ai-config-preset-card ${
                        active ? "ai-config-preset-card-active" : "ai-config-preset-card-idle"
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
                          {preset.description ? <p className="ai-config-preset-description">{preset.description}</p> : null}
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
          </AiConfigDisclosure>

          <AiConfigDisclosure
            badge={
              selectedPreset ? (
                <Badge tone="accent" className="ai-config-current-badge">
                  <CheckCircle2 className="size-3.5" />
                  已同步
                </Badge>
              ) : (
                <Badge tone="neutral">手动覆盖</Badge>
              )
            }
            title="当前方案"
          >
            <div aria-live="polite" className="ai-config-surface ai-config-surface-emphasis">
              <div className="ai-config-head ai-config-head-wrap">
                <div>
                  <div className="ai-config-current-title-row">
                    <strong className="ai-config-current-title">{selectedPreset?.label ?? "自定义方案"}</strong>
                  </div>
                  <p className="ai-config-current-copy">{selectionDescription}</p>
                </div>

                <div className="ai-config-inline-actions">
                  {selectedPreset?.apiKeyUrl ? (
                    <a className="btn btn-secondary" href={selectedPreset.apiKeyUrl} rel="noreferrer" target="_blank">
                      获取 Key
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : usesLocalOllama ? (
                    <Badge tone="neutral">本地方案无需云端 Key</Badge>
                  ) : null}
                  {selectedPreset?.docsUrl ? (
                    <a className="btn btn-ghost" href={selectedPreset.docsUrl} rel="noreferrer" target="_blank">
                      文档
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="ai-config-current-grid">
                <div className="ai-config-current-item">
                  <span>服务商</span>
                  <strong>{selectedPreset?.providerName ?? "自定义接口"}</strong>
                </div>
                <div className="ai-config-current-item">
                  <span>模型</span>
                  <strong>{model.trim() || "未设置"}</strong>
                </div>
                <div className="ai-config-current-item ai-config-current-item-wide">
                  <span>接口地址</span>
                  <strong className="ai-config-current-code">{baseUrl.trim() || "未设置"}</strong>
                </div>
              </div>
            </div>
          </AiConfigDisclosure>

          <AiConfigDisclosure
            badge={healthState ? <Badge tone={healthState.tone}>连接状态</Badge> : undefined}
            title="API Key"
          >
            <div className="ai-config-surface">
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
          </AiConfigDisclosure>

          <details className="ai-config-advanced">
            <summary className="ai-config-advanced-summary">
              <span>高级设置</span>
              <ChevronDown className="size-4" />
            </summary>

            <p className="ai-config-advanced-copy">切换方案后，下面的模型名称和接口地址会自动同步；你也可以再手动覆盖。</p>

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
        <div className="ai-config-empty">当前无需配置。</div>
      )}
    </div>
  );
}
