import { hasResumeRenderableContent } from "@/lib/resume-content";
import {
  buildResumeImportReviewTasks,
  getActiveImportFieldSuggestions,
  getActiveImportSnapshots,
  getActivePendingReviewItems,
  getActiveUnmappedItems,
} from "@/lib/resume-import-review";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeEditorImportReviewKind } from "@/components/product/editor/workspace/types";

export type ResumeEditorImportReview = NonNullable<ReturnType<typeof buildImportReview>>;

export function resolveLatestImportKind(document: ResumeDocument): ResumeEditorImportReviewKind | null {
  const { pdfImportedAt, portfolioImportedAt } = document.importTrace;

  if (pdfImportedAt && portfolioImportedAt) {
    return portfolioImportedAt > pdfImportedAt ? "portfolio" : "pdf";
  }

  if (portfolioImportedAt) {
    return "portfolio";
  }

  if (pdfImportedAt) {
    return "pdf";
  }

  return null;
}

function resolveImportSourcePath(document: ResumeDocument) {
  return document.meta.sourceRefs.find((entry) => /[\\/]/.test(entry)) ?? null;
}

export function resolveImportStatusMessage(kind: ResumeEditorImportReviewKind) {
  if (kind === "pdf") {
    return "先核对 PDF 导入结果。";
  }

  return "先核对作品集导入结果。";
}

export function buildImportReview(document: ResumeDocument) {
  const kind = resolveLatestImportKind(document);
  if (!kind) {
    return null;
  }

  const pendingItems = getActivePendingReviewItems(document);
  const snapshots = getActiveImportSnapshots(document);
  const fieldSuggestions = getActiveImportFieldSuggestions(document);
  const unmappedItems = getActiveUnmappedItems(document);
  const basicsCount = [
    document.basics.name,
    document.basics.headline,
    document.basics.email,
    document.basics.phone,
    document.basics.website,
  ].filter((value) => value.trim()).length;
  const experienceCount = document.sections
    .filter((section) => section.type === "experience")
    .reduce((sum, section) => sum + section.items.length, 0);
  const projectCount = document.sections
    .filter((section) => section.type === "projects")
    .reduce((sum, section) => sum + section.items.length, 0);
  const educationCount = document.sections
    .filter((section) => section.type === "education")
    .reduce((sum, section) => sum + section.items.length, 0);
  const skillsCount = document.sections
    .filter((section) => section.type === "skills")
    .reduce((sum, section) => sum + section.items.length, 0);
  const reviewTasks = buildResumeImportReviewTasks(document);
  const remainingCount =
    pendingItems.length +
    snapshots.length +
    fieldSuggestions.length +
    unmappedItems.length;

  return {
    kind,
    title: kind === "pdf" ? "PDF 导入已完成" : "作品集导入已完成",
    description:
      kind === "pdf" ? "先核对抬头、章节归类和待办项。" : "先核对基础信息、经历映射和待办项。",
    primaryActionLabel: "核对基本信息",
    secondaryActionLabel: "核对内容",
    pendingItems,
    pendingItemsPreview: pendingItems.slice(0, 3),
    pendingItemCount: pendingItems.length,
    reviewTaskCount: reviewTasks.length,
    snapshotCount: snapshots.length,
    fieldSuggestionCount: fieldSuggestions.length,
    unmappedItemCount: unmappedItems.length,
    remainingCount,
    sourcePath: kind === "portfolio" ? resolveImportSourcePath(document) : null,
    mappedStats: [
      { label: "基础信息", value: basicsCount },
      { label: "工作经历", value: experienceCount },
      { label: "项目经历", value: projectCount },
      { label: "教育 / 技能", value: educationCount + skillsCount },
    ],
    reviewTasks,
    fieldSuggestions: fieldSuggestions.slice(0, 3),
    snapshots: snapshots.slice(0, 3),
    unmappedItems: unmappedItems.slice(0, 3),
  };
}

export function resolveInitialStatusMessage(
  document: ResumeDocument,
  focus: string | null,
  onboarding: string | null,
) {
  const importedKind = resolveLatestImportKind(document);
  if (importedKind) {
    return resolveImportStatusMessage(importedKind);
  }

  if (onboarding === "pdf") {
    return "先核对 PDF 导入结果。";
  }

  if (onboarding === "portfolio") {
    return "先核对作品集导入结果。";
  }

  if (onboarding === "template") {
    return "先把模板示例替换成你的真实信息。";
  }

  if (onboarding === "guided") {
    return "先补齐基础信息，再逐步添加内容。";
  }

  if (focus === "summary") {
    return "先补摘要。";
  }

  if (focus === "targeting") {
    return "先定岗位和关键词。";
  }

  if (focus === "design") {
    return "先调整版式和外观。";
  }

  if (focus === "ai") {
    return "先看 AI 分析和定制版计划。";
  }

  if (focus === "content") {
    return "先补经历和结果。";
  }

  return hasResumeRenderableContent(document) ? "继续编辑" : "开始填写";
}
