import { describe, expect, it } from "vitest";
import {
  createEmptyResumeDocument,
  createGuidedResumeDocument,
  getResumeTemplateLayoutPreset,
  resumeWriterProfileMeta,
  validateResumeDocument,
} from "@/lib/resume-document";
import { buildResumePreviewHtml } from "@/lib/resume-preview";

describe("resume document", () => {
  it("creates a default editable document", () => {
    const document = createEmptyResumeDocument("default", "Primary Resume");

    expect(document.meta.id).toBe("default");
    expect(document.meta.schemaVersion).toBe(1);
    expect(document.meta.writerProfile).toBe("experienced");
    expect(document.meta.workflowState).toBe("drafting");
    expect(document.basics.summaryHtml).toBe("");
    expect(document.targeting.focusKeywords).toEqual([]);
    expect(document.sections.length).toBeGreaterThanOrEqual(3);
  });

  it("renders a clean empty preview state for blank resumes", () => {
    const document = createEmptyResumeDocument("default", "Primary Resume");

    const html = buildResumePreviewHtml(document);

    expect(html).toContain("开始填写");
    expect(html).not.toContain("Primary Resume</h1>");
    expect(html).not.toContain("自我评价");
  });

  it("builds printable HTML from the document", () => {
    const document = createEmptyResumeDocument("default", "Primary Resume");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Backend Engineer";

    const html = buildResumePreviewHtml(document);

    expect(html).toContain("Jane Doe");
    expect(html).toContain("Backend Engineer");
    expect(html).toContain("@page");
  });

  it("renders different preview layouts for each template", () => {
    const modernDocument = createEmptyResumeDocument("modern", "现代模板");
    modernDocument.meta.template = "modern-two-column";
    modernDocument.basics.name = "Jane Doe";
    modernDocument.basics.headline = "Product Designer";
    modernDocument.basics.summaryHtml = "<p>Focused on clear product narratives.</p>";
    modernDocument.sections[0]!.items = [
      {
        id: "modern-exp",
        title: "Experience",
        subtitle: "Lead Designer",
        location: "Shanghai",
        dateRange: "2024 - 2026",
        meta: "",
        summaryHtml: "",
        bulletPoints: ["Built end-to-end product systems."],
        tags: [],
      },
    ];

    const classicDocument = createEmptyResumeDocument("classic", "经典模板");
    classicDocument.meta.template = "classic-single-column";
    classicDocument.basics.name = "Jane Doe";
    classicDocument.basics.headline = "Product Designer";
    classicDocument.basics.summaryHtml = "<p>Focused on clear product narratives.</p>";
    classicDocument.sections[0]!.items = [
      {
        id: "classic-exp",
        title: "Experience",
        subtitle: "Lead Designer",
        location: "Shanghai",
        dateRange: "2024 - 2026",
        meta: "",
        summaryHtml: "",
        bulletPoints: ["Built end-to-end product systems."],
        tags: [],
      },
    ];

    const modernHtml = buildResumePreviewHtml(modernDocument);
    const classicHtml = buildResumePreviewHtml(classicDocument);

    expect(modernHtml).toContain("template-modern-two-column");
    expect(modernHtml).toContain('<aside class="column sidebar-column">');
    expect(classicHtml).toContain("template-classic-single-column");
    expect(classicHtml).not.toContain('<aside class="column sidebar-column">');
  });

  it("switches dense resumes into compact preview mode", () => {
    const document = createEmptyResumeDocument("dense", "紧凑版");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Staff Frontend Engineer";
    document.basics.summaryHtml =
      "<p>负责复杂前端平台、设计系统和增长实验，覆盖多团队协作、组件治理、性能优化与投放效率提升。</p>";

    document.sections = [
      {
        id: "experience",
        type: "experience",
        title: "工作经历",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: Array.from({ length: 4 }).map((_, index) => ({
          id: `exp-${index}`,
          title: `Experience ${index + 1}`,
          subtitle: "Frontend Engineer",
          location: "Shanghai",
          dateRange: "2022 - 2026",
          meta: "React · Next.js",
          summaryHtml: "<p>Built and shipped product surfaces.</p>",
          bulletPoints: [
            "Improved delivery speed across shared surfaces.",
            "Raised conversion with targeted experimentation.",
            "Standardized design system primitives.",
            "Reduced regressions through quality gates.",
          ],
          tags: ["React", "Next.js"],
        })),
      },
      {
        id: "projects",
        type: "projects",
        title: "项目经历",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [
          {
            id: "project-1",
            title: "Growth Console",
            subtitle: "",
            location: "",
            dateRange: "2025",
            meta: "",
            summaryHtml: "<p>Unified experiment and rollout workflows.</p>",
            bulletPoints: ["Improved launch confidence."],
            tags: [],
          },
        ],
      },
      {
        id: "skills",
        type: "skills",
        title: "技能",
        visible: true,
        layout: "tag-grid",
        contentHtml: "",
        items: [
          {
            id: "skills-1",
            title: "技能",
            subtitle: "",
            location: "",
            dateRange: "",
            meta: "",
            summaryHtml: "",
            bulletPoints: [],
            tags: ["React", "TypeScript", "Next.js", "Design Systems"],
          },
        ],
      },
      {
        id: "education",
        type: "education",
        title: "教育经历",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [],
      },
      {
        id: "custom",
        type: "custom",
        title: "附加信息",
        visible: true,
        layout: "rich-text",
        contentHtml: "<p>Additional information</p>",
        items: [],
      },
    ];

    const html = buildResumePreviewHtml(document);

    expect(html).toContain("density-compact");
    expect(html).toContain("page-break-inside: avoid");
    expect(html).toContain("--body-size: 9.1pt");
  });

  it("creates a guided starter document with writing scaffolding", () => {
    const document = createGuidedResumeDocument("starter", "引导草稿");

    expect(document.meta.sourceRefs).toContain("starter:guided");
    expect(document.sections.some((section) => section.type === "education")).toBe(true);
    expect(document.sections.every((section) => section.items.length === 0)).toBe(true);
  });

  it("builds different guided starters for each writer profile", () => {
    const campus = createGuidedResumeDocument("campus", "校招简历", "campus");
    const switcher = createGuidedResumeDocument("switcher", "转岗简历", "career-switch");

    expect(campus.meta.writerProfile).toBe("campus");
    expect(campus.sections[0]?.type).toBe("education");
    expect(campus.sections.some((section) => section.title.includes("实习"))).toBe(true);
    expect(switcher.meta.writerProfile).toBe("career-switch");
    expect(switcher.sections.some((section) => section.title === "工作经历")).toBe(true);
    expect(resumeWriterProfileMeta["career-switch"].workflowSteps).toHaveLength(3);
  });

  it("exposes distinct layout presets for each template", () => {
    const modernPreset = getResumeTemplateLayoutPreset("modern-two-column");
    const classicPreset = getResumeTemplateLayoutPreset("classic-single-column");

    expect(modernPreset.bodyFont).not.toBe(classicPreset.bodyFont);
    expect(modernPreset.headingFont).not.toBe(classicPreset.headingFont);
    expect(modernPreset.marginsMm).not.toBe(classicPreset.marginsMm);
    expect(modernPreset.accentColor).not.toBe(classicPreset.accentColor);
  });

  it("rejects invalid document shape", () => {
    expect(() =>
      validateResumeDocument({
        basics: {},
      }),
    ).toThrow();
  });

  it("fills defaults for legacy documents without schemaVersion or writerProfile", () => {
    const legacy = validateResumeDocument({
      meta: {
        id: "legacy",
        title: "Legacy Resume",
        locale: "zh-CN",
        template: "modern-two-column",
        workflowState: "drafting",
        updatedAt: new Date().toISOString(),
        sourceRefs: [],
      },
      basics: {
        name: "",
        headline: "",
        location: "",
        email: "",
        phone: "",
        website: "",
        summaryHtml: "<p>Legacy</p>",
        links: [],
      },
      targeting: {
        role: "",
        company: "",
        postingUrl: "",
        jobDescription: "",
        focusKeywords: [],
        notes: "",
      },
      layout: getResumeTemplateLayoutPreset("modern-two-column"),
      sections: [],
      importTrace: {
        portfolioImportedAt: "",
        pdfImportedAt: "",
        unmapped: [],
        pendingReview: [],
      },
    });

    expect(legacy.meta.schemaVersion).toBe(1);
    expect(legacy.meta.writerProfile).toBe("experienced");
  });
});
