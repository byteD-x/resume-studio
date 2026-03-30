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
          <p className="resume-editor-panel-kicker">岗位信息</p>
          <h2 className="resume-editor-panel-title">岗位信息</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>岗位</h3>
        </div>
        <div className="resume-editor-field-grid">
          <label className="field-shell">
            <span className="field-label">岗位</span>
            <input
              className="input-control"
              placeholder="目标岗位"
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
            <span className="field-label">公司</span>
            <input
              className="input-control"
              placeholder="公司名称"
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
            className="input-control"
            placeholder="https://..."
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
        </div>
        <label className="field-shell">
          <span className="field-label">关键词</span>
          <textarea
            className="textarea-control min-h-24"
            placeholder="例如：增长、SQL、数据分析"
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
          <h3>备注</h3>
        </div>
        <label className="field-shell">
          <span className="field-label">备注</span>
          <textarea
            className="textarea-control min-h-44"
            placeholder="职位描述或备注"
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
