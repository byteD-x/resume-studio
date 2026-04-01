import type { ResumeDocument, ResumeWorkflowState } from "@/types/resume";

export type ResumeWorkbenchSource = Pick<
  ResumeDocument,
  "meta" | "basics" | "targeting" | "layout" | "sections"
>;

export type WorkbenchAreaId = "basics" | "content" | "targeting" | "export";

export const resumeWorkflowStateMeta: Record<
  ResumeWorkflowState,
  { label: string; description: string }
> = {
  drafting: {
    label: "起草中",
    description: "先补齐基础信息、摘要和核心经历，建立简历骨架。",
  },
  tailoring: {
    label: "定制中",
    description: "已经进入岗位定制阶段，正在补充 JD、关键词和版本差异。",
  },
  ready: {
    label: "待导出",
    description: "内容和版式已经接近成稿，可以进入最终检查与导出。",
  },
};

export type ResumeWorkbenchTaskAction =
  | {
      type: "focus-basics";
      label: string;
    }
  | {
      type: "focus-summary";
      label: string;
    }
  | {
      type: "focus-targeting";
      label: string;
    }
  | {
      type: "focus-export";
      label: string;
    }
  | {
      type: "ensure-experience";
      label: string;
    }
  | {
      type: "ensure-bullet";
      label: string;
    }
  | {
      type: "apply-suggested-keywords";
      label: string;
    }
  | {
      type: "set-workflow";
      label: string;
      workflowState: ResumeWorkflowState;
    };

export interface ResumeWorkbenchTask {
  id: string;
  title: string;
  detail: string;
  area: WorkbenchAreaId;
  status: "todo" | "warning";
  action: ResumeWorkbenchTaskAction;
}

export interface ResumeWorkbenchAreaScore {
  id: WorkbenchAreaId;
  label: string;
  score: number;
  note: string;
}

export interface ResumeWorkbenchReport {
  score: number;
  readiness: "starting" | "building" | "ready";
  readinessLabel: string;
  workflow: {
    currentState: ResumeWorkflowState;
    currentLabel: string;
    currentDescription: string;
    suggestedState: ResumeWorkflowState;
    suggestedLabel: string;
    suggestedDescription: string;
  };
  areaScores: ResumeWorkbenchAreaScore[];
  openTasks: ResumeWorkbenchTask[];
  stats: {
    visibleSections: number;
    totalItems: number;
    totalBullets: number;
    keywords: number;
    links: number;
  };
}
