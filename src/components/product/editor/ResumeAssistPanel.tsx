"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ResumeAssistIssue, ResumeAssistSuggestion } from "@/lib/resume-assistant";

export function ResumeAssistPanel({
  title = "AI 写作建议",
  description = "",
  issues,
  suggestions,
  onApply,
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
  onGenerateRemote?: () => void;
  remoteDisabled?: boolean;
  remoteError?: string | null;
  remoteHint?: string | null;
  remoteLoading?: boolean;
  remoteLabel?: string;
}) {
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
          <Badge tone="accent">保守改写</Badge>
          {onGenerateRemote ? (
            <Button disabled={remoteDisabled || remoteLoading} onClick={onGenerateRemote} variant="secondary">
              {remoteLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {remoteLabel}
            </Button>
          ) : null}
        </div>
      </div>

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
                <strong>{suggestion.label}</strong>
                <span>{suggestion.detail}</span>
              </div>
              <div className="resume-assist-preview">
                {suggestion.previewLines.map((line, index) => (
                  <p key={`${suggestion.id}-${index}`}>{line}</p>
                ))}
              </div>
              <div className="resume-assist-actions">
                <Badge tone="neutral">
                  {suggestion.target === "summary"
                    ? "作用于摘要"
                    : suggestion.target === "tags"
                      ? "作用于技能"
                      : "作用于要点"}
                </Badge>
                <Button onClick={() => onApply(suggestion)} variant="secondary">
                  {suggestion.applyLabel}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
