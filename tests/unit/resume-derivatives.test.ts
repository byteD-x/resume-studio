import { describe, expect, it } from "vitest";
import {
  applyResumeOptimization,
  buildOptimizedResumeTitle,
  createOptimizedResumeDocument,
} from "@/lib/resume-derivatives";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import { getResumeLineageMeta } from "@/lib/resume-lineage";

describe("resume derivatives", () => {
  it("creates a two-page optimized copy without mutating the source draft", () => {
    const source = createEmptyResumeDocument("source", "Primary Resume");
    source.layout.marginsMm = 16;
    source.sections = [
      {
        id: "experience",
        type: "experience",
        title: "Experience",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [],
      },
      {
        id: "skills",
        type: "skills",
        title: "Skills",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [],
      },
    ];

    const optimized = createOptimizedResumeDocument(source, {
      nextId: "source-optimized",
    });

    expect(optimized.meta.id).toBe("source-optimized");
    expect(optimized.meta.title).toBe("Primary Resume · 两页优化版");
    expect(optimized.meta.sourceRefs).toContain("resume:source");
    expect(optimized.meta.sourceRefs).toContain("variant:optimized");
    expect(optimized.layout.marginsMm).toBe(11);
    expect(optimized.sections.find((section) => section.type === "skills")?.layout).toBe("tag-grid");
    expect(
      optimized.importTrace.pendingReview.some((entry) => entry.includes("两页优化版已从当前原稿派生")),
    ).toBe(true);
    expect(source.meta.id).toBe("source");
    expect(source.layout.marginsMm).toBe(16);
  });

  it("builds a one-page optimization preview without mutating the current draft", () => {
    const source = createEmptyResumeDocument("source", "Primary Resume");
    source.layout.marginsMm = 14;

    const preview = applyResumeOptimization(source, "one-page");

    expect(buildOptimizedResumeTitle(source, "one-page")).toBe("Primary Resume · 一页优化版");
    expect(preview.layout.marginsMm).toBe(9.5);
    expect(preview.layout.bodyFontSizePt).toBeLessThan(source.layout.bodyFontSizePt);
    expect(source.layout.marginsMm).toBe(14);
  });

  it("marks optimized copies as optimized variants in lineage metadata", () => {
    const source = createEmptyResumeDocument("source", "Primary Resume");
    const optimized = createOptimizedResumeDocument(source, {
      nextId: "source-optimized",
    });

    const meta = getResumeLineageMeta(optimized, [source, optimized]);

    expect(meta?.kind).toBe("variant");
    expect(meta?.derivativeKind).toBe("optimized");
    expect(meta?.parentId).toBe("source");
  });
});
