import type { ResumeSection } from "@/types/resume";

export type PreviewNavigateTarget =
  | { kind: "basics" }
  | { kind: "section"; sectionType: ResumeSection["type"]; itemId?: string };

export interface PreviewBuildOptions {
  highlightedTarget?: PreviewNavigateTarget;
  interactive?: boolean;
}

export function serializePreviewTarget(target: PreviewNavigateTarget) {
  return JSON.stringify(target);
}

export function isPreviewNavigateTarget(value: unknown): value is PreviewNavigateTarget {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PreviewNavigateTarget>;
  if (candidate.kind === "basics") {
    return true;
  }

  return candidate.kind === "section" && typeof candidate.sectionType === "string";
}
