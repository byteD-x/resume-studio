import type { ResumeDocument } from "@/types/resume";

export interface ResumeDashboardSummary {
  meta: ResumeDocument["meta"];
  basics: ResumeDocument["basics"];
  targeting: ResumeDocument["targeting"];
  layout: ResumeDocument["layout"];
  sections: ResumeDocument["sections"];
}
