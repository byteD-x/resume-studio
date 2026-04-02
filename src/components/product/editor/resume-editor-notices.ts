import type { ResumeEditorNotice } from "@/components/product/editor/ResumeEditorNoticeList";
import type { RecentDeletion } from "@/components/product/editor/useResumeEditorSectionActions";
import { getResumeDerivativeLabel, type ResumeLineageMeta } from "@/lib/resume-lineage";

export function buildResumeEditorNotices({
  highlightedDiagnostics,
  importReview,
  lineage,
  onFocusDiagnostic,
  onFocusImportedBasics,
  onOpenParent,
  onRestoreDeletion,
  recentDeletion,
}: {
  highlightedDiagnostics: Array<{
    id: string;
    message: string;
    target: "basics" | "summary" | "content" | "targeting" | "export";
  }>;
  importReview:
    | {
        remainingCount: number;
      }
    | null;
  lineage: ResumeLineageMeta | null;
  onFocusDiagnostic: (target: "basics" | "summary" | "content" | "targeting" | "export") => void;
  onFocusImportedBasics: () => void;
  onOpenParent: () => void;
  onRestoreDeletion: () => void;
  recentDeletion: RecentDeletion | null;
}) {
  const notices: ResumeEditorNotice[] = [];

  if (lineage) {
    notices.push({
      key: "lineage",
      badge: "版本关系",
      tone: "accent",
      message:
        lineage.kind === "variant"
          ? `当前正在编辑一份${getResumeDerivativeLabel(lineage.derivativeKind)}`
          : lineage.kind === "source"
            ? "当前正在编辑一份主稿"
            : "当前是一份独立草稿",
      actionLabel: lineage.parentId ? "查看来源" : undefined,
      onAction: lineage.parentId ? onOpenParent : undefined,
    });
  }

  if (importReview) {
    notices.push({
      key: "import-review",
      badge: "导入校对",
      tone: "accent",
      message: importReview.remainingCount > 0 ? `还有 ${importReview.remainingCount} 个待校对项` : "首轮导入已完成",
      actionLabel: "去核对",
      onAction: onFocusImportedBasics,
    });
  } else if (highlightedDiagnostics.length > 0) {
    const [diagnostic] = highlightedDiagnostics;
    notices.push({
      key: diagnostic.id,
      badge: "提醒",
      tone: "warning",
      message: diagnostic.message,
      actionLabel: "去处理",
      onAction: () => onFocusDiagnostic(diagnostic.target),
    });
  }

  if (recentDeletion) {
    notices.push({
      key: `recent-deletion-${recentDeletion.item.id}`,
      badge: "已删除",
      tone: "neutral",
      message: recentDeletion.item.title || recentDeletion.sectionTitle,
      actionLabel: "恢复",
      onAction: onRestoreDeletion,
    });
  }

  return notices;
}
