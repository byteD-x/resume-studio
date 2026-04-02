import type { Route } from "next";
import type { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import type { analyzeResumeTargeting } from "@/lib/resume-targeting";
import type { buildResumeWorkbenchReport } from "@/lib/resume-workbench";

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
