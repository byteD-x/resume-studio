import type { Route } from "next";
import type { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";
import type { buildResumeWorkbenchReport } from "@/lib/resume-workbench";
import type { analyzeResumeTargeting } from "@/lib/resume-targeting";

export type PreviewChecklistItem = ReturnType<typeof buildResumeExportChecklist>[number];
export type PreviewQualityReport = ReturnType<typeof buildResumeQualityReport>;
export type PreviewWorkbenchReport = ReturnType<typeof buildResumeWorkbenchReport>;
export type PreviewTargetingAnalysis = ReturnType<typeof analyzeResumeTargeting>;

export function buildEditorFocusHref(
  documentId: string,
  target: "basics" | "summary" | "content" | "targeting" | "export",
): Route {
  switch (target) {
    case "targeting":
      return `/studio/${documentId}?focus=targeting` as Route;
    case "content":
      return `/studio/${documentId}?focus=content` as Route;
    case "export":
      return `/studio/${documentId}?focus=design` as Route;
    case "summary":
    case "basics":
    default:
      return `/studio/${documentId}?focus=summary` as Route;
  }
}

export function buildLineageCopy(lineage: ResumeLineageMeta) {
  if (lineage.parentTitle) {
    return `这份版本来自「${lineage.parentTitle}」，导出前请确认它就是这次要使用的岗位版本。`;
  }

  if (lineage.childCount > 0) {
    return "这份主稿已经派生出多个版本，导出前请确认当前是否仍应作为统一主稿保存。";
  }

  return "这是一份独立草稿，如果后续还要面向不同岗位生成版本，可以回到编辑器继续定向。";
}
