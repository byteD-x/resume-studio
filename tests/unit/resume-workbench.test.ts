import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument, createGuidedResumeDocument } from "@/lib/resume-document";
import { buildResumeWorkbenchReport } from "@/lib/resume-workbench";

describe("resume workbench", () => {
  function fillCoreResumeContent(document: ReturnType<typeof createGuidedResumeDocument>) {
    document.basics.summaryHtml =
      "<p>资深前端工程师，负责复杂产品前台、设计系统和增长实验，持续推动性能、交付效率和体验质量提升。</p>";
    const experienceSection = document.sections.find((section) => section.type === "experience");
    if (experienceSection) {
      experienceSection.items = [
        {
          id: "exp-1",
          title: "Acme",
          subtitle: "Staff Frontend Engineer",
          location: "Shanghai",
          dateRange: "2023 - 至今",
          meta: "React · Next.js",
          summaryHtml: "",
          bulletPoints: [
            "负责核心增长工作台改版，关键流程转化率提升 18%。",
            "推动设计系统重构，跨团队复用效率提升 30%。",
            "建立发布质量检查链路，线上回归问题减少 25%。",
            "与产品和运营协作，缩短实验上线周期 40%。",
          ],
          tags: ["React", "Next.js"],
        },
      ];
    }
  }

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
    fillCoreResumeContent(document);

    const report = buildResumeWorkbenchReport(document);

    expect(report.score).toBeGreaterThanOrEqual(60);
    expect(report.workflow.suggestedState).toBe("ready");
    expect(report.areaScores.find((item) => item.id === "basics")?.score).toBeGreaterThan(60);
    expect(report.areaScores.find((item) => item.id === "content")?.score).toBeGreaterThanOrEqual(60);
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
    fillCoreResumeContent(document);

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
