"use client";

import { Button } from "@/components/ui/Button";
import { getResumeOptimizationGoalLabel } from "@/lib/resume-derivatives";
import type { ResumeDesignPanelProps } from "@/components/product/editor/resume-design-panel-shared";
import {
  optimizationGoalOptions,
  optimizationTargetOptions,
} from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignOptimizationSection({
  isCreatingOptimizedVersion,
  isOptimizationPreviewActive,
  optimizationGoal,
  optimizationTarget,
  onApplyCurrentOptimization,
  onDeriveOptimizedDocument,
  onOptimizationGoalChange,
  onOptimizationTargetChange,
  onPreviewOptimization,
  onRestoreOptimizationPreview,
}: Pick<
  ResumeDesignPanelProps,
  | "isCreatingOptimizedVersion"
  | "isOptimizationPreviewActive"
  | "optimizationGoal"
  | "optimizationTarget"
  | "onApplyCurrentOptimization"
  | "onDeriveOptimizedDocument"
  | "onOptimizationGoalChange"
  | "onOptimizationTargetChange"
  | "onPreviewOptimization"
  | "onRestoreOptimizationPreview"
>) {
  const goalLabel = getResumeOptimizationGoalLabel(optimizationGoal);

  return (
    <div className="resume-editor-group">
      <div className="resume-editor-group-head">
        <h3>页数优化</h3>
      </div>

      <div className="editor-preset-grid">
        {optimizationGoalOptions.map((option) => (
          <button
            aria-pressed={optimizationGoal === option.value}
            className={`editor-preset-card ${optimizationGoal === option.value ? "editor-preset-card-active" : ""}`}
            key={option.value}
            onClick={() => onOptimizationGoalChange(option.value)}
            type="button"
          >
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <div className="resume-editor-group resume-editor-group-compact">
        <div className="resume-editor-source-toolbar">
          {optimizationTargetOptions.map((option) => (
            <button
              aria-pressed={optimizationTarget === option.value}
              className={`editor-source-chip ${optimizationTarget === option.value ? "editor-source-chip-active" : ""}`}
              key={option.value}
              onClick={() => onOptimizationTargetChange(option.value)}
              type="button"
            >
              {option.title}
            </button>
          ))}
        </div>
      </div>

      <div className="resume-editor-source-banner">
        <strong>{isOptimizationPreviewActive ? `${goalLabel}预览中` : goalLabel}</strong>

        <div className="resume-editor-source-toolbar">
          {isOptimizationPreviewActive ? (
            <>
              <Button
                disabled={isCreatingOptimizedVersion}
                onClick={onApplyCurrentOptimization}
                variant={optimizationTarget === "current" ? "primary" : "secondary"}
              >
                应用到当前文稿
              </Button>
              <Button
                disabled={isCreatingOptimizedVersion}
                onClick={() => void onDeriveOptimizedDocument()}
                variant={optimizationTarget === "derived" ? "primary" : "secondary"}
              >
                {isCreatingOptimizedVersion ? "正在派生…" : "派生新文稿"}
              </Button>
              <Button onClick={onRestoreOptimizationPreview} variant="ghost">
                还原
              </Button>
            </>
          ) : (
            <Button onClick={onPreviewOptimization}>预览</Button>
          )}
        </div>
      </div>
    </div>
  );
}
