"use client";

import { RichTextField } from "@/components/product/editor/RichTextField";
import { handleSanitizedPaste } from "@/lib/editor-input";
import type { EditorSectionDefinition } from "@/lib/resume-editor";
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
  return (
    <div className="resume-editor-group resume-editor-group-compact">
      <div className="resume-editor-group-head">
        <h3>区块设置</h3>
      </div>
      <div className="resume-editor-field-grid">
        <label className="field-shell">
          <span className="field-label">标题</span>
          <input
            className="input-control"
            onChange={(event) => onChange({ ...section, title: event.target.value })}
            onPaste={(event) =>
              handleSanitizedPaste(event, {
                currentValue: section.title,
                mode: "single-line",
                onValueChange: (nextValue) => onChange({ ...section, title: nextValue }),
              })
            }
            value={section.title}
          />
        </label>
        <RichTextField
          ariaLabel="Section description"
          minHeight={128}
          onChange={(nextValue) =>
            onChange({
              ...section,
              contentHtml: nextValue,
            })
          }
          placeholder={definition.description}
          value={section.contentHtml}
        />
      </div>
    </div>
  );
}
