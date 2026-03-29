import { describe, expect, it } from "vitest";
import {
  analyzeResumeTargeting,
  extractFocusKeywordsFromJobDescription,
  parseFocusKeywords,
} from "@/lib/resume-targeting";
import { createEmptyResumeDocument } from "@/lib/resume-document";

describe("resume targeting", () => {
  it("parses manual keywords from textarea input", () => {
    expect(parseFocusKeywords("TypeScript\nNext.js, React ; TypeScript")).toEqual([
      "TypeScript",
      "Next.js",
      "React",
    ]);
  });

  it("analyzes manual keywords against the current resume", () => {
    const document = createEmptyResumeDocument("targeted", "Targeted Resume");
    document.basics.headline = "Senior TypeScript Engineer";
    document.targeting.role = "Frontend Platform Engineer";
    document.targeting.company = "Example";
    document.targeting.focusKeywords = ["TypeScript", "Next.js", "PostgreSQL"];
    document.sections = [
      {
        ...document.sections[0],
        type: "projects",
        title: "Projects",
        items: [
          {
            id: "project-1",
            title: "Design System",
            subtitle: "",
            location: "",
            dateRange: "2025",
            meta: "",
            summaryHtml: "<p>Built a modular UI platform with Next.js.</p>",
            bulletPoints: ["Created reusable frontend patterns."],
            tags: ["Next.js", "Design Systems"],
          },
        ],
      },
    ];

    const analysis = analyzeResumeTargeting(document);

    expect(analysis.active).toBe(true);
    expect(analysis.keywordSource).toBe("manual");
    expect(analysis.targetLabel).toBe("Frontend Platform Engineer @ Example");
    expect(analysis.matchedKeywords).toEqual(["TypeScript", "Next.js"]);
    expect(analysis.missingKeywords).toEqual(["PostgreSQL"]);
    expect(analysis.coveragePercent).toBe(67);
  });

  it("suggests keywords from job description when manual keywords are empty", () => {
    const suggestions = extractFocusKeywordsFromJobDescription(
      "We are hiring an engineer with React, Next.js, TypeScript, and Node.js experience. Build design systems and scalable UI platforms.",
    );
    const document = createEmptyResumeDocument("jd", "JD Resume");
    document.targeting.jobDescription =
      "We are hiring an engineer with React, Next.js, TypeScript, and Node.js experience.";

    const analysis = analyzeResumeTargeting(document);

    expect(suggestions).toEqual(
      expect.arrayContaining(["React", "Next.js", "TypeScript", "Node.js"]),
    );
    expect(analysis.keywordSource).toBe("job-description");
    expect(analysis.suggestedKeywords).toEqual(
      expect.arrayContaining(["React", "Next.js", "TypeScript", "Node.js"]),
    );
  });
});
