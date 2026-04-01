"use client";

import { ResumeDesignColorSection } from "@/components/product/editor/ResumeDesignColorSection";
import { ResumeDesignCustomCssSection } from "@/components/product/editor/ResumeDesignCustomCssSection";
import { ResumeDesignLayoutSection } from "@/components/product/editor/ResumeDesignLayoutSection";
import { ResumeDesignPhotoSection } from "@/components/product/editor/ResumeDesignPhotoSection";
import { ResumeDesignPresetSection } from "@/components/product/editor/ResumeDesignPresetSection";
import { ResumeDesignTypographySection } from "@/components/product/editor/ResumeDesignTypographySection";
import type { ResumeDesignPanelProps } from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignPanel(props: ResumeDesignPanelProps) {
  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <h2 className="resume-editor-panel-title">版式与模板</h2>
        </div>
      </div>

      <ResumeDesignPresetSection onApplyPreset={props.onApplyPreset} />
      <ResumeDesignLayoutSection
        document={props.document}
        onLayoutChange={props.onLayoutChange}
        onTemplateChange={props.onTemplateChange}
      />
      <ResumeDesignTypographySection document={props.document} onLayoutChange={props.onLayoutChange} />
      <ResumeDesignColorSection document={props.document} onLayoutChange={props.onLayoutChange} />
      <ResumeDesignPhotoSection document={props.document} onPhotoChange={props.onPhotoChange} />
      <ResumeDesignCustomCssSection document={props.document} onLayoutChange={props.onLayoutChange} />
    </section>
  );
}
