import { describe, expect, it } from "vitest";
import { importPortfolioToResume } from "@/lib/portfolio-import";

describe("portfolio import", () => {
  it("maps portfolio data into a resume draft", async () => {
    const result = await importPortfolioToResume({
      resumeId: "default",
    });

    expect(result.document.basics.name).toBeTruthy();
    expect(result.document.sections.some((section) => section.type === "experience")).toBe(true);
    expect(result.document.sections.some((section) => section.type === "skills")).toBe(true);
  });
});
