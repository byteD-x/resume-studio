"use client";

import { Bot, ChevronDown, Loader2, ScanSearch, Sparkles } from "lucide-react";
import { AiConfigForm } from "@/components/ai/AiConfigForm";
import { Button } from "@/components/ui/Button";
import type { ImportAiMode, ImportSource } from "@/components/import/portfolio-import/types";

function PortfolioImportUrlOptions({
  customAiApiKey,
  customAiBaseUrl,
  customAiModel,
  importAiMode,
  includeLinkedPages,
  isExtracting,
  maxLinkedPages,
  onAiApiKeyChange,
  onAiBaseUrlChange,
  onAiModeChange,
  onAiModelChange,
  onApplyAiPreset,
  onIncludeLinkedPagesChange,
  onMaxLinkedPagesChange,
}: {
  customAiApiKey: string;
  customAiBaseUrl: string;
  customAiModel: string;
  importAiMode: ImportAiMode;
  includeLinkedPages: boolean;
  isExtracting: boolean;
  maxLinkedPages: number;
  onAiApiKeyChange: (value: string) => void;
  onAiBaseUrlChange: (value: string) => void;
  onAiModeChange: (mode: ImportAiMode) => void;
  onAiModelChange: (value: string) => void;
  onApplyAiPreset: (presetId: string) => void;
  onIncludeLinkedPagesChange: (checked: boolean) => void;
  onMaxLinkedPagesChange: (value: number) => void;
}) {
  return (
    <div className="mt-3 rounded-[0.8rem] bg-[color:var(--paper-soft)] px-3 py-3 ring-1 ring-[color:var(--line)] xl:mt-0 xl:h-full">
      <div className="mb-3 flex flex-col gap-2 text-left">
        <span className="text-[0.82rem] font-semibold text-[color:var(--ink-strong)]">网站导入模式</span>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="网站导入模式">
          <button
            aria-checked={importAiMode === "ai"}
            className={`rounded-[1rem] border px-3 py-3 text-left transition-all ${
              importAiMode === "ai"
                ? "border-[color:var(--accent)] bg-white shadow-[0_10px_24px_rgba(22,93,255,0.12)]"
                : "border-[color:var(--line)] bg-white/72 hover:bg-white"
            }`}
            disabled={isExtracting}
            onClick={() => onAiModeChange("ai")}
            role="radio"
            type="button"
          >
            <span className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                <Bot className="size-4.5" />
              </span>
              <span className="min-w-0">
                <strong className="block text-[0.88rem] text-[color:var(--ink-strong)]">AI 结构化抽取</strong>
                <span className="mt-1 block text-[0.78rem] leading-relaxed text-[color:var(--ink-soft)]">
                  直接调用下方方案做经历抽取，模型、Key 和文档会跟随方案一起切换。
                </span>
              </span>
            </span>
          </button>

          <button
            aria-checked={importAiMode === "rules"}
            className={`rounded-[1rem] border px-3 py-3 text-left transition-all ${
              importAiMode === "rules"
                ? "border-[color:var(--ink-strong)] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                : "border-[color:var(--line)] bg-white/72 hover:bg-white"
            }`}
            disabled={isExtracting}
            onClick={() => onAiModeChange("rules")}
            role="radio"
            type="button"
          >
            <span className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <ScanSearch className="size-4.5" />
              </span>
              <span className="min-w-0">
                <strong className="block text-[0.88rem] text-[color:var(--ink-strong)]">规则导入</strong>
                <span className="mt-1 block text-[0.78rem] leading-relaxed text-[color:var(--ink-soft)]">
                  不请求外部模型，直接按页面结构和站内关键页规则整理内容。
                </span>
              </span>
            </span>
          </button>
        </div>

        <div
          aria-live="polite"
          className={`rounded-[0.9rem] border px-3 py-2.5 text-[0.8rem] leading-relaxed ${
            importAiMode === "ai"
              ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 text-[color:var(--accent-strong)]"
              : "border-[color:var(--line)] bg-white/78 text-[color:var(--ink-soft)]"
          }`}
        >
          {importAiMode === "ai"
            ? "当前按 AI 方案导入。切换下方预设后，模型名称、接口地址、获取 Key 和文档入口会立即同步。"
            : "当前按规则导入。不会调用外部模型，也不需要配置 API Key。"}
        </div>
      </div>

      {importAiMode === "ai" ? (
        <details className="ai-import-model-collapse">
          <summary className="ai-import-model-summary">
            <span className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
              <strong className="text-[0.88rem] text-[color:var(--ink-strong)]">网站导入模型</strong>
            </span>
            <ChevronDown className="ai-import-model-chevron size-4 text-[color:var(--ink-muted)] transition-transform" />
          </summary>
          <div className="mt-3">
            <AiConfigForm
              apiKey={customAiApiKey}
              baseUrl={customAiBaseUrl}
              description=""
              disabled={isExtracting}
              model={customAiModel}
              onApiKeyChange={onAiApiKeyChange}
              onApplyPreset={onApplyAiPreset}
              onBaseUrlChange={onAiBaseUrlChange}
              onModelChange={onAiModelChange}
              provider="openai-compatible"
              showProvider={false}
              title=""
            />
          </div>
        </details>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-6">
        <label className="flex items-start gap-3 text-left">
          <input
            checked={includeLinkedPages}
            className="mt-1"
            disabled={isExtracting}
            onChange={(event) => onIncludeLinkedPagesChange(event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong className="block text-[0.86rem] text-[color:var(--ink-strong)]">继续抓取同站关键子页</strong>
            <span className="block text-[0.78rem] leading-relaxed text-[color:var(--ink-soft)]">
              优先尝试 About、Projects、Experience、Resume 页面。
            </span>
          </span>
        </label>

        <label className="flex flex-wrap items-center gap-2.5 pl-8 text-[0.8rem] text-[color:var(--ink-soft)] sm:justify-self-end sm:pl-0">
          <span className="shrink-0">最多抓取</span>
          <select
            className="rounded-md border border-[color:var(--line)] bg-white px-2 py-1 text-[0.8rem] text-[color:var(--ink-strong)]"
            disabled={isExtracting || !includeLinkedPages}
            onChange={(event) => onMaxLinkedPagesChange(Number(event.target.value))}
            value={maxLinkedPages}
          >
            <option value={2}>2 页</option>
            <option value={3}>3 页</option>
            <option value={4}>4 页</option>
            <option value={5}>5 页</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function PortfolioImportTextPanel({
  activeTab,
  customAiApiKey,
  customAiBaseUrl,
  customAiModel,
  error,
  importAiMode,
  includeLinkedPages,
  inputValue,
  isExtracting,
  maxLinkedPages,
  onAiApiKeyChange,
  onAiBaseUrlChange,
  onAiModeChange,
  onAiModelChange,
  onApplyAiPreset,
  onImport,
  onIncludeLinkedPagesChange,
  onInputChange,
  onMaxLinkedPagesChange,
  placeholder,
}: {
  activeTab: Exclude<ImportSource, "pdf">;
  customAiApiKey: string;
  customAiBaseUrl: string;
  customAiModel: string;
  error: string;
  importAiMode: ImportAiMode;
  includeLinkedPages: boolean;
  inputValue: string;
  isExtracting: boolean;
  maxLinkedPages: number;
  onAiApiKeyChange: (value: string) => void;
  onAiBaseUrlChange: (value: string) => void;
  onAiModeChange: (mode: ImportAiMode) => void;
  onAiModelChange: (value: string) => void;
  onApplyAiPreset: (presetId: string) => void;
  onImport: () => void;
  onIncludeLinkedPagesChange: (checked: boolean) => void;
  onInputChange: (value: string) => void;
  onMaxLinkedPagesChange: (value: number) => void;
  placeholder: string;
}) {
  const isTextMode = activeTab === "markdown" || activeTab === "text";

  return (
    <div className="flex min-h-[18rem] flex-col p-1.5 sm:p-2">
      {!isTextMode ? (
        <div
          className={`flex flex-1 flex-col px-4 py-2 sm:px-5 ${
            activeTab === "url"
              ? "xl:grid xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,24rem)] xl:items-start xl:gap-6 xl:px-6"
              : "justify-center"
          }`}
        >
          <div className="flex w-full min-w-0 flex-1 flex-col justify-center">
            <input
              className="w-full bg-transparent px-2 py-3 text-[1.1rem] text-[color:var(--ink-strong)] placeholder:text-slate-300 focus:outline-none"
              disabled={isExtracting}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={placeholder}
              spellCheck={false}
              type="url"
              value={inputValue}
            />
          </div>

          {activeTab === "url" ? (
            <div className="w-full min-w-0 xl:self-stretch">
              <PortfolioImportUrlOptions
                customAiApiKey={customAiApiKey}
                customAiBaseUrl={customAiBaseUrl}
                customAiModel={customAiModel}
                importAiMode={importAiMode}
                includeLinkedPages={includeLinkedPages}
                isExtracting={isExtracting}
                maxLinkedPages={maxLinkedPages}
                onAiApiKeyChange={onAiApiKeyChange}
                onAiBaseUrlChange={onAiBaseUrlChange}
                onAiModeChange={onAiModeChange}
                onAiModelChange={onAiModelChange}
                onApplyAiPreset={onApplyAiPreset}
                onIncludeLinkedPagesChange={onIncludeLinkedPagesChange}
                onMaxLinkedPagesChange={onMaxLinkedPagesChange}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <textarea
          className="flex-1 w-full resize-none rounded-md bg-transparent p-4 text-[0.95rem] leading-relaxed text-[color:var(--ink-strong)] placeholder:text-slate-300 focus:outline-none sm:p-5"
          disabled={isExtracting}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          value={inputValue}
        />
      )}

      <div className="m-[-0.375rem] mt-auto flex flex-col gap-3 rounded-b-[0.6rem] border-t border-[color:var(--line)] bg-[color:var(--paper-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center text-[0.8rem] text-[color:var(--ink-muted)]">
          {error ? (
            <span className="font-medium text-red-500">{error}</span>
          ) : (
            <span>
              {activeTab === "url" && "确保链接可公开访问"}
              {activeTab === "markdown" && "结构越清晰，提取越准确"}
              {activeTab === "text" && "不用在意格式，直接粘贴即可"}
            </span>
          )}
        </div>

        <Button
          className="h-[2.2rem] min-w-[6rem] rounded-full bg-[color:var(--ink-strong)] text-[0.85rem] hover:bg-[color:var(--ink)]"
          disabled={!inputValue.trim() || isExtracting}
          onClick={onImport}
        >
          {isExtracting ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              提取内容
              <Sparkles className="ml-1.5 size-3.5 opacity-80" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
