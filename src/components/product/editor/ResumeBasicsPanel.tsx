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
          <h2 className="resume-editor-panel-title">填写基本信息</h2>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>身份信息</h3>
          <p>姓名、定位、城市与站点。</p>
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
                placeholder={placeholder}
                spellCheck={field === "website" ? false : undefined}
                type={field === "website" ? "url" : "text"}
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
          <p>至少保留两种联系方式。</p>
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
                placeholder={placeholder}
                spellCheck={field === "email" ? false : undefined}
                type={field === "email" ? "email" : "tel"}
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
          <h3>职业摘要</h3>
          <p>用 2 到 3 句写方向、优势和结果。</p>
        </div>
        <label className="field-shell">
          <span className="field-label">职业摘要</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-44"
            name="summary"
            placeholder="例如：5 年前端经验，主导过中后台与设计系统建设。"
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
          <p>补充 GitHub、作品集或博客。</p>
        </div>
        <label className="field-shell">
          <span className="field-label">链接</span>
          <textarea
            autoComplete="off"
            className="textarea-control min-h-28"
            name="links"
            placeholder={"GitHub https://github.com/your-name\n作品集 https://your-site.com"}
            spellCheck={false}
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
