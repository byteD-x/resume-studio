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

function buildMetaLine(issues: ResumeAssistIssue[], suggestions: ResumeAssistSuggestion[]) {
  const parts: string[] = [];
  if (issues.length > 0) {
    parts.push(`${issues.length} 项待处理`);
  }
  if (suggestions.length > 0) {
    parts.push(`${suggestions.length} 条参考`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function ResumeAssistPanel({
  title = "写作辅助",
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
  remoteLabel = "生成",
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

  const metaLine = buildMetaLine(issues, suggestions);
  const hasBody =
    issues.length > 0 || suggestions.length > 0 || Boolean(remoteError) || Boolean(description);

  if (issues.length === 0 && suggestions.length === 0 && !onGenerateRemote && !remoteError && !remoteHint) {
    return null;
  }

  return (
    <section className="resume-assist-panel">
      <div className="resume-assist-toolbar">
        <div className="resume-assist-toolbar-text">
          <p className="resume-assist-title">
            <Sparkles aria-hidden className="resume-assist-title-icon" />
            <span>{title}</span>
          </p>
          {metaLine ? <span className="resume-assist-toolbar-meta">{metaLine}</span> : null}
        </div>

        <div className="resume-assist-toolbar-actions">
          {onGenerateRemote ? (
            <Button
              className="resume-assist-generate-btn"
              disabled={remoteDisabled || remoteLoading}
              onClick={onGenerateRemote}
              title={remoteDisabled && remoteHint ? remoteHint : undefined}
              variant="secondary"
            >
              {remoteLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {remoteLabel}
            </Button>
          ) : null}

          {hasBody ? (
            <button
              aria-expanded={expanded}
              className={`resume-assist-expand ${expanded ? "resume-assist-expand-open" : ""}`}
              onClick={() => setExpanded((current) => !current)}
              type="button"
            >
              <span>{expanded ? "收起" : "详情"}</span>
              <ChevronDown aria-hidden className="resume-assist-expand-chevron" />
            </button>
          ) : null}
        </div>
      </div>

      {description ? <p className="resume-assist-panel-lead">{description}</p> : null}

      {expanded && hasBody ? (
        <div className="resume-assist-panel-body">
          {remoteError ? (
            <p className="resume-assist-remote-error" role="alert">
              {remoteError}
            </p>
          ) : null}

          {issues.length > 0 ? (
            <div className="resume-assist-issue-list">
              {issues.map((issue) => (
                <article className="resume-assist-issue" key={issue.id}>
                  <div className="resume-assist-issue-head">
                    <strong>{issue.title}</strong>
                    <Badge tone={issue.tone === "warning" ? "warning" : "neutral"}>
                      {issue.tone === "warning" ? "优先" : "说明"}
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
                        <span className="resume-assist-compare-label">当前</span>
                        {renderCompareList(normalizeValue(getCurrentValue?.(suggestion)))}
                      </div>
                      <div className="resume-assist-compare-card">
                        <span className="resume-assist-compare-label">建议</span>
                        {renderCompareList(normalizeValue(suggestion.nextValue))}
                      </div>
                    </div>
                  ) : null}
                  <div className="resume-assist-actions">
                    <div className="resume-assist-actions-meta">
                      <button
                        className={`resume-assist-compare-toggle ${expandedSuggestionId === suggestion.id ? "resume-assist-compare-toggle-active" : ""}`}
                        onClick={() =>
                          setExpandedSuggestionId((current) => (current === suggestion.id ? null : suggestion.id))
                        }
                        type="button"
                      >
                        <ChevronDown className="size-3.5" />
                        {expandedSuggestionId === suggestion.id ? "收起对比" : "对比"}
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
        </div>
      ) : null}
    </section>
  );
}
