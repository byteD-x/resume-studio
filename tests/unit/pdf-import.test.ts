import { describe, expect, it } from "vitest";
import {
  buildResumeFromPdfLines,
  groupPdfLines,
  splitImportedPdfSections,
  type RawPdfLine,
} from "@/lib/pdf-import";

describe("pdf import helpers", () => {
  it("merges fragments on the same visual line", () => {
    const lines: RawPdfLine[] = [
      { page: 1, text: "Jane", x: 10, y: 100, fontName: "A", fontSize: 14 },
      { page: 1, text: "Doe", x: 52, y: 100.9, fontName: "A", fontSize: 14 },
      { page: 1, text: "Staff", x: 10, y: 82, fontName: "A", fontSize: 12 },
      { page: 1, text: "Engineer", x: 56, y: 82.4, fontName: "A", fontSize: 12 },
    ];

    expect(groupPdfLines(lines)).toEqual(["Jane Doe", "Staff Engineer"]);
  });

  it("recognizes prelude content and standard section headings", () => {
    const result = splitImportedPdfSections([
      "Jane Doe",
      "Staff Frontend Engineer",
      "jane@example.com · github.com/jane",
      "Work Experience",
      "Acme Corp",
      "Technical Skills:",
      "React, Next.js, TypeScript",
    ]);

    expect(result.prelude).toContain("Jane Doe");
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0]?.heading).toBe("Work Experience");
    expect(result.sections[1]?.heading).toBe("Technical Skills");
  });

  it("extracts basics and maps skills when rebuilding a resume from pdf lines", () => {
    const document = buildResumeFromPdfLines([
      "Jane Doe",
      "Staff Frontend Engineer",
      "jane@example.com · +86 138 0000 0000 · github.com/jane",
      "Professional Summary",
      "Built and led frontend platforms for growth products.",
      "Work Experience",
      "Acme Corp",
      "Staff Frontend Engineer · Shanghai · 2022 - Present",
      "Led a migration from legacy React to Next.js.",
      "- Improved shared frontend delivery speed.",
      "Technical Skills",
      "React, Next.js, TypeScript, Design Systems",
    ], {
      resumeId: "imported",
    });

    expect(document.meta.id).toBe("imported");
    expect(document.basics.name).toBe("Jane Doe");
    expect(document.basics.headline).toBe("Staff Frontend Engineer");
    expect(document.basics.email).toBe("jane@example.com");
    expect(document.basics.phone).toContain("138");
    expect(document.basics.website).toContain("github.com/jane");
    expect(document.basics.links[0]?.label).toBe("GitHub");

    const summarySection = document.sections.find((section) => section.type === "summary");
    const experienceSection = document.sections.find((section) => section.type === "experience");
    const skillsSection = document.sections.find((section) => section.type === "skills");

    expect(summarySection?.contentHtml).toContain("Built and led frontend platforms");
    expect(experienceSection?.items[0]?.title).toBe("Acme Corp");
    expect(experienceSection?.items[0]?.subtitle).toBe("Staff Frontend Engineer");
    expect(experienceSection?.items[0]?.location).toBe("Shanghai");
    expect(experienceSection?.items[0]?.dateRange).toContain("2022");
    expect(experienceSection?.items[0]?.bulletPoints[0]).toContain("Improved shared frontend");
    expect(skillsSection?.items[0]?.tags).toContain("React");
    expect(skillsSection?.items[0]?.tags).toContain("Design Systems");
    expect(document.importTrace.pendingReview.length).toBeGreaterThan(0);
    expect(document.importTrace.unmapped[0]).toContain("PDF");
  });

  it("splits experience sections into multiple editable items", () => {
    const document = buildResumeFromPdfLines([
      "Work Experience",
      "Acme Corp",
      "Senior Engineer · Shanghai · 2022 - Present",
      "Led a shared design system migration.",
      "- Reduced duplicated UI work.",
      "Beta Labs",
      "Frontend Engineer · Remote · 2020 - 2022",
      "Built onboarding and experimentation flows.",
      "- Improved conversion across acquisition pages.",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(2);
    expect(experienceSection?.items[0]?.title).toBe("Acme Corp");
    expect(experienceSection?.items[1]?.title).toBe("Beta Labs");
    expect(experienceSection?.items[1]?.dateRange).toContain("2020");
  });

  it("parses single-line experience headers into title and subtitle", () => {
    const document = buildResumeFromPdfLines([
      "工作经历",
      "字节跳动 / 前端工程师 / 上海 / 2022 - 至今",
      "负责增长实验平台和设计系统落地。",
      "- 提升多个业务线的迭代效率。",
      "Acme Corp - Senior Frontend Engineer - Remote - 2020 - 2022",
      "Built onboarding and shared component workflows.",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(2);
    expect(experienceSection?.items[0]?.title).toBe("字节跳动");
    expect(experienceSection?.items[0]?.subtitle).toBe("前端工程师");
    expect(experienceSection?.items[0]?.location).toBe("上海");
    expect(experienceSection?.items[0]?.dateRange).toContain("2022");
    expect(experienceSection?.items[1]?.title).toBe("Acme Corp");
    expect(experienceSection?.items[1]?.subtitle).toBe("Senior Frontend Engineer");
    expect(experienceSection?.items[1]?.location).toBe("Remote");
  });

  it("normalizes role-first headers joined with at-sign into company-first items", () => {
    const document = buildResumeFromPdfLines([
      "Work Experience",
      "Senior Frontend Engineer @ Acme Corp",
      "Shanghai · 2020 - 2022",
      "Built onboarding and shared component workflows.",
      "高级前端工程师 @ 字节跳动",
      "上海 · 2022 - 至今",
      "- 负责增长实验平台和设计系统落地。",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(2);
    expect(experienceSection?.items[0]?.title).toBe("Acme Corp");
    expect(experienceSection?.items[0]?.subtitle).toBe("Senior Frontend Engineer");
    expect(experienceSection?.items[0]?.location).toBe("Shanghai");
    expect(experienceSection?.items[1]?.title).toBe("字节跳动");
    expect(experienceSection?.items[1]?.subtitle).toBe("高级前端工程师");
    expect(experienceSection?.items[1]?.dateRange).toContain("2022");
  });

  it("normalizes role-first headers separated by pipes into company-first items", () => {
    const document = buildResumeFromPdfLines([
      "Work Experience",
      "Senior Frontend Engineer | Acme Corp | Remote | 2020 - 2022",
      "Built onboarding and design system workflows.",
      "前端工程师 | 字节跳动 | 上海 | 2022 - 至今",
      "- 负责增长实验平台建设。",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(2);
    expect(experienceSection?.items[0]?.title).toBe("Acme Corp");
    expect(experienceSection?.items[0]?.subtitle).toBe("Senior Frontend Engineer");
    expect(experienceSection?.items[0]?.location).toBe("Remote");
    expect(experienceSection?.items[1]?.title).toBe("字节跳动");
    expect(experienceSection?.items[1]?.subtitle).toBe("前端工程师");
    expect(experienceSection?.items[1]?.location).toBe("上海");
  });

  it("merges bilingual experience fields into single company and role values", () => {
    const document = buildResumeFromPdfLines([
      "Work Experience",
      "字节跳动 / ByteDance | 前端工程师 / Frontend Engineer | 上海 / Shanghai | 2022.03-至今",
      "- 负责增长实验平台建设。",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(1);
    expect(experienceSection?.items[0]?.title).toBe("字节跳动 / ByteDance");
    expect(experienceSection?.items[0]?.subtitle).toBe("前端工程师 / Frontend Engineer");
    expect(experienceSection?.items[0]?.location).toBe("上海 / Shanghai");
    expect(experienceSection?.items[0]?.dateRange).toBe("2022.03-至今");
  });

  it("parses no-delimiter one-line experience headers with english-first organization", () => {
    const document = buildResumeFromPdfLines([
      "Work Experience",
      "ByteDance 字节跳动 Frontend Engineer 前端工程师 上海 2022.03-至今",
      "- Built growth experimentation workflows.",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(1);
    expect(experienceSection?.items[0]?.title).toBe("ByteDance 字节跳动");
    expect(experienceSection?.items[0]?.subtitle).toBe("Frontend Engineer / 前端工程师");
    expect(experienceSection?.items[0]?.location).toBe("上海");
    expect(experienceSection?.items[0]?.dateRange).toBe("2022.03-至今");
  });

  it("parses no-delimiter one-line experience headers with chinese-first organization", () => {
    const document = buildResumeFromPdfLines([
      "工作经历",
      "字节跳动 ByteDance 前端工程师 Frontend Engineer 上海 2022.03-至今",
      "- 负责增长实验平台建设。",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(1);
    expect(experienceSection?.items[0]?.title).toBe("字节跳动 ByteDance");
    expect(experienceSection?.items[0]?.subtitle).toBe("前端工程师 / Frontend Engineer");
    expect(experienceSection?.items[0]?.location).toBe("上海");
    expect(experienceSection?.items[0]?.dateRange).toBe("2022.03-至今");
  });

  it("reorders ocr-scrambled experience headers when meta line appears first", () => {
    const document = buildResumeFromPdfLines([
      "Work Experience",
      "Shanghai · 2022 - Present",
      "Acme Corp",
      "Senior Frontend Engineer",
      "- Built onboarding and experiment workflows.",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(1);
    expect(experienceSection?.items[0]?.title).toBe("Acme Corp");
    expect(experienceSection?.items[0]?.subtitle).toBe("Senior Frontend Engineer");
    expect(experienceSection?.items[0]?.location).toBe("Shanghai");
    expect(experienceSection?.items[0]?.dateRange).toBe("2022 - Present");
  });

  it("reorders ocr-scrambled experience headers when role line appears first", () => {
    const document = buildResumeFromPdfLines([
      "工作经历",
      "前端工程师",
      "字节跳动",
      "上海 · 2022 - 至今",
      "- 负责增长实验平台建设。",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(1);
    expect(experienceSection?.items[0]?.title).toBe("字节跳动");
    expect(experienceSection?.items[0]?.subtitle).toBe("前端工程师");
    expect(experienceSection?.items[0]?.location).toBe("上海");
    expect(experienceSection?.items[0]?.dateRange).toBe("2022 - 至今");
  });

  it("parses education headers into school-first items", () => {
    const document = buildResumeFromPdfLines([
      "Education",
      "Fudan University | Computer Science | Bachelor | Shanghai | 2018 - 2022",
      "GPA: 3.8/4.0",
      "清华大学 | 软件工程 | 硕士 | 北京 | 2022 - 至今",
      "研究方向为分布式系统。",
    ]);

    const educationSection = document.sections.find((section) => section.type === "education");

    expect(educationSection?.items).toHaveLength(2);
    expect(educationSection?.items[0]?.title).toBe("Fudan University");
    expect(educationSection?.items[0]?.subtitle).toBe("Computer Science · Bachelor");
    expect(educationSection?.items[0]?.location).toBe("Shanghai");
    expect(educationSection?.items[0]?.meta).toContain("GPA: 3.8/4.0");
    expect(educationSection?.items[1]?.title).toBe("清华大学");
    expect(educationSection?.items[1]?.subtitle).toBe("软件工程 · 硕士");
    expect(educationSection?.items[1]?.location).toBe("北京");
    expect(educationSection?.items[1]?.summaryHtml).toContain("研究方向为分布式系统");
  });

  it("merges bilingual education fields into single school and major values", () => {
    const document = buildResumeFromPdfLines([
      "教育经历",
      "清华大学 / Tsinghua University | 软件工程 / Software Engineering | 硕士 / Master | 北京 / Beijing | 2022年3月 至今",
    ]);

    const educationSection = document.sections.find((section) => section.type === "education");

    expect(educationSection?.items).toHaveLength(1);
    expect(educationSection?.items[0]?.title).toBe("清华大学 / Tsinghua University");
    expect(educationSection?.items[0]?.subtitle).toBe("软件工程 / Software Engineering · 硕士 / Master");
    expect(educationSection?.items[0]?.location).toBe("北京 / Beijing");
    expect(educationSection?.items[0]?.dateRange).toBe("2022年3月 至今");
  });

  it("parses compact and chinese date ranges in experience items", () => {
    const document = buildResumeFromPdfLines([
      "工作经历",
      "字节跳动 | 前端工程师 | 上海 | 2022.03-至今",
      "- 负责增长实验平台建设。",
      "Acme Corp | Senior Frontend Engineer | Remote | 2020/09–2022/12",
      "Built onboarding and design system workflows.",
    ]);

    const experienceSection = document.sections.find((section) => section.type === "experience");

    expect(experienceSection?.items).toHaveLength(2);
    expect(experienceSection?.items[0]?.dateRange).toBe("2022.03-至今");
    expect(experienceSection?.items[1]?.dateRange).toBe("2020/09–2022/12");
  });

  it("normalizes degree-first education headers into school-first items", () => {
    const document = buildResumeFromPdfLines([
      "教育经历",
      "Bachelor | Fudan University | Computer Science | Shanghai | 2018 - 2022",
      "Master | Stanford University | Electrical Engineering | 2022 - 2024",
    ]);

    const educationSection = document.sections.find((section) => section.type === "education");

    expect(educationSection?.items).toHaveLength(2);
    expect(educationSection?.items[0]?.title).toBe("Fudan University");
    expect(educationSection?.items[0]?.subtitle).toBe("Computer Science · Bachelor");
    expect(educationSection?.items[0]?.location).toBe("Shanghai");
    expect(educationSection?.items[1]?.title).toBe("Stanford University");
    expect(educationSection?.items[1]?.subtitle).toBe("Electrical Engineering · Master");
    expect(educationSection?.items[1]?.dateRange).toContain("2022");
  });

  it("parses chinese year-month ranges in education items", () => {
    const document = buildResumeFromPdfLines([
      "教育经历",
      "硕士 | 清华大学 | 软件工程 | 北京 | 2022年3月 至今",
      "Bachelor | Stanford University | Computer Science | 2018年09月 - 2022年06月",
    ]);

    const educationSection = document.sections.find((section) => section.type === "education");

    expect(educationSection?.items).toHaveLength(2);
    expect(educationSection?.items[0]?.dateRange).toBe("2022年3月 至今");
    expect(educationSection?.items[1]?.dateRange).toBe("2018年09月 - 2022年06月");
  });

  it("extracts education meta lines for honors and coursework", () => {
    const document = buildResumeFromPdfLines([
      "Education",
      "Stanford University | Computer Science | Master | 2022 - 2024",
      "Honors: Graduate Fellowship",
      "Relevant Coursework: Distributed Systems, Machine Learning",
      "Research: Focused on systems reliability and evaluation.",
    ]);

    const educationSection = document.sections.find((section) => section.type === "education");

    expect(educationSection?.items).toHaveLength(1);
    expect(educationSection?.items[0]?.meta).toContain("Honors: Graduate Fellowship");
    expect(educationSection?.items[0]?.meta).toContain("Relevant Coursework: Distributed Systems, Machine Learning");
    expect(educationSection?.items[0]?.summaryHtml).toContain("Focused on systems reliability");
  });

  it("extracts project stack tags and outcome lines into editable project items", () => {
    const document = buildResumeFromPdfLines([
      "Projects",
      "Growth Experimentation Platform",
      "Lead Engineer · 2023 - 2024",
      "Built an internal platform for experimentation workflows across growth teams.",
      "Tech Stack: React, Next.js, TypeScript, PostgreSQL",
      "Improved experiment launch efficiency by 35% across product squads.",
      "- Reduced analysis handoff time for PM and data teams.",
    ]);

    const projectsSection = document.sections.find((section) => section.type === "projects");

    expect(projectsSection?.items).toHaveLength(1);
    expect(projectsSection?.items[0]?.title).toBe("Growth Experimentation Platform");
    expect(projectsSection?.items[0]?.subtitle).toBe("Lead Engineer");
    expect(projectsSection?.items[0]?.tags).toContain("React");
    expect(projectsSection?.items[0]?.tags).toContain("PostgreSQL");
    expect(projectsSection?.items[0]?.summaryHtml).toContain("internal platform for experimentation workflows");
    expect(projectsSection?.items[0]?.bulletPoints).toContain("Improved experiment launch efficiency by 35% across product squads.");
    expect(projectsSection?.items[0]?.bulletPoints).toContain("Reduced analysis handoff time for PM and data teams.");
  });

  it("falls back to a custom section when no standard headings are found", () => {
    const document = buildResumeFromPdfLines([
      "Jane Doe",
      "Product Designer",
      "jane@example.com",
      "Designed mobile growth funnels and onboarding flows.",
      "Built design system tokens used by multiple product squads.",
    ]);

    expect(document.sections[0]?.type).toBe("custom");
    expect(document.sections[0]?.contentHtml).toContain("Designed mobile growth funnels");
    expect(document.importTrace.pendingReview[0]).toContain("没有识别出标准章节标题");
  });
});
