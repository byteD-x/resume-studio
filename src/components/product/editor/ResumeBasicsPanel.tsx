"use client";

import { useEffect, useMemo, useState } from "react";
import { ResumeAssistPanel } from "@/components/product/editor/ResumeAssistPanel";
import { RichTextField } from "@/components/product/editor/RichTextField";
import { readClientAiConfig } from "@/lib/client-ai-config";
import { handleSanitizedPaste } from "@/lib/editor-input";
import { buildBasicsAssistPack } from "@/lib/resume-assistant";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import { stripHtml } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";

type BasicsTextField = "name" | "headline" | "location" | "website" | "email" | "phone" | "summaryHtml" | "links";

const profileFields = [
  ["name", "姓名", "你的姓名"],
  ["headline", "定位", "例如：AI 应用工程师"],
  ["location", "地区", "城市或远程"],
  ["website", "个人网站", "https://your-site.com"],
] as const;

const contactFields = [
  ["email", "邮箱", "name@example.com"],
  ["phone", "电话", "+86 138 0000 0000"],
] as const;

export function ResumeBasicsPanel({
  document,
  onBasicsChange,
  onSummaryHtmlChange,
}: {
  document: ResumeDocument;
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
          <h2 className="resume-editor-panel-title">抬头信息</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>身份信息</h3>
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
          <h3>联系方式</h3>
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
          <h3>职业摘要</h3>
        </div>

        <RichTextField
          ariaLabel="职业摘要"
          helper="适合写你最核心的方向、优势和代表性价值。"
          label="摘要"
          minHeight={176}
          onChange={onSummaryHtmlChange}
          placeholder="概括你的方向、优势，以及你能为目标岗位带来的结果。"
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
          remoteHint={
            usesRemoteProvider
              ? "使用当前 AI 配置生成摘要建议。"
              : "请先在 AI 面板完成配置，再生成远程摘要建议。"
          }
          remoteLabel="生成摘要"
          remoteLoading={remoteLoading}
          suggestions={combinedSuggestions}
          title="摘要润色"
        />
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>附加链接</h3>
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
