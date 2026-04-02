"use client";

import type { Route } from "next";
import type { buildTailoredVariantPlan } from "@/lib/resume-tailoring";
import type { buildResumeWorkbenchReport } from "@/lib/resume-workbench";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

export interface PendingLibraryConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
}

export type DeleteScope = "single" | "lineage";

export interface LibraryRow {
  resume: ResumeDashboardSummary;
  report: ReturnType<typeof buildResumeWorkbenchReport>;
  tailoredPlan: ReturnType<typeof buildTailoredVariantPlan>;
  lineage: ResumeLineageMeta | null;
  studioHref: Route;
  targetingHref: Route;
  previewHref: Route;
  hasContent: boolean;
}

export interface VersionGroup {
  id: string;
  sourceRow: LibraryRow;
  variantRows: LibraryRow[];
  allRows: LibraryRow[];
  latestUpdatedAt: number;
}

export interface TailoredVariantResponse {
  document: ResumeDocument;
  plan: ReturnType<typeof buildTailoredVariantPlan>;
  remoteSummaryApplied?: boolean;
  remoteSummaryError?: string | null;
}

export interface OptimizedVariantResponse {
  document: ResumeDocument;
  checklist: string[];
}
