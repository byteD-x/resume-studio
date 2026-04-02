import type { ResumeDerivativeKind } from "@/lib/resume-lineage";
import { buildOptimizedResumeLayout, type ResumeOptimizationGoal } from "@/lib/resume-layout";
import { nowIso } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";

export function mergeDerivedSourceRefs(
  sourceRefs: string[],
  parentId: string,
  derivativeKind: ResumeDerivativeKind,
) {
  const preserved = sourceRefs.filter(
    (entry) => !entry.startsWith("resume:") && !entry.startsWith("variant:"),
  );

  return Array.from(new Set([...preserved, `resume:${parentId}`, `variant:${derivativeKind}`]));
}

export function getResumeOptimizationGoalLabel(goal: ResumeOptimizationGoal) {
  return goal === "one-page" ? "一页优化版" : "两页优化版";
}

export function buildOptimizedResumeTitle(
  sourceDocument: ResumeDocument,
  goal: ResumeOptimizationGoal = "two-page",
) {
  return `${sourceDocument.meta.title} · ${getResumeOptimizationGoalLabel(goal)}`;
}

export function applyResumeOptimization(
  sourceDocument: ResumeDocument,
  goal: ResumeOptimizationGoal,
) {
  return {
    ...sourceDocument,
    layout: buildOptimizedResumeLayout(sourceDocument, goal),
    sections: sourceDocument.sections.map((section) => ({
      ...section,
      layout: section.type === "skills" ? "tag-grid" : section.layout,
    })),
  } satisfies ResumeDocument;
}

export function buildOptimizedResumeChecklist(goal: ResumeOptimizationGoal) {
  return [
    `${getResumeOptimizationGoalLabel(goal)}已从当前原稿派生，请在这个版本里继续压缩，不要直接改原稿。`,
    "优先把重复项目合并回对应工作经历，再保留 2-4 个最值得单独展开的代表项目。",
    "把重复出现的技术栈移到标签或补充信息里，不要在每条要点里重复展开。",
    goal === "one-page"
      ? "一页目标会更激进地压缩排版，请优先检查右侧预览是否已经接近一页。"
      : "两页目标优先保证信息层级，再检查第二页是否只承担补充作用。",
  ];
}

export function createOptimizedResumeDocument(
  sourceDocument: ResumeDocument,
  input: {
    nextId: string;
    nextTitle?: string;
    goal?: ResumeOptimizationGoal;
  },
) {
  const goal = input.goal ?? "two-page";
  const nextTitle = input.nextTitle?.trim() || buildOptimizedResumeTitle(sourceDocument, goal);
  const optimized = applyResumeOptimization(sourceDocument, goal);

  return {
    ...optimized,
    meta: {
      ...sourceDocument.meta,
      id: input.nextId,
      title: nextTitle,
      workflowState: "drafting",
      updatedAt: nowIso(),
      sourceRefs: mergeDerivedSourceRefs(sourceDocument.meta.sourceRefs, sourceDocument.meta.id, "optimized"),
    },
    importTrace: {
      ...sourceDocument.importTrace,
      pendingReview: Array.from(
        new Set([...sourceDocument.importTrace.pendingReview, ...buildOptimizedResumeChecklist(goal)]),
      ),
    },
  } satisfies ResumeDocument;
}
