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
        reviewTaskCount: number;
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
      badge: "版本",
      tone: "accent",
      message:
        lineage.kind === "variant"
          ? getResumeDerivativeLabel(lineage.derivativeKind)
          : lineage.kind === "source"
            ? "源简历"
            : "草稿",
      actionLabel: lineage.parentId ? "来源" : undefined,
      onAction: lineage.parentId ? onOpenParent : undefined,
    });
  }

  if (importReview) {
    notices.push({
      key: "import-review",
      badge: "校对",
      tone: "accent",
      message:
        importReview.remainingCount > 0
          ? `待校对 ${importReview.remainingCount}`
          : importReview.reviewTaskCount > 0
            ? "继续校对"
            : "已完成",
      actionLabel: "查看",
      onAction: onFocusImportedBasics,
    });
  } else if (highlightedDiagnostics.length > 0) {
    const [diagnostic] = highlightedDiagnostics;
    notices.push({
      key: diagnostic.id,
      badge: "提醒",
      tone: "warning",
      message: diagnostic.message,
      actionLabel: "处理",
      onAction: () => onFocusDiagnostic(diagnostic.target),
    });
  }

  if (recentDeletion) {
    notices.push({
      key: `recent-deletion-${recentDeletion.item.id}`,
      badge: "删除",
      tone: "neutral",
      message: recentDeletion.item.title || recentDeletion.sectionTitle,
      actionLabel: "恢复",
      onAction: onRestoreDeletion,
    });
  }

  return notices;
}
