import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import { isPreviewNavigateTarget } from "@/lib/resume-preview/types";

describe("resume preview sanitization", () => {
  it("keeps safe profile links and strips unsafe ones", () => {
    const document = createEmptyResumeDocument("preview", "Preview");
    document.meta.template = "aurora-grid";
    document.basics.name = "Preview Candidate";
    document.basics.summaryHtml = "<p>Summary</p>";
    document.basics.links = [
      { label: "Portfolio", url: "example.com/work" },
      { label: "Unsafe", url: "javascript:alert(1)" },
    ];

    const html = buildResumePreviewHtml(document);

    expect(html).toContain('href="https://example.com/work"');
    expect(html).not.toContain("javascript:alert");
  });

  it("drops unsafe photo sources from the preview", () => {
    const document = createEmptyResumeDocument("preview-photo", "Preview Photo");
    document.basics.name = "Preview Candidate";
    document.basics.summaryHtml = "<p>Summary</p>";
    document.basics.photoVisible = true;
    document.basics.photoUrl = "javascript:alert(1)";

    const html = buildResumePreviewHtml(document);

    expect(html).not.toContain('class="resume-photo"');
    expect(html).not.toContain("javascript:alert");
  });

  it("adds interactive navigation hooks for basics and section items", () => {
    const document = createEmptyResumeDocument("interactive", "Interactive Preview");
    document.basics.name = "Preview Candidate";
    document.basics.summaryHtml = "<p>Summary</p>";
    document.sections[0]!.items = [
      {
        id: "exp-1",
        title: "Senior Engineer",
        subtitle: "Resume Studio",
        location: "Shanghai",
        dateRange: "2024 - 2026",
        meta: "",
        summaryHtml: "<p>Built the editor preview bridge.</p>",
        bulletPoints: ["Connected preview clicks back to the form editor."],
        tags: [],
      },
    ];

    const html = buildResumePreviewHtml(document, {
      interactive: true,
      highlightedTarget: {
        kind: "section",
        sectionType: "experience",
        itemId: "exp-1",
      },
    });

    expect(html).toContain('data-preview-target=\'{&quot;kind&quot;:&quot;basics&quot;}\'');
    expect(html).toContain('"resume-preview:navigate"');
    expect(html).toContain("resume-preview-focusable");
    expect(html).toContain("resume-item-highlighted");
    expect(html).toContain('&quot;itemId&quot;:&quot;exp-1&quot;');
  });
});

describe("preview navigation target guard", () => {
  it("accepts supported preview targets", () => {
    expect(isPreviewNavigateTarget({ kind: "basics" })).toBe(true);
    expect(isPreviewNavigateTarget({ kind: "section", sectionType: "experience" })).toBe(true);
    expect(isPreviewNavigateTarget({ kind: "section", sectionType: "custom", itemId: "x" })).toBe(true);
  });

  it("rejects malformed preview targets", () => {
    expect(isPreviewNavigateTarget(null)).toBe(false);
    expect(isPreviewNavigateTarget({ kind: "section" })).toBe(false);
    expect(isPreviewNavigateTarget({ kind: "unknown" })).toBe(false);
  });
});
