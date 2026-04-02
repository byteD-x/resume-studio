"use client";

import { useMemo, useState } from "react";
import { useRouteWarmup } from "@/components/product/useRouteWarmup";
import { ResumeLibraryDetailPanel } from "@/components/product/resume-library/ResumeLibraryDetailPanel";
import { ResumeLibraryEmptyState } from "@/components/product/resume-library/ResumeLibraryEmptyState";
import { ResumeLibraryHeader } from "@/components/product/resume-library/ResumeLibraryHeader";
import { ResumeLibraryMasterList } from "@/components/product/resume-library/ResumeLibraryMasterList";
import { buildRowData, buildVersionGroups } from "@/components/product/resume-library/utils";
import { useResumeLibraryActions } from "@/components/product/resume-library/useResumeLibraryActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

export function ResumeLibraryPage({
  resumes,
}: {
  resumes: ResumeDashboardSummary[];
}) {
  const rows = useMemo(() => buildRowData(resumes), [resumes]);
  const versionGroups = useMemo(() => buildVersionGroups(rows), [rows]);
  const latestResume = versionGroups[0]?.allRows[0] ?? null;
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(versionGroups[0]?.id ?? null);
  const {
    activeDeleteId,
    confirmation,
    generatingInProgress,
    optimizingInProgress,
    pendingKey,
    generateOptimizedVersion,
    requestDeleteResume,
    generateTailoredVariant,
    setConfirmation,
    status,
  } = useResumeLibraryActions(resumes.length);

  const resolvedSelectedGroupId =
    selectedGroupId && versionGroups.some((group) => group.id === selectedGroupId)
      ? selectedGroupId
      : versionGroups[0]?.id ?? null;
  const selectedGroup =
    versionGroups.find((group) => group.id === resolvedSelectedGroupId) ?? versionGroups[0] ?? null;
  const deletingSourceInSelectedGroup =
    selectedGroup !== null && activeDeleteId === selectedGroup.sourceRow.resume.meta.id;

  useRouteWarmup({
    includeLastResume: true,
    resumeId: latestResume?.resume.meta.id ?? selectedGroup?.sourceRow.resume.meta.id ?? null,
    routes: ["/templates", "/import"],
  });

  return (
    <main className="page-wrap">
      <ResumeLibraryHeader latestResume={latestResume} />

      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      {versionGroups.length > 0 ? (
        <section className="library-master-detail">
          <ResumeLibraryMasterList
            activeDeleteId={activeDeleteId}
            selectedGroupId={resolvedSelectedGroupId}
            versionGroups={versionGroups}
            onSelectGroup={setSelectedGroupId}
          />

          {selectedGroup ? (
            <ResumeLibraryDetailPanel
              activeDeleteId={activeDeleteId}
              deletingSourceInSelectedGroup={deletingSourceInSelectedGroup}
              generatingInProgress={generatingInProgress}
              optimizingInProgress={optimizingInProgress}
              pendingKey={pendingKey}
              selectedGroup={selectedGroup}
              onGenerateOptimizedVersion={generateOptimizedVersion}
              onGenerateTailoredVariant={generateTailoredVariant}
              onRequestDeleteResume={requestDeleteResume}
            />
          ) : null}
        </section>
      ) : (
        <ResumeLibraryEmptyState />
      )}

      <ConfirmDialog
        cancelLabel="取消"
        confirmLabel={confirmation?.confirmLabel}
        confirmVariant="danger"
        description={confirmation?.description}
        onClose={() => setConfirmation(null)}
        onConfirm={() => void confirmation?.onConfirm()}
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "确认删除"}
      />
    </main>
  );
}
