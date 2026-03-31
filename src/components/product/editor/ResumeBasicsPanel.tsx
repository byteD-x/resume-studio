"use client";

import { useEffect, useMemo, useState } from "react";
import { ResumeAssistPanel } from "@/components/product/editor/ResumeAssistPanel";
import { readClientAiConfig } from "@/lib/client-ai-config";
import { handleSanitizedPaste } from "@/lib/editor-input";
import { buildBasicsAssistPack } from "@/lib/resume-assistant";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeDocument } from "@/types/resume";

type BasicsTextField = "name" | "headline" | "location" | "website" | "email" | "phone" | "summaryHtml" | "links";

export function ResumeBasicsPanel({
  document,
  onBasicsChange,
}: {
  document: ResumeDocument;
  onBasicsChange: (field: BasicsTextField, value: string) => void;
}) {
  const linksValue = document.basics.links.map((link) => `${link.label} ${link.url}`).join("\n");
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
        throw new Error((await response.text()) || "远程摘要建议生成失败");
      }

      const result = (await response.json()) as { suggestions?: ResumeAssistSuggestion[] };
      setRemoteSuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "远程摘要建议生成失败");
    } finally {
      setRemoteLoading(false);
    }
  }

  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <p className="resume-editor-panel-kicker">基本信息</p>
          <h2 className="resume-editor-panel-title">抬头信息</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>身份信息</h3>
          <p>姓名、定位与城市。</p>
        </div>
        <div className="resume-editor-field-grid">
          {[
            ["name", "姓名", "你的姓名"],
            ["headline", "当前定位", "例如：高级前端工程师"],
            ["location", "城市", "城市或远程"],
            ["website", "个人站点", "https://your-site.com"],
          ].map(([field, label, placeholder]) => (
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
          <p>保留常用联系渠道。</p>
        </div>
        <div className="resume-editor-field-grid">
          {[
            ["email", "邮箱", "name@example.com"],
            ["phone", "手机号", "你的手机号"],
          ].map(([field, label, placeholder]) => (
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
          <p>用两三句话概括方向、优势和结果。</p>
        </div>
        <label className="field-shell">
          <span className="field-label">职业摘要</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-44"
            name="summary"
            onChange={(event) => onBasicsChange("summaryHtml", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.basics.summaryHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim(),
                mode: "multiline",
                onValueChange: (nextValue) => onBasicsChange("summaryHtml", nextValue),
              })
            }
            placeholder="例如：5 年前端经验，主导过中后台与设计系统建设。"
            value={document.basics.summaryHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim()}
          />
        </label>

        <ResumeAssistPanel
          description=""
          getCurrentValue={() => document.basics.summaryHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim()}
          issues={assistPack.issues}
          onApply={(suggestion) => {
            if (typeof suggestion.nextValue === "string") {
              onBasicsChange("summaryHtml", suggestion.nextValue);
            }
          }}
          onGenerateRemote={() => void handleGenerateRemoteAssist()}
          remoteDisabled={!usesRemoteProvider || remoteLoading}
          remoteError={remoteError}
          remoteHint={usesRemoteProvider ? "使用当前配置生成。" : "先配置 AI 模型。"}
          remoteLabel="生成摘要"
          remoteLoading={remoteLoading}
          suggestions={combinedSuggestions}
          title="摘要建议"
        />
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>附加链接</h3>
          <p>只保留最能证明能力的链接。</p>
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
