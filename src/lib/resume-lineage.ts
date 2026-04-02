import type { ResumeDocument } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

type ResumeLineageSource = Pick<ResumeDocument, "meta"> | Pick<ResumeDashboardSummary, "meta">;

export type ResumeDerivativeKind = "tailored" | "optimized";

export interface ResumeLineageMeta {
  kind: "standalone" | "source" | "variant";
  derivativeKind: ResumeDerivativeKind | null;
  parentId: string | null;
  parentTitle: string | null;
  childIds: string[];
  childTitles: string[];
  childCount: number;
  groupId: string;
}

function extractParentId(sourceRefs: string[]) {
  const ref = [...sourceRefs].reverse().find((entry) => entry.startsWith("resume:"));
  return ref ? ref.slice("resume:".length) : null;
}

function extractDerivativeKind(sourceRefs: string[]): ResumeDerivativeKind | null {
  const ref = [...sourceRefs].reverse().find((entry) => entry.startsWith("variant:"));
  if (ref === "variant:optimized") {
    return "optimized";
  }

  if (ref === "variant:tailored") {
    return "tailored";
  }

  return extractParentId(sourceRefs) ? "tailored" : null;
}

export function getResumeDerivativeLabel(kind: ResumeDerivativeKind | null) {
  return kind === "optimized" ? "优化版" : "定制版";
}

export function buildResumeLineageMap<T extends ResumeLineageSource>(items: T[]) {
  const itemsById = new Map(items.map((item) => [item.meta.id, item] as const));
  const childMap = new Map<string, string[]>();

  for (const item of items) {
    const parentId = extractParentId(item.meta.sourceRefs);
    if (!parentId) continue;

    const children = childMap.get(parentId) ?? [];
    children.push(item.meta.id);
    childMap.set(parentId, children);
  }

  return new Map(
    items.map((item) => {
      const parentId = extractParentId(item.meta.sourceRefs);
      const childIds = childMap.get(item.meta.id) ?? [];
      const parentTitle = parentId ? itemsById.get(parentId)?.meta.title ?? null : null;
      const childTitles = childIds
        .map((id) => itemsById.get(id)?.meta.title)
        .filter((title): title is string => Boolean(title));

      const meta: ResumeLineageMeta = {
        kind: parentId ? "variant" : childIds.length > 0 ? "source" : "standalone",
        derivativeKind: parentId ? extractDerivativeKind(item.meta.sourceRefs) : null,
        parentId,
        parentTitle,
        childIds,
        childTitles,
        childCount: childIds.length,
        groupId: parentId ?? item.meta.id,
      };

      return [item.meta.id, meta] as const;
    }),
  );
}

export function getResumeLineageMeta<T extends ResumeLineageSource>(item: T, items: T[]) {
  return buildResumeLineageMap(items).get(item.meta.id) ?? null;
}
