"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { RichTextField } from "@/components/product/editor/RichTextField";
import { handleSanitizedPaste } from "@/lib/editor-input";
import type { EditorSectionDefinition } from "@/lib/resume-editor";
import { stripHtml } from "@/lib/utils";
import type { ResumeSection } from "@/types/resume";

export function ResumeSectionEditorSettings({
  definition,
  onChange,
  section,
}: {
  definition: EditorSectionDefinition;
  onChange: (nextSection: ResumeSection) => void;
  section: ResumeSection;
}) {
  const hasSectionCopy = stripHtml(section.contentHtml).length > 0;

  return (
    <ResumeSectionEditorSettingsForm
      definition={definition}
      hasSectionCopy={hasSectionCopy}
      key={section.id}
      onChange={onChange}
      section={section}
    />
  );
}

function ResumeSectionEditorSettingsForm({
  definition,
  hasSectionCopy,
  onChange,
  section,
}: {
  definition: EditorSectionDefinition;
  hasSectionCopy: boolean;
  onChange: (nextSection: ResumeSection) => void;
  section: ResumeSection;
}) {
  const [titleDraft, setTitleDraft] = useState(section.title);
  const [contentDraft, setContentDraft] = useState(section.contentHtml);
  const titleRef = useRef(section.title);

  useEffect(() => {
    titleRef.current = section.title;
  }, [section.title]);

  useEffect(() => {
    if (titleDraft === section.title) {
      return;
    }

    const timer = window.setTimeout(() => {
      onChange({
        ...section,
        title: titleDraft,
      });
    }, 180);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleDraft, onChange, section.title]);

  useEffect(() => {
    if (contentDraft === section.contentHtml) {
      return;
    }

    const timer = window.setTimeout(() => {
      onChange({
        ...section,
        contentHtml: contentDraft,
      });
    }, 180);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentDraft, onChange, section.contentHtml]);

  const commitTitleDraft = () => {
    if (titleDraft === section.title) {
      return;
    }

    onChange({
      ...section,
      title: titleDraft,
    });
  };

  return (
    <div className="resume-editor-group resume-editor-group-compact resume-section-settings-card">
      <div className="resume-section-settings-head">
        <div className="resume-editor-group-head">
          <h3>区块设置</h3>
          <p>标题和区块说明使用同一套紧凑编辑规则，减少分屏窄栏里的无效占位。</p>
        </div>
        <Badge className="resume-section-settings-badge" tone={hasSectionCopy ? "success" : "neutral"}>
          {hasSectionCopy ? "已填写说明" : "说明可选"}
        </Badge>
      </div>

      <div className="resume-section-settings-grid">
        <label className="field-shell resume-section-settings-title-shell">
          <span className="field-label">标题</span>
          <input
            className="input-control resume-section-settings-title-input"
            onBlur={commitTitleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitTitleDraft();
                event.currentTarget.blur();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setTitleDraft(titleRef.current);
                event.currentTarget.blur();
              }
            }}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: titleDraft,
                mode: "single-line",
                onValueChange: setTitleDraft,
              })
            }
            placeholder={`${definition.title}标题`}
            value={titleDraft}
          />
        </label>

        <RichTextField
          ariaLabel={`${definition.title} 区块内容`}
          className="resume-section-settings-rich"
          density="compact"
          label="区块说明"
          minHeight={76}
          onChange={setContentDraft}
          placeholder="可选：用一句话补充这个区块的重点方向。"
          value={contentDraft}
        />
      </div>
    </div>
  );
}
