"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ResumeAssistPanel } from "@/components/product/editor/ResumeAssistPanel";
import { RichTextField } from "@/components/product/editor/RichTextField";
import type { ResumeEditorImportReview } from "@/components/product/editor/workspace/import-review";
import { readClientAiConfig } from "@/lib/client-ai-config";
import { handleSanitizedPaste } from "@/lib/editor-input";
import { buildBasicsAssistPack } from "@/lib/resume-assistant";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import { stripHtml } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";

type BasicsTextField = "name" | "headline" | "location" | "website" | "email" | "phone" | "summaryHtml" | "links";

const profileFields = [
  ["name", "姓名", "你的姓名"],
  ["headline", "目标岗位", "例如：前端工程师"],
  ["location", "地点", "城市 / 远程"],
  ["website", "个人链接", "https://your-site.com"],
] as const;

const contactFields = [
  ["email", "邮箱", "name@example.com"],
  ["phone", "电话", "+86 138 0000 0000"],
] as const;

export function ResumeBasicsPanel({
  document,
  importReview,
  onBasicsChange,
  onSummaryHtmlChange,
}: {
  document: ResumeDocument;
  importReview: ResumeEditorImportReview | null;
  onBasicsChange: (field: BasicsTextField, value: string) => void;
  onSummaryHtmlChange: (value: string) => void;
}) {
  const linksValue = document.basics.links.map((link) => `${link.label} ${link.url}`).join("\n");
  const summaryText = stripHtml(document.basics.summaryHtml).replace(/\s+/g, " ").trim();
  const assistPack = useMemo(() => buildBasicsAssistPack(document), [document]);
  const [remoteSuggestions, setRemoteSuggestions] = useState<ResumeAssistSuggestion[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const usesRemoteProvider = document.ai.provider === "openai-compatible";
  const targetingKeywordsKey = document.targeting.focusKeywords.join("|");
  const combinedSuggestions =
    remoteSuggestions.length > 0 ? [...remoteSuggestions, ...assistPack.suggestions] : assistPack.suggestions;

  const importHighlights = useMemo(() => {
    if (!importReview) {
      return [];
    }

    const rows = [
      ...importReview.pendingItemsPreview.map((item) => ({
        key: `pending-${item}`,
        label: "待确认",
        value: item,
      })),
      ...importReview.fieldSuggestions.map((suggestion) => ({
        key: suggestion.id,
        label: suggestion.label,
        value: summarizeImportValue(suggestion.importedValue),
      })),
      ...importReview.unmappedItems.map((item) => ({
        key: `unmapped-${item}`,
        label: "未映射",
        value: item,
      })),
      ...importReview.snapshots.map((snapshot) => ({
        key: snapshot.id,
        label: snapshot.label || "来源片段",
        value: snapshot.mappedTo || summarizeImportValue(snapshot.excerpt),
      })),
    ];

    return rows.slice(0, 6);
  }, [importReview]);

  useEffect(() => {
    setRemoteSuggestions([]);
    setRemoteError(null);
  }, [
    document.ai.provider,
    document.ai.model,
    document.ai.baseUrl,
    document.basics.headline,
    document.basics.summaryHtml,
    document.targeting.role,
    document.targeting.company,
    document.targeting.jobDescription,
    targetingKeywordsKey,
  ]);

  async function handleGenerateRemoteAssist() {
    setRemoteLoading(true);
    setRemoteError(null);

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "summary",
          document,
          apiKey: readClientAiConfig().apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Failed to generate summary suggestions");
      }

      const result = (await response.json()) as { suggestions?: ResumeAssistSuggestion[] };
      setRemoteSuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Failed to generate summary suggestions");
    } finally {
      setRemoteLoading(false);
    }
  }

  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <h2 className="resume-editor-panel-title">头部信息</h2>
        </div>
      </div>

      {importReview ? (
        <div
          className="resume-editor-group resume-editor-group-compact resume-import-review"
          data-editor-anchor="import-review"
          tabIndex={-1}
        >
          <div className="resume-editor-group-head">
            <h3>导入校对</h3>
          </div>

          <div className="resume-import-review-meta">
            <Badge tone={importReview.remainingCount > 0 ? "warning" : "success"}>
              {importReview.remainingCount > 0 ? `待校对 ${importReview.remainingCount}` : "已清空"}
            </Badge>
            {importReview.pendingItemCount > 0 ? <Badge tone="neutral">待确认 {importReview.pendingItemCount}</Badge> : null}
            {importReview.fieldSuggestionCount > 0 ? <Badge tone="neutral">字段 {importReview.fieldSuggestionCount}</Badge> : null}
            {importReview.snapshotCount > 0 ? <Badge tone="neutral">片段 {importReview.snapshotCount}</Badge> : null}
            {importReview.unmappedItemCount > 0 ? <Badge tone="neutral">未映射 {importReview.unmappedItemCount}</Badge> : null}
          </div>

          {importHighlights.length > 0 ? (
            <div className="resume-import-review-list">
              {importHighlights.map((item) => (
                <div className="resume-import-review-row" key={item.key}>
                  <span className="resume-import-review-label">{item.label}</span>
                  <strong className="resume-import-review-value">{item.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>身份</h3>
        </div>
        <div className="resume-editor-field-grid">
          {profileFields.map(([field, label, placeholder]) => (
            <label className="field-shell" key={field}>
              <span className="field-label">{label}</span>
              <input
                autoComplete={
                  field === "name"
                    ? "name"
                    : field === "location"
                      ? "address-level2"
                      : field === "website"
                        ? "url"
                        : "organization-title"
                }
                className="input-control"
                inputMode={field === "website" ? "url" : "text"}
                name={field}
                onChange={(event) => onBasicsChange(field as BasicsTextField, event.target.value)}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: (document.basics[field as keyof ResumeDocument["basics"]] as string) ?? "",
                    mode: "single-line",
                    onValueChange: (nextValue) => onBasicsChange(field as BasicsTextField, nextValue),
                  })
                }
                placeholder={placeholder}
                spellCheck={field === "website" ? false : undefined}
                type={field === "website" ? "url" : "text"}
                value={document.basics[field as keyof ResumeDocument["basics"]] as string}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>联系</h3>
        </div>
        <div className="resume-editor-field-grid">
          {contactFields.map(([field, label, placeholder]) => (
            <label className="field-shell" key={field}>
              <span className="field-label">{label}</span>
              <input
                autoComplete={field === "email" ? "email" : "tel"}
                className="input-control"
                inputMode={field === "email" ? "email" : "tel"}
                name={field}
                onChange={(event) => onBasicsChange(field as BasicsTextField, event.target.value)}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: (document.basics[field as keyof ResumeDocument["basics"]] as string) ?? "",
                    mode: "single-line",
                    onValueChange: (nextValue) => onBasicsChange(field as BasicsTextField, nextValue),
                  })
                }
                placeholder={placeholder}
                spellCheck={field === "email" ? false : undefined}
                type={field === "email" ? "email" : "tel"}
                value={document.basics[field as keyof ResumeDocument["basics"]] as string}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>摘要</h3>
        </div>

        <RichTextField
          ariaLabel="职业摘要"
          label="摘要"
          minHeight={176}
          onChange={onSummaryHtmlChange}
          placeholder="方向、能力、结果"
          value={document.basics.summaryHtml}
        />

        <ResumeAssistPanel
          getCurrentValue={() => summaryText}
          issues={assistPack.issues}
          onApply={(suggestion) => {
            if (typeof suggestion.nextValue === "string") {
              onSummaryHtmlChange(suggestion.nextValue);
            }
          }}
          onGenerateRemote={() => void handleGenerateRemoteAssist()}
          remoteDisabled={!usesRemoteProvider || remoteLoading}
          remoteError={remoteError}
          remoteHint={usesRemoteProvider ? null : "先配置 AI"}
          remoteLabel="生成"
          remoteLoading={remoteLoading}
          suggestions={combinedSuggestions}
          title="润色"
        />
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>链接</h3>
        </div>
        <label className="field-shell">
          <span className="field-label">链接</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-28"
            name="links"
            onChange={(event) => onBasicsChange("links", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: linksValue,
                mode: "multiline",
                onValueChange: (nextValue) => onBasicsChange("links", nextValue),
              })
            }
            placeholder={"GitHub https://github.com/your-name\n作品集 https://your-site.com"}
            spellCheck={false}
            value={linksValue}
          />
        </label>
      </div>
    </section>
  );
}

function summarizeImportValue(value: string) {
  return stripHtml(value).replace(/\s+/g, " ").trim() || "待校对";
}
