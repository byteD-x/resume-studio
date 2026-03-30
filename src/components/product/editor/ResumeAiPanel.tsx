"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { AiConfigForm } from "@/components/ai/AiConfigForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { TailoredVariantPlan } from "@/lib/resume-tailoring";
import type { ResumeTargetingAnalysis } from "@/lib/resume-targeting";
import type { ResumeDocument } from "@/types/resume";

function renderKeywordList(values: string[], emptyLabel: string) {
  if (values.length === 0) {
    return <span className="text-[color:var(--ink-muted)]">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} tone="neutral">
          {value}
        </Badge>
      ))}
    </div>
  );
}

export function ResumeAiPanel({
  apiKey,
  document,
  analysis,
  tailoredPlan,
  isGenerating,
  isGeneratingSummary,
  generatedSummary,
  onAiChange,
  onAiApiKeyChange,
  onAiPresetApply,
  onGenerateSummary,
  onApplyGeneratedSummary,
  onApplySuggestedKeywords,
  onGenerateTailoredVariant,
}: {
  apiKey: string;
  document: ResumeDocument;
  analysis: ResumeTargetingAnalysis;
  tailoredPlan: TailoredVariantPlan;
  isGenerating: boolean;
  isGeneratingSummary: boolean;
  generatedSummary: string | null;
  onAiChange: (field: keyof ResumeDocument["ai"], value: string) => void;
  onAiApiKeyChange: (value: string) => void;
  onAiPresetApply: (presetId: string) => void;
  onGenerateSummary: () => void;
  onApplyGeneratedSummary: () => void;
  onApplySuggestedKeywords: () => void;
  onGenerateTailoredVariant: () => void;
}) {
  const hasSuggestedKeywords = analysis.suggestedKeywords.length > 0;
  const usesRemoteProvider = document.ai.provider === "openai-compatible";
  const coverageLabel = analysis.coveragePercent == null ? "等待分析" : `${analysis.coveragePercent}% 覆盖`;

  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <p className="resume-editor-panel-kicker">AI</p>
          <h2 className="resume-editor-panel-title">AI 设置与岗位分析</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <AiConfigForm
          apiKey={apiKey}
          baseUrl={document.ai.baseUrl}
          description=""
          model={document.ai.model}
          onApiKeyChange={onAiApiKeyChange}
          onApplyPreset={onAiPresetApply}
          onBaseUrlChange={(value) => onAiChange("baseUrl", value)}
          onModelChange={(value) => onAiChange("model", value)}
          onProviderChange={(value) => onAiChange("provider", value)}
          provider={document.ai.provider}
          title="AI 设置"
        />

        <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[color:var(--ink-strong)]">AI 摘要建议</p>
            <Button disabled={!usesRemoteProvider || isGeneratingSummary} onClick={onGenerateSummary} variant="secondary">
              {isGeneratingSummary ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              生成摘要建议
            </Button>
          </div>

          {generatedSummary ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-[0.9rem] bg-[color:var(--paper-soft)] p-4 text-sm leading-7 text-[color:var(--ink-soft)]">
                {generatedSummary}
              </div>
              <Button onClick={onApplyGeneratedSummary} variant="secondary">
                应用到简历摘要
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[color:var(--ink-muted)]">
              {usesRemoteProvider ? "点击生成。" : "先配置 AI 模型。"}
            </p>
          )}
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>岗位分析</h3>
          <p>基于岗位与 JD。</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={analysis.active ? "accent" : "neutral"}>
            {analysis.active ? "已启用分析" : "等待岗位输入"}
          </Badge>
          <Badge tone={analysis.missingKeywords.length > 0 ? "warning" : "success"}>{coverageLabel}</Badge>
          <Badge tone="neutral">
            {analysis.keywordSource === "manual"
              ? "手动关键词"
              : analysis.keywordSource === "job-description"
                ? "来自 JD"
                : "无关键词"}
          </Badge>
        </div>

        {!analysis.active ? (
          <div className="empty-surface empty-surface-left mt-4">
            <p className="empty-surface-title">先补岗位或 JD</p>
            <p className="empty-surface-text">填入后显示。</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
              <p className="text-sm font-semibold text-[color:var(--ink-strong)]">建议关键词</p>
              <div className="mt-3">{renderKeywordList(analysis.suggestedKeywords, "当前没有建议关键词。")}</div>
              {hasSuggestedKeywords && document.targeting.focusKeywords.length === 0 ? (
                <div className="mt-4">
                  <Button onClick={onApplySuggestedKeywords} variant="secondary">
                    <Sparkles className="size-4" />
                    应用建议关键词
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
                <p className="text-sm font-semibold text-[color:var(--ink-strong)]">已命中</p>
                <div className="mt-3">{renderKeywordList(analysis.matchedKeywords, "还没有命中关键词。")}</div>
              </div>

              <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
                <p className="text-sm font-semibold text-[color:var(--ink-strong)]">待补齐</p>
                <div className="mt-3">{renderKeywordList(analysis.missingKeywords, "当前没有缺口关键词。")}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>定制版生成</h3>
          <p>先看计划，再生成。</p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
            <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">关键词</span>
            <strong className="mt-2 block text-xl text-[color:var(--ink-strong)]">{tailoredPlan.keywords.length}</strong>
          </div>
          <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
            <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">保留模块</span>
            <strong className="mt-2 block text-xl text-[color:var(--ink-strong)]">{tailoredPlan.keptSections}</strong>
          </div>
          <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
            <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">保留条目</span>
            <strong className="mt-2 block text-xl text-[color:var(--ink-strong)]">{tailoredPlan.keptItems}</strong>
          </div>
          <div className="rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4">
            <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">缺口关键词</span>
            <strong className="mt-2 block text-xl text-[color:var(--ink-strong)]">{tailoredPlan.missingKeywords.length}</strong>
          </div>
        </div>

        <div className="rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] p-4">
          <p className="text-sm font-semibold text-[color:var(--ink-strong)]">将要生成的标题</p>
          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{tailoredPlan.titleSuggestion}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button disabled={!tailoredPlan.canGenerate || isGenerating} onClick={onGenerateTailoredVariant}>
            {isGenerating ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            生成岗位定制版
          </Button>
          {!tailoredPlan.canGenerate ? <Badge tone="warning">先补关键词或 JD</Badge> : null}
        </div>
      </div>
    </section>
  );
}
