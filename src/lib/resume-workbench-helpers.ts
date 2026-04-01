import type { ResumeWorkflowState } from "@/types/resume";
import type {
  ResumeWorkbenchAreaScore,
  ResumeWorkbenchTask,
  WorkbenchAreaId,
} from "@/lib/resume-workbench-types";

export function toPercent(completed: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function buildAreaScore(
  id: WorkbenchAreaId,
  label: string,
  completed: number,
  total: number,
  note: string,
) {
  return {
    id,
    label,
    score: toPercent(completed, total),
    note,
  } satisfies ResumeWorkbenchAreaScore;
}

export function resolveSuggestedWorkflowState(params: {
  score: number;
  warningCount: number;
  hasTargetingInput: boolean;
  hasRole: boolean;
  hasKeywordIntent: boolean;
}) {
  const { score, warningCount, hasTargetingInput, hasRole, hasKeywordIntent } = params;

  if (score >= 82 && warningCount === 0 && hasRole && hasKeywordIntent) {
    return "ready" satisfies ResumeWorkflowState;
  }

  if (hasTargetingInput || score >= 50) {
    return "tailoring" satisfies ResumeWorkflowState;
  }

  return "drafting" satisfies ResumeWorkflowState;
}

export function getResumeWorkbenchTaskFocusTarget(task?: ResumeWorkbenchTask | null) {
  if (!task) {
    return null;
  }

  switch (task.action.type) {
    case "focus-basics":
      return "basics";
    case "focus-summary":
      return "summary";
    case "focus-targeting":
    case "apply-suggested-keywords":
      return "targeting";
    case "focus-export":
      return "export";
    case "ensure-experience":
    case "ensure-bullet":
      return "content";
    case "set-workflow":
      return null;
    default:
      return null;
  }
}
