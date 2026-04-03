import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import { ensureEditorDocument } from "@/lib/resume-editor";

describe("ensureEditorDocument", () => {
  it("normalizes legacy skills section titles to 核心技能", () => {
    const document = createEmptyResumeDocument("resume-skills", "Skills Title");
    const skillsSection = document.sections.find((section) => section.type === "skills");

    expect(skillsSection).toBeTruthy();
    if (!skillsSection) {
      return;
    }

    skillsSection.title = "技能清单";

    const normalized = ensureEditorDocument(document);
    expect(normalized.sections.find((section) => section.type === "skills")?.title).toBe("核心技能");
  });

  it("keeps custom skills section titles unchanged", () => {
    const document = createEmptyResumeDocument("resume-custom-skills", "Custom Skills");
    const skillsSection = document.sections.find((section) => section.type === "skills");

    expect(skillsSection).toBeTruthy();
    if (!skillsSection) {
      return;
    }

    skillsSection.title = "技术亮点";

    const normalized = ensureEditorDocument(document);
    expect(normalized.sections.find((section) => section.type === "skills")?.title).toBe("技术亮点");
  });
});
