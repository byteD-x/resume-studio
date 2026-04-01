"use client";

import { quickPresets, type DesignPreset } from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignPresetSection({
  onApplyPreset,
}: {
  onApplyPreset: (preset: DesignPreset) => void;
}) {
  return (
    <div className="resume-editor-group">
      <div className="resume-editor-group-head">
        <h3>快速风格</h3>
      </div>
      <div className="editor-preset-grid">
        {quickPresets.map((preset) => (
          <button
            className="editor-preset-card"
            key={preset.id}
            onClick={() => onApplyPreset(preset.id)}
            type="button"
          >
            <strong>{preset.title}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
