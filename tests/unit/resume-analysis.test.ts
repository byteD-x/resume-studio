import { describe, expect, it } from "vitest";
import {
  analyzeResumeDocument,
  buildResumeExportChecklist,
  buildResumeQualityReport,
} from "@/lib/resume-analysis";
import { createEmptyResumeDocument, createGuidedResumeDocument } from "@/lib/resume-document";

describe("resume analysis", () => {
  it("flags overly dense resumes", () => {
    const document = createEmptyResumeDocument("dense", "Dense Resume");
    document.basics.summaryHtml = `<p>${"Long summary ".repeat(40)}</p>`;
    document.layout.marginsMm = 9;
    document.basics.links = [];
    document.sections = [
      ...document.sections,
      ...document.sections.map((section, index) => ({
        ...section,
        id: `${section.id}-${index}`,
      })),
    ];

    const diagnostics = analyzeResumeDocument(document);

    expect(diagnostics.some((item) => item.id === "long-summary")).toBe(true);
    expect(diagnostics.some((item) => item.id === "tight-margins")).toBe(true);
  });

  it("builds structured quality report with blocking issues", () => {
    const document = createEmptyResumeDocument("campus", "Campus Resume", {
      writerProfile: "campus",
    });
    document.basics.summaryHtml = "<p>短</p>";

    const report = buildResumeQualityReport(document);

    expect(report.blockingIssues.some((item) => item.id === "missing-header")).toBe(true);
    expect(report.blockingIssues.some((item) => item.id === "weak-contact")).toBe(true);
    expect(report.blockingIssues.some((item) => item.id === "short-summary")).toBe(true);
    expect(report.blockingIssues.some((item) => item.id === "missing-core-content")).toBe(true);
  });

  it("uses profile-aware checklist rules", () => {
    const document = createGuidedResumeDocument("campus", "Campus Resume", "campus");
    document.basics.name = "Jane Doe";
    document.basics.headline = "产品运营实习生";
    document.basics.email = "jane@example.com";
    document.basics.phone = "123456";
    document.basics.summaryHtml = "<p>应届生，关注产品运营与内容增长，做过校园项目并拿到可量化结果。</p>";

    const report = buildResumeQualityReport(document);
    const checklist = buildResumeExportChecklist(document, report);

    expect(report.blockingIssues.some((item) => item.id === "missing-core-content")).toBe(false);
    expect(checklist.find((item) => item.id === "summary")?.done).toBe(true);
    expect(checklist.find((item) => item.id === "core-content")?.done).toBe(true);
  });
});
