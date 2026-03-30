"use client";

import { handleSanitizedPaste } from "@/lib/editor-input";
import type { ResumeDocument } from "@/types/resume";

export function ResumeBasicsPanel({
  document,
  onBasicsChange,
}: {
  document: ResumeDocument;
  onBasicsChange: (field: keyof ResumeDocument["basics"], value: string) => void;
}) {
  const linksValue = document.basics.links.map((link) => `${link.label} ${link.url}`).join("\n");

  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <p className="resume-editor-panel-kicker">基本信息</p>
          <h2 className="resume-editor-panel-title">基本信息</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>基础信息</h3>
        </div>
        <div className="resume-editor-field-grid">
          {[
            ["name", "姓名", "姓名"],
            ["headline", "职位", "目标岗位"],
            ["location", "城市", "城市或远程"],
            ["website", "作品集", "https://your-site.com"],
          ].map(([field, label, placeholder]) => (
            <label className="field-shell" key={field}>
              <span className="field-label">{label}</span>
              <input
                className="input-control"
                placeholder={placeholder}
                value={document.basics[field as keyof ResumeDocument["basics"]] as string}
                onChange={(event) =>
                  onBasicsChange(field as keyof ResumeDocument["basics"], event.target.value)
                }
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: (document.basics[field as keyof ResumeDocument["basics"]] as string) ?? "",
                    mode: "single-line",
                    onValueChange: (nextValue) =>
                      onBasicsChange(field as keyof ResumeDocument["basics"], nextValue),
                  })
                }
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
          {[
            ["email", "邮箱", "name@example.com"],
            ["phone", "手机号", "手机号"],
          ].map(([field, label, placeholder]) => (
            <label className="field-shell" key={field}>
              <span className="field-label">{label}</span>
              <input
                className="input-control"
                placeholder={placeholder}
                value={document.basics[field as keyof ResumeDocument["basics"]] as string}
                onChange={(event) =>
                  onBasicsChange(field as keyof ResumeDocument["basics"], event.target.value)
                }
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: (document.basics[field as keyof ResumeDocument["basics"]] as string) ?? "",
                    mode: "single-line",
                    onValueChange: (nextValue) =>
                      onBasicsChange(field as keyof ResumeDocument["basics"], nextValue),
                  })
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>自我介绍</h3>
        </div>
        <label className="field-shell">
          <span className="field-label">自我介绍</span>
          <textarea
            className="textarea-control min-h-44"
            placeholder="一句介绍"
            value={document.basics.summaryHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim()}
            onChange={(event) => onBasicsChange("summaryHtml", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: document.basics.summaryHtml.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim(),
                mode: "multiline",
                onValueChange: (nextValue) => onBasicsChange("summaryHtml", nextValue),
              })
            }
          />
        </label>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>附加链接</h3>
        </div>
        <label className="field-shell">
          <span className="field-label">链接</span>
          <textarea
            className="textarea-control min-h-28"
            placeholder={"GitHub https://github.com/your-name\n作品集 https://your-site.com"}
            value={linksValue}
            onChange={(event) => onBasicsChange("links", event.target.value)}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: linksValue,
                mode: "multiline",
                onValueChange: (nextValue) => onBasicsChange("links", nextValue),
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
