import type { Route } from "next";
import type { LibraryRow, VersionGroup } from "@/components/product/resume-library/types";
import { hasResumeRenderableContent } from "@/lib/resume-content";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { buildTailoredVariantPlan } from "@/lib/resume-tailoring";
import { buildResumeWorkbenchReport, getResumeWorkbenchTaskFocusTarget } from "@/lib/resume-workbench";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export async function getJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function buildRowData(resumes: ResumeDashboardSummary[]) {
  const sortedResumes = [...resumes].sort(
    (left, right) => new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  );
  const lineageMap = buildResumeLineageMap(sortedResumes);

  return sortedResumes.map((resume) => {
    const report = buildResumeWorkbenchReport(resume);
    const tailoredPlan = buildTailoredVariantPlan(resume as ResumeDocument);
    const nextTaskFocus = getResumeWorkbenchTaskFocusTarget(report.openTasks[0] ?? null);
    const studioHref = (
      nextTaskFocus
        ? `/studio/${resume.meta.id}?focus=${nextTaskFocus}`
        : `/studio/${resume.meta.id}`
    ) as Route;

    return {
      resume,
      report,
      tailoredPlan,
      lineage: lineageMap.get(resume.meta.id) ?? null,
      studioHref,
      targetingHref: `/studio/${resume.meta.id}?focus=targeting` as Route,
      previewHref: `/studio/${resume.meta.id}/preview` as Route,
      hasContent: hasResumeRenderableContent(resume),
    } satisfies LibraryRow;
  });
}

export function buildVersionGroups(rows: LibraryRow[]) {
  const grouped = new Map<string, LibraryRow[]>();

  for (const row of rows) {
    const groupId = row.lineage?.groupId ?? row.resume.meta.id;
    const bucket = grouped.get(groupId) ?? [];
    bucket.push(row);
    grouped.set(groupId, bucket);
  }

  return [...grouped.entries()]
    .map(([groupId, groupRows]) => {
      const sortedRows = [...groupRows].sort((left, right) => {
        const leftIsSource = (left.lineage?.parentId ?? null) === null ? 1 : 0;
        const rightIsSource = (right.lineage?.parentId ?? null) === null ? 1 : 0;

        if (leftIsSource !== rightIsSource) {
          return rightIsSource - leftIsSource;
        }

        return new Date(right.resume.meta.updatedAt).getTime() - new Date(left.resume.meta.updatedAt).getTime();
      });

      const sourceRow = sortedRows.find((row) => (row.lineage?.parentId ?? null) === null) ?? sortedRows[0];
      const variantRows = sortedRows.filter((row) => row.resume.meta.id !== sourceRow.resume.meta.id);

      return {
        id: groupId,
        sourceRow,
        variantRows,
        allRows: sortedRows,
        latestUpdatedAt: Math.max(...sortedRows.map((row) => new Date(row.resume.meta.updatedAt).getTime())),
      } satisfies VersionGroup;
    })
    .sort((left, right) => right.latestUpdatedAt - left.latestUpdatedAt);
}

export function getGroupKindLabel(row: LibraryRow) {
  if (row.lineage?.kind === "source") return "主稿";
  if (row.lineage?.kind === "variant") return "定制版";
  return "独立简历";
}
