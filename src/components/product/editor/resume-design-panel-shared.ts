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

export interface ResumeDesignPanelProps {
  document: ResumeDocument;
  onApplyPreset: (preset: DesignPreset) => void;
  onLayoutChange: <K extends LayoutField>(field: K, value: ResumeDocument["layout"][K]) => void;
  onTemplateChange: (template: ResumeDocument["meta"]["template"]) => void;
  onPhotoChange: <K extends PhotoField>(field: K, value: ResumeDocument["basics"][K]) => void;
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

export const colorFieldOptions: Array<{ field: LayoutField; label: string }> = [
  { field: "accentColor", label: "强调色" },
  { field: "pageBackground", label: "外层背景" },
  { field: "paperColor", label: "纸张背景" },
  { field: "textColor", label: "正文字色" },
  { field: "mutedTextColor", label: "辅助文字" },
  { field: "dividerColor", label: "分隔线" },
  { field: "linkColor", label: "链接颜色" },
];
