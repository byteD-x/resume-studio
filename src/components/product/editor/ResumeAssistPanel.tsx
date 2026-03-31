"use client";

import { useState } from "react";
import { ChevronDown, LoaderCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ResumeAssistIssue, ResumeAssistSuggestion } from "@/lib/resume-assistant";

function normalizeValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function renderCompareList(lines: string[]) {
  if (lines.length === 0) {
    return <p className="resume-assist-compare-empty">暂无内容</p>;
  }

  return (
    <div className="resume-assist-compare-lines">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line}</p>
      ))}
    </div>
  );
}

export function ResumeAssistPanel({
  title = "AI 写作建议",
  description = "",
  issues,
  suggestions,
  onApply,
  getCurrentValue,
  onGenerateRemote,
  remoteDisabled = false,
  remoteError = null,
  remoteHint = null,
  remoteLoading = false,
  remoteLabel = "生成远程建议",
}: {
  title?: string;
  description?: string;
  issues: ResumeAssistIssue[];
  suggestions: ResumeAssistSuggestion[];
  onApply: (suggestion: ResumeAssistSuggestion) => void;
  getCurrentValue?: (suggestion: ResumeAssistSuggestion) => string | string[] | null | undefined;
  onGenerateRemote?: () => void;
  remoteDisabled?: boolean;
  remoteError?: string | null;
  remoteHint?: string | null;
  remoteLoading?: boolean;
  remoteLabel?: string;
}) {
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(() => Boolean(remoteError) || issues.length > 0);

  if (issues.length === 0 && suggestions.length === 0 && !onGenerateRemote && !remoteError && !remoteHint) {
    return null;
  }

  return (
    <section className="resume-assist-panel">
      <div className="resume-assist-panel-head">
        <div>
          <p className="resume-assist-panel-kicker">
            <Sparkles className="size-4" />
            {title}
          </p>
          {description ? <p className="resume-assist-panel-copy">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">建议</Badge>
          {issues.length > 0 ? <Badge tone="warning">{issues.length} 个问题</Badge> : null}
          {suggestions.length > 0 ? <Badge tone="neutral">{suggestions.length} 条建议</Badge> : null}
          {onGenerateRemote ? (
            <Button disabled={remoteDisabled || remoteLoading} onClick={onGenerateRemote} variant="secondary">
              {remoteLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {remoteLabel}
            </Button>
          ) : null}
          <button
            className={`resume-assist-compare-toggle ${expanded ? "resume-assist-compare-toggle-active" : ""}`}
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            <ChevronDown className="size-4" />
            {expanded ? "收起建议" : "展开建议"}
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          {remoteHint ? <p className="resume-assist-panel-copy">{remoteHint}</p> : null}
          {remoteError ? <p className="text-sm text-[color:var(--danger-strong)]">{remoteError}</p> : null}

          {issues.length > 0 ? (
            <div className="resume-assist-issue-list">
              {issues.map((issue) => (
                <article className="resume-assist-issue" key={issue.id}>
                  <div className="resume-assist-issue-head">
                    <strong>{issue.title}</strong>
                    <Badge tone={issue.tone === "warning" ? "warning" : "neutral"}>
                      {issue.tone === "warning" ? "优先处理" : "说明"}
                    </Badge>
                  </div>
                  <p>{issue.detail}</p>
                </article>
              ))}
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="resume-assist-suggestion-list">
              {suggestions.map((suggestion) => (
                <article className="resume-assist-suggestion" key={suggestion.id}>
                  <div className="resume-assist-suggestion-head">
                    <div className="resume-assist-suggestion-copy">
                      <strong>{suggestion.label}</strong>
                      <span>{suggestion.detail}</span>
                    </div>
                  </div>
                  <div className="resume-assist-preview">
                    {suggestion.previewLines.map((line, index) => (
                      <p key={`${suggestion.id}-${index}`}>{line}</p>
                    ))}
                  </div>
                  {expandedSuggestionId === suggestion.id ? (
                    <div className="resume-assist-compare-grid">
                      <div className="resume-assist-compare-card">
                        <span className="resume-assist-compare-label">当前内容</span>
                        {renderCompareList(normalizeValue(getCurrentValue?.(suggestion)))}
                      </div>
                      <div className="resume-assist-compare-card">
                        <span className="resume-assist-compare-label">建议内容</span>
                        {renderCompareList(normalizeValue(suggestion.nextValue))}
                      </div>
                    </div>
                  ) : null}
                  <div className="resume-assist-actions">
                    <div className="resume-assist-actions-meta">
                      <Badge tone="neutral">
                        {suggestion.target === "summary"
                          ? "更新摘要"
                          : suggestion.target === "tags"
                            ? "更新技能"
                            : "更新要点"}
                      </Badge>
                      <button
                        className={`resume-assist-compare-toggle ${expandedSuggestionId === suggestion.id ? "resume-assist-compare-toggle-active" : ""}`}
                        onClick={() =>
                          setExpandedSuggestionId((current) => (current === suggestion.id ? null : suggestion.id))
                        }
                        type="button"
                      >
                        <ChevronDown className="size-4" />
                        {expandedSuggestionId === suggestion.id ? "收起对比" : "查看对比"}
                      </button>
                    </div>
                    <Button onClick={() => onApply(suggestion)} variant="secondary">
                      {suggestion.applyLabel}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
