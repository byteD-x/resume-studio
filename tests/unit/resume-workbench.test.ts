import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument, createGuidedResumeDocument } from "@/lib/resume-document";
import { buildResumeWorkbenchReport } from "@/lib/resume-workbench";

describe("resume workbench", () => {
  it("identifies missing basics and targeting steps on a sparse draft", () => {
    const document = createEmptyResumeDocument("draft", "初稿");
    const report = buildResumeWorkbenchReport(document);

    expect(report.score).toBeLessThan(50);
    expect(report.workflow.currentState).toBe("drafting");
    expect(report.workflow.suggestedState).toBe("drafting");
    expect(report.openTasks.some((task) => task.id === "complete-header")).toBe(true);
    expect(report.openTasks.some((task) => task.id === "set-role")).toBe(true);
    expect(
      report.openTasks.find((task) => task.id === "complete-header")?.action.type,
    ).toBe("focus-basics");
  });

  it("raises readiness for a guided draft with completed core fields", () => {
    const document = createGuidedResumeDocument("guided", "引导草稿");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Staff Frontend Engineer";
    document.basics.email = "jane@example.com";
    document.basics.phone = "123456";
    document.basics.links = [{ label: "GitHub", url: "https://github.com/jane" }];
    document.targeting.role = "Staff Frontend Engineer";
    document.targeting.company = "Acme";
    document.targeting.focusKeywords = ["React", "Next.js"];
    document.targeting.jobDescription = "Looking for React and Next.js experience.";

    const report = buildResumeWorkbenchReport(document);

    expect(report.score).toBeGreaterThanOrEqual(60);
    expect(report.workflow.suggestedState).toBe("ready");
    expect(report.areaScores.find((item) => item.id === "basics")?.score).toBeGreaterThan(60);
    expect(report.areaScores.find((item) => item.id === "content")?.score).toBeGreaterThan(60);
  });

  it("adds a workflow transition task when the current state lags behind", () => {
    const document = createGuidedResumeDocument("ready", "成稿");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Staff Frontend Engineer";
    document.basics.email = "jane@example.com";
    document.basics.phone = "123456";
    document.basics.links = [{ label: "GitHub", url: "https://github.com/jane" }];
    document.targeting.role = "Staff Frontend Engineer";
    document.targeting.company = "Acme";
    document.targeting.focusKeywords = ["React", "Next.js"];
    document.targeting.jobDescription = "Looking for React and Next.js experience.";

    const report = buildResumeWorkbenchReport(document);
    const workflowTask = report.openTasks.find((task) => task.action.type === "set-workflow");

    expect(report.workflow.currentState).toBe("drafting");
    expect(report.workflow.suggestedState).toBe("ready");
    expect(workflowTask?.action.type).toBe("set-workflow");
    expect(
      workflowTask?.action.type === "set-workflow"
        ? workflowTask.action.workflowState
        : null,
    ).toBe("ready");
  });
});
