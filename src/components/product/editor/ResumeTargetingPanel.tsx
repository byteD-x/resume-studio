"use client";

import { handleSanitizedPaste } from "@/lib/editor-input";
import type { ResumeDocument } from "@/types/resume";

export function ResumeTargetingPanel({
  document,
  onTargetingChange,
}: {
  document: ResumeDocument;
  onTargetingChange: (field: keyof ResumeDocument["targeting"], value: string) => void;
}) {
  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <p className="resume-editor-panel-kicker">岗位定向</p>
          <h2 className="resume-editor-panel-title">填写岗位信息</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>目标岗位</h3>
          <p>先定岗位与公司。</p>
        </div>
        <div className="resume-editor-field-grid">
          <label className="field-shell">
            <span className="field-label">目标岗位</span>
            <input
              autoComplete="organization-title"
              className="input-control"
              name="role"
              placeholder="例如：Staff Frontend Engineer"
              value={document.targeting.role}
              onChange={(event) => onTargetingChange("role", event.target.value)}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: document.targeting.role,
                  mode: "single-line",
                  onValueChange: (nextValue) => onTargetingChange("role", nextValue),
                })
              }
            />
          </label>
          <label className="field-shell">
            <span className="field-label">目标公司</span>
            <input
              autoComplete="organization"
              className="input-control"
              name="company"
              placeholder="例如：Acme"
              value={document.targeting.company}
              onChange={(event) => onTargetingChange("company", event.target.value)}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: document.targeting.company,
                  mode: "single-line",
                  onValueChange: (nextValue) => onTargetingChange("company", nextValue),
                })
              }
            />
          </label>
        </div>
        <label className="field-shell">
          <span className="field-label">职位链接</span>
          <input
            autoComplete="off"
            className="input-control"
            inputMode="url"
            name="posting_url"
            placeholder="https://..."
            spellCheck={false}
            type="url"
            value={document.targeting.postingUrl}
            onChange={(event) => onTargetingChange("postingUrl", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.targeting.postingUrl,
                mode: "single-line",
                onValueChange: (nextValue) => onTargetingChange("postingUrl", nextValue),
              })
            }
          />
        </label>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>关键词</h3>
          <p>只保留和经历强相关的词。</p>
        </div>
        <label className="field-shell">
          <span className="field-label">关键词</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-24"
            name="focus_keywords"
            placeholder="例如：React, Next.js, Design Systems, Growth, SQL"
            spellCheck={false}
            value={document.targeting.focusKeywords.join(", ")}
            onChange={(event) => onTargetingChange("focusKeywords", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.targeting.focusKeywords.join(", "),
                mode: "skills",
                onValueChange: (nextValue) => onTargetingChange("focusKeywords", nextValue),
              })
            }
          />
        </label>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>岗位备注 / JD 摘要</h3>
          <p>贴 JD，或写这份版本的取舍重点。</p>
        </div>
        <label className="field-shell">
          <span className="field-label">备注</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-44"
            name="targeting_notes"
            placeholder="粘贴职位描述，或写下这份版本要强调的经历、成果和关键词。"
            value={document.targeting.notes}
            onChange={(event) => onTargetingChange("notes", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.targeting.notes,
                mode: "multiline",
                onValueChange: (nextValue) => onTargetingChange("notes", nextValue),
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
