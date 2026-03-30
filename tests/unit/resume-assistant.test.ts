import { describe, expect, it } from "vitest";
import { buildBasicsAssistPack, buildItemAssistPack } from "@/lib/resume-assistant";
import { createGuidedResumeDocument } from "@/lib/resume-document";

describe("resume assistant", () => {
  it("builds summary suggestions for sparse basics", () => {
    const document = createGuidedResumeDocument("assist", "AI 助手草稿");
    document.basics.headline = "Frontend Engineer";
    document.targeting.role = "Frontend Engineer";

    const pack = buildBasicsAssistPack(document);

    expect(pack.issues.some((issue) => issue.id === "missing-summary")).toBe(true);
    expect(pack.suggestions.some((suggestion) => suggestion.target === "summary")).toBe(true);
    expect(
      pack.suggestions.some((suggestion) =>
        typeof suggestion.nextValue === "string" && suggestion.nextValue.includes("Frontend Engineer"),
      ),
    ).toBe(true);
  });

  it("rewrites weak bullets into stronger phrasing", () => {
    const document = createGuidedResumeDocument("bullets", "经历改写");
    const section = document.sections.find((item) => item.type === "experience");
    if (!section) throw new Error("missing experience section");

    const item = {
      id: "exp-1",
      title: "Acme",
      subtitle: "Frontend Engineer",
      location: "Shanghai",
      dateRange: "2024 - 至今",
      meta: "React / Growth",
      summaryHtml: "",
      bulletPoints: [
        "负责活动页面改版",
        "参与设计系统组件整理",
      ],
      tags: ["React", "Growth"],
    };

    const pack = buildItemAssistPack(section.type, item, document.meta.writerProfile);
    const polishedSuggestion = pack.suggestions.find((suggestion) => suggestion.id === "polish-bullets");

    expect(pack.issues.some((issue) => issue.id === "missing-results")).toBe(true);
    expect(polishedSuggestion).toBeTruthy();
    expect(Array.isArray(polishedSuggestion?.nextValue)).toBe(true);
    expect(
      Array.isArray(polishedSuggestion?.nextValue) &&
        polishedSuggestion.nextValue.some((line) => line.includes("主导") || line.includes("参与并推进")),
    ).toBe(true);
  });

  it("can derive bullets from an existing summary", () => {
    const pack = buildItemAssistPack(
      "projects",
      {
        id: "project-1",
        title: "Resume Studio",
        subtitle: "个人项目",
        location: "",
        dateRange: "2026",
        meta: "",
        summaryHtml: "<p>负责产品梳理并完成编辑器重构。推动导入链路更稳定。</p>",
        bulletPoints: [],
        tags: ["Next.js"],
      },
      "experienced",
    );

    const suggestion = pack.suggestions.find((item) => item.id === "bullets-from-summary");

    expect(suggestion).toBeTruthy();
    expect(Array.isArray(suggestion?.nextValue)).toBe(true);
    expect(Array.isArray(suggestion?.nextValue) && suggestion.nextValue.length).toBeGreaterThan(0);
  });

  it("can normalize skill tags for the skills assistant", () => {
    const pack = buildItemAssistPack(
      "skills",
      {
        id: "skills-1",
        title: "Skills",
        subtitle: "",
        location: "",
        dateRange: "",
        meta: "",
        summaryHtml: "",
        bulletPoints: [],
        tags: ["React", "TypeScript", "React", "Design Systems"],
      },
      "experienced",
    );

    const suggestion = pack.suggestions.find((item) => item.target === "tags");

    expect(pack.issues.some((issue) => issue.id === "skills-focused")).toBe(true);
    expect(suggestion).toBeTruthy();
    expect(Array.isArray(suggestion?.nextValue)).toBe(true);
    expect(Array.isArray(suggestion?.nextValue) && suggestion.nextValue).toEqual([
      "React",
      "TypeScript",
      "Design Systems",
    ]);
  });
});
