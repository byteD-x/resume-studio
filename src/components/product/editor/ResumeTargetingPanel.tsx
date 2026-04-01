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
          <h2 className="resume-editor-panel-title">岗位信息</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>目标信息</h3>
        </div>

        <div className="resume-editor-field-grid">
          <label className="field-shell">
            <span className="field-label">目标岗位</span>
            <input
              autoComplete="organization-title"
              className="input-control"
              name="role"
              onChange={(event) => onTargetingChange("role", event.target.value)}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: document.targeting.role,
                  mode: "single-line",
                  onValueChange: (nextValue) => onTargetingChange("role", nextValue),
                })
              }
              placeholder="例如：前端负责人 / Staff Frontend Engineer"
              value={document.targeting.role}
            />
          </label>

          <label className="field-shell">
            <span className="field-label">目标公司</span>
            <input
              autoComplete="organization"
              className="input-control"
              name="company"
              onChange={(event) => onTargetingChange("company", event.target.value)}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: document.targeting.company,
                  mode: "single-line",
                  onValueChange: (nextValue) => onTargetingChange("company", nextValue),
                })
              }
              placeholder="例如：字节跳动 / Acme"
              value={document.targeting.company}
            />
          </label>

          <label className="field-shell">
            <span className="field-label">职位链接</span>
            <input
              autoComplete="off"
              className="input-control"
              inputMode="url"
              name="posting_url"
              onChange={(event) => onTargetingChange("postingUrl", event.target.value)}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: document.targeting.postingUrl,
                  mode: "single-line",
                  onValueChange: (nextValue) => onTargetingChange("postingUrl", nextValue),
                })
              }
              placeholder="https://..."
              spellCheck={false}
              type="url"
              value={document.targeting.postingUrl}
            />
          </label>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>关键词</h3>
        </div>
        <label className="field-shell">
          <span className="field-label">关键词</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-24"
            name="focus_keywords"
            onChange={(event) => onTargetingChange("focusKeywords", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.targeting.focusKeywords.join(", "),
                mode: "skills",
                onValueChange: (nextValue) => onTargetingChange("focusKeywords", nextValue),
              })
            }
            placeholder="例如：React, Next.js, Design Systems, Growth, SQL"
            spellCheck={false}
            value={document.targeting.focusKeywords.join(", ")}
          />
        </label>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>职位描述</h3>
        </div>
        <label className="field-shell">
          <span className="field-label">JD 原文</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-44"
            name="job_description"
            onChange={(event) => onTargetingChange("jobDescription", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.targeting.jobDescription,
                mode: "multiline",
                onValueChange: (nextValue) => onTargetingChange("jobDescription", nextValue),
              })
            }
            placeholder="粘贴职位描述原文。"
            value={document.targeting.jobDescription}
          />
        </label>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>版本备注</h3>
        </div>
        <label className="field-shell">
          <span className="field-label">备注</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-32"
            name="targeting_notes"
            onChange={(event) => onTargetingChange("notes", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.targeting.notes,
                mode: "multiline",
                onValueChange: (nextValue) => onTargetingChange("notes", nextValue),
              })
            }
            placeholder="例如：这一版优先突出设计系统、跨团队影响力和增长实验经验。"
            value={document.targeting.notes}
          />
        </label>
      </div>
    </section>
  );
}
