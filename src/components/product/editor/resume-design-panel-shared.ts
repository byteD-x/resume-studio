import type { ResumeOptimizationGoal } from "@/lib/resume-layout";
import type { ResumeDocument } from "@/types/resume";

export type LayoutField = keyof ResumeDocument["layout"];
export type PhotoField =
  | "photoUrl"
  | "photoAlt"
  | "photoVisible"
  | "photoShape"
  | "photoPosition"
  | "photoSizeMm";
export type DesignPreset = "balanced" | "compact" | "editorial";
export type OptimizationTarget = "current" | "derived";

export interface ResumeDesignPanelProps {
  document: ResumeDocument;
  isCreatingOptimizedVersion: boolean;
  isOptimizationPreviewActive: boolean;
  optimizationGoal: ResumeOptimizationGoal;
  optimizationTarget: OptimizationTarget;
  onApplyCurrentOptimization: () => void;
  onApplyPreset: (preset: DesignPreset) => void;
  onDeriveOptimizedDocument: () => void | Promise<void>;
  onLayoutChange: <K extends LayoutField>(field: K, value: ResumeDocument["layout"][K]) => void;
  onOptimizationGoalChange: (goal: ResumeOptimizationGoal) => void;
  onOptimizationTargetChange: (target: OptimizationTarget) => void;
  onPhotoChange: <K extends PhotoField>(field: K, value: ResumeDocument["basics"][K]) => void;
  onPreviewOptimization: () => void;
  onRestoreOptimizationPreview: () => void;
  onTemplateChange: (template: ResumeDocument["meta"]["template"]) => void;
}

export function numberValue(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const quickPresets: Array<{
  id: DesignPreset;
  title: string;
  description: string;
}> = [
  {
    id: "balanced",
    title: "平衡排版",
    description: "适合大多数简历，信息密度和留白更均衡。",
  },
  {
    id: "compact",
    title: "紧凑一页",
    description: "压缩字号和间距，更容易把内容收进一页。",
  },
  {
    id: "editorial",
    title: "作品集感",
    description: "更大的标题和更明显的层级，适合有展示感的内容。",
  },
];

export const optimizationGoalOptions: Array<{
  value: ResumeOptimizationGoal;
  title: string;
  description: string;
}> = [
  {
    value: "one-page",
    title: "一页优化",
    description: "更紧凑，优先收进一页。",
  },
  {
    value: "two-page",
    title: "两页优化",
    description: "更稳妥，控制在两页左右。",
  },
];

export const optimizationTargetOptions: Array<{
  value: OptimizationTarget;
  title: string;
  description: string;
}> = [
  {
    value: "current",
    title: "作用到当前文稿",
    description: "直接改当前文稿。",
  },
  {
    value: "derived",
    title: "派生新文稿",
    description: "保留原稿，另存一份。",
  },
];

export const colorFieldOptions: Array<{ field: LayoutField; label: string }> = [
  { field: "accentColor", label: "强调色" },
  { field: "pageBackground", label: "外层背景" },
  { field: "paperColor", label: "纸张背景" },
  { field: "textColor", label: "正文文字" },
  { field: "mutedTextColor", label: "辅助文字" },
  { field: "dividerColor", label: "分隔线" },
  { field: "linkColor", label: "链接颜色" },
];
