"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { AiConfigForm } from "@/components/ai/AiConfigForm";
import { ResumeAssistPanel } from "@/components/product/editor/ResumeAssistPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { TailoredVariantPlan } from "@/lib/resume-tailoring";
import type { ResumeTargetingAnalysis } from "@/lib/resume-targeting";
import type { ResumeDocument } from "@/types/resume";

function renderKeywordList(values: string[], emptyLabel: string) {
  if (values.length === 0) {
    return <span className="resume-ai-empty-copy">{emptyLabel}</span>;
  }

  return (
    <div className="resume-ai-keyword-list">
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
  generatedSummarySuggestions,
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
  generatedSummarySuggestions: ResumeAssistSuggestion[];
  onAiChange: (field: keyof ResumeDocument["ai"], value: string) => void;
  onAiApiKeyChange: (value: string) => void;
  onAiPresetApply: (presetId: string) => void;
  onGenerateSummary: () => void;
  onApplyGeneratedSummary: (suggestion: ResumeAssistSuggestion) => void;
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
          <h2 className="resume-editor-panel-title">AI 辅助</h2>
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
          title="模型设置"
        />

        <div className="resume-ai-surface">
          <ResumeAssistPanel
            description=""
            getCurrentValue={() => document.basics.summaryHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim()}
            issues={[]}
            onApply={onApplyGeneratedSummary}
            onGenerateRemote={onGenerateSummary}
            remoteDisabled={!usesRemoteProvider || isGeneratingSummary}
            remoteHint={usesRemoteProvider ? "生成后先比对，再决定是否应用。" : "先配置 AI 模型。"}
            remoteLabel="生成摘要"
            remoteLoading={isGeneratingSummary}
            suggestions={generatedSummarySuggestions}
            title="摘要建议"
          />
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>岗位分析</h3>
          <p>根据岗位和 JD 查看匹配缺口。</p>
        </div>

        <div className="resume-ai-badge-row">
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
          <div className="empty-surface empty-surface-left resume-ai-empty-state">
            <p className="empty-surface-title">先补岗位或 JD</p>
            <p className="empty-surface-text">填入后显示结果。</p>
          </div>
        ) : (
          <div className="resume-ai-analysis-stack">
            <div className="resume-ai-surface">
              <p className="resume-ai-surface-title">建议关键词</p>
              <div className="resume-ai-surface-body">
                {renderKeywordList(analysis.suggestedKeywords, "当前没有建议关键词。")}
              </div>
              {hasSuggestedKeywords && document.targeting.focusKeywords.length === 0 ? (
                <div className="resume-ai-surface-actions">
                  <Button onClick={onApplySuggestedKeywords} variant="secondary">
                    <Sparkles className="size-4" />
                    应用建议关键词
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="resume-ai-analysis-grid">
              <div className="resume-ai-surface">
                <p className="resume-ai-surface-title">已命中</p>
                <div className="resume-ai-surface-body">
                  {renderKeywordList(analysis.matchedKeywords, "还没有命中关键词。")}
                </div>
              </div>

              <div className="resume-ai-surface">
                <p className="resume-ai-surface-title">待补齐</p>
                <div className="resume-ai-surface-body">
                  {renderKeywordList(analysis.missingKeywords, "当前没有缺口关键词。")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>定制版生成</h3>
          <p>确认取舍后再生成岗位版。</p>
        </div>

        <div className="resume-ai-metric-grid">
          <div className="resume-ai-metric-card">
            <span>关键词</span>
            <strong>{tailoredPlan.keywords.length}</strong>
          </div>
          <div className="resume-ai-metric-card">
            <span>保留模块</span>
            <strong>{tailoredPlan.keptSections}</strong>
          </div>
          <div className="resume-ai-metric-card">
            <span>保留条目</span>
            <strong>{tailoredPlan.keptItems}</strong>
          </div>
          <div className="resume-ai-metric-card">
            <span>缺口关键词</span>
            <strong>{tailoredPlan.missingKeywords.length}</strong>
          </div>
        </div>

        <div className="resume-ai-surface resume-ai-surface-soft">
          <p className="resume-ai-surface-title">将要生成的标题</p>
          <p className="resume-ai-surface-body">{tailoredPlan.titleSuggestion}</p>
        </div>

        <div className="resume-ai-action-row">
          <Button disabled={!tailoredPlan.canGenerate || isGenerating} onClick={onGenerateTailoredVariant}>
            {isGenerating ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            生成岗位版
          </Button>
          {!tailoredPlan.canGenerate ? <Badge tone="warning">先补关键词或 JD</Badge> : null}
        </div>
      </div>
    </section>
  );
}
