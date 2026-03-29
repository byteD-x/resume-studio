import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import {
  buildTailoredVariantPlan,
  createTailoredVariantDocument,
} from "@/lib/resume-tailoring";

describe("resume tailoring", () => {
  it("builds a selection plan from manual targeting keywords", () => {
    const document = createEmptyResumeDocument("tailoring-source", "Platform Resume");
    document.targeting.role = "Frontend Platform Engineer";
    document.targeting.company = "Target Co";
    document.targeting.focusKeywords = ["React", "Next.js", "Design Systems", "GraphQL"];
    document.sections = [
      {
        id: "experience",
        type: "experience",
        title: "Experience",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [
          {
            id: "item-exp-1",
            title: "Frontend Platform Lead",
            subtitle: "Example",
            location: "",
            dateRange: "2023-2025",
            meta: "",
            summaryHtml: "<p>Led the React platform migration and scaled a shared Next.js shell.</p>",
            bulletPoints: ["Built a reusable design systems foundation."],
            tags: ["React", "Next.js"],
          },
        ],
      },
      {
        id: "projects",
        type: "projects",
        title: "Projects",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [
          {
            id: "item-project-1",
            title: "Design System Rollout",
            subtitle: "",
            location: "",
            dateRange: "2024",
            meta: "",
            summaryHtml: "<p>Unified component quality across product surfaces.</p>",
            bulletPoints: ["Established adoption rules for the design systems team."],
            tags: ["Design Systems"],
          },
          {
            id: "item-project-2",
            title: "Office Move Support",
            subtitle: "",
            location: "",
            dateRange: "2022",
            meta: "",
            summaryHtml: "<p>Coordinated vendor onboarding and hardware setup.</p>",
            bulletPoints: ["Managed conference room logistics."],
            tags: ["Operations"],
          },
        ],
      },
      {
        id: "custom",
        type: "custom",
        title: "Community",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [
          {
            id: "item-custom-1",
            title: "Volunteer Coordinator",
            subtitle: "",
            location: "",
            dateRange: "2021",
            meta: "",
            summaryHtml: "<p>Ran community meetup logistics.</p>",
            bulletPoints: [],
            tags: [],
          },
        ],
      },
    ];

    const plan = buildTailoredVariantPlan(document);

    expect(plan.keywordSource).toBe("manual");
    expect(plan.canGenerate).toBe(true);
    expect(plan.matchedKeywords).toEqual(["React", "Next.js", "Design Systems"]);
    expect(plan.missingKeywords).toEqual(["GraphQL"]);
    expect(plan.keptItems).toBe(3);
    expect(plan.droppedItems).toBe(1);
    expect(plan.sectionPlans.find((entry) => entry.sectionId === "custom")?.action).toBe("drop");
    expect(plan.itemPlans.find((entry) => entry.itemId === "item-project-2")?.action).toBe(
      "fallback",
    );
  });

  it("uses job description keywords when no manual list is set", () => {
    const document = createEmptyResumeDocument("tailoring-jd", "JD Resume");
    document.targeting.jobDescription =
      "We are hiring a frontend engineer with React, Next.js, TypeScript, and experimentation platform experience.";

    const plan = buildTailoredVariantPlan(document);

    expect(plan.keywordSource).toBe("job-description");
    expect(plan.canGenerate).toBe(true);
    expect(plan.keywords).toEqual(
      expect.arrayContaining(["React", "Next.js", "TypeScript"]),
    );
  });

  it("creates a new tailored document with filtered content and review notes", () => {
    const source = createEmptyResumeDocument("source", "Primary Resume");
    source.targeting.role = "Staff Frontend Engineer";
    source.targeting.company = "Acme";
    source.targeting.focusKeywords = ["React", "Next.js", "Design Systems"];
    source.sections = [
      {
        id: "experience",
        type: "experience",
        title: "Experience",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [
          {
            id: "keep-1",
            title: "React Platform Lead",
            subtitle: "",
            location: "",
            dateRange: "",
            meta: "",
            summaryHtml: "<p>Owned the Next.js platform upgrade.</p>",
            bulletPoints: ["Built a shared design systems layer."],
            tags: ["React", "Next.js"],
          },
          {
            id: "drop-1",
            title: "Office Manager",
            subtitle: "",
            location: "",
            dateRange: "",
            meta: "",
            summaryHtml: "<p>Handled facilities and seating plans.</p>",
            bulletPoints: [],
            tags: [],
          },
        ],
      },
      {
        id: "projects",
        type: "projects",
        title: "Projects",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [
          {
            id: "keep-2",
            title: "Design System Refresh",
            subtitle: "",
            location: "",
            dateRange: "",
            meta: "",
            summaryHtml: "<p>Refreshed tokens and component standards.</p>",
            bulletPoints: [],
            tags: ["Design Systems"],
          },
          {
            id: "keep-3",
            title: "Next.js Migration",
            subtitle: "",
            location: "",
            dateRange: "",
            meta: "",
            summaryHtml: "<p>Migrated routes and rendering boundaries.</p>",
            bulletPoints: [],
            tags: ["Next.js"],
          },
        ],
      },
      {
        id: "custom",
        type: "custom",
        title: "Awards",
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items: [
          {
            id: "drop-2",
            title: "Volunteer Award",
            subtitle: "",
            location: "",
            dateRange: "",
            meta: "",
            summaryHtml: "<p>Community recognition.</p>",
            bulletPoints: [],
            tags: [],
          },
        ],
      },
    ];

    const tailored = createTailoredVariantDocument(source, {
      nextId: "tailored-acme",
    });

    expect(tailored.meta.id).toBe("tailored-acme");
    expect(tailored.meta.title).toBe("Primary Resume · Acme");
    expect(tailored.meta.sourceRefs).toContain("resume:source");
    expect(tailored.sections.map((section) => section.title)).toEqual([
      "Experience",
      "Projects",
    ]);
    expect(tailored.sections[0]?.items.map((item) => item.title)).toEqual([
      "React Platform Lead",
    ]);
    expect(
      tailored.importTrace.pendingReview.some((entry) =>
        entry.includes("Auto-tailored variant kept"),
      ),
    ).toBe(true);
  });
});
