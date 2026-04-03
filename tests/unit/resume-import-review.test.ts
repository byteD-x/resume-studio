import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import {
  buildBasicsImportFieldSuggestions,
  buildResumeImportReviewTasks,
  clearImportReview,
  getActiveUnmappedItems,
} from "@/lib/resume-import-review";
import { buildImportReview } from "@/components/product/editor/workspace/import-review";

describe("resume import review tasks", () => {
  it("creates high-priority basics tasks for sparse imported drafts", () => {
    const document = createEmptyResumeDocument("imported", "Imported");
    document.importTrace.portfolioImportedAt = new Date().toISOString();
    document.importTrace.pendingReview = ["Check imported basics"];

    const tasks = buildResumeImportReviewTasks(document);

    expect(tasks.some((task) => task.id === "review-identity")).toBe(true);
    expect(tasks.some((task) => task.id === "review-contact")).toBe(true);
    expect(tasks.some((task) => task.focus === "content")).toBe(true);
  });

  it("includes snapshot and unmapped review tasks when source evidence exists", () => {
    const document = createEmptyResumeDocument("imported", "Imported");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Frontend Engineer";
    document.basics.email = "jane@example.com";
    document.basics.phone = "13800000000";
    document.importTrace.portfolioImportedAt = new Date().toISOString();
    document.importTrace.unmapped = ["Dynamic content was not preserved."];
    document.importTrace.snapshots = [
      {
        id: "snapshot-1",
        label: "Root Page",
        source: "https://portfolio.test/",
        excerpt: "Built growth surfaces and project pages.",
        mappedTo: "Projects",
      },
    ];
    const experienceSection = document.sections.find((section) => section.type === "experience");
    if (experienceSection) {
      experienceSection.items.push({
        id: "exp-1",
        title: "Acme",
        subtitle: "Frontend Engineer",
        location: "",
        dateRange: "2024 - Now",
        meta: "",
        summaryHtml: "",
        bulletPoints: ["Built growth surfaces."],
        tags: [],
      });
    }

    const tasks = buildResumeImportReviewTasks(document);

    expect(tasks.some((task) => task.id === "review-unmapped")).toBe(true);
    expect(tasks.some((task) => task.id === "review-source-snapshots")).toBe(true);
  });

  it("filters completed tasks and reviewed source artifacts", () => {
    const document = createEmptyResumeDocument("imported", "Imported");
    document.importTrace.portfolioImportedAt = new Date().toISOString();
    document.importTrace.pendingReview = ["Check imported basics"];
    document.importTrace.snapshots = [
      {
        id: "snapshot-1",
        label: "Root Page",
        source: "https://portfolio.test/",
        excerpt: "Built growth surfaces and project pages.",
        mappedTo: "Projects",
      },
    ];
    document.importTrace.reviewState = {
      completedTaskIds: ["review-contact", "review-source-snapshots", "review-pending-items"],
      reviewedPendingItems: ["Check imported basics"],
      reviewedSnapshotIds: ["snapshot-1"],
      reviewedFieldSuggestionIds: [],
      reviewedUnmappedItems: [],
    };

    const tasks = buildResumeImportReviewTasks(document);

    expect(tasks).toEqual([]);
    expect(tasks.some((task) => task.id === "review-pending-items")).toBe(false);
    expect(tasks.some((task) => task.id === "review-source-snapshots")).toBe(false);
  });

  it("creates field suggestions only when import replaces existing basics", () => {
    const document = createEmptyResumeDocument("imported", "Imported");
    document.basics.name = "Old Name";
    document.basics.headline = "Old Headline";
    document.basics.summaryHtml = "<p>Old summary</p>";

    const suggestions = buildBasicsImportFieldSuggestions(
      document.basics,
      {
        ...document.basics,
        name: "New Name",
        headline: "New Headline",
        summaryHtml: "<p>New summary</p>",
      },
      "PDF import",
    );

    expect(suggestions.map((suggestion) => suggestion.field)).toEqual(["name", "headline", "summaryHtml"]);
  });

  it("adds a basics review task when replaced field suggestions remain", () => {
    const document = createEmptyResumeDocument("imported", "Imported");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Frontend Engineer";
    document.basics.email = "jane@example.com";
    document.basics.phone = "13800000000";
    document.importTrace.portfolioImportedAt = new Date().toISOString();
    document.importTrace.fieldSuggestions = [
      {
        id: "field-1",
        field: "headline",
        label: "职位标题",
        importedValue: "Senior Frontend Engineer",
        previousValue: "Frontend Engineer",
        sourceLabel: "PDF import",
      },
    ];

    const tasks = buildResumeImportReviewTasks(document);

    expect(tasks.some((task) => task.id === "review-imported-fields")).toBe(true);
  });

  it("filters reviewed unmapped items out of the active review queue", () => {
    const document = createEmptyResumeDocument("imported", "Imported");
    document.importTrace.unmapped = [
      "Dynamic content was not preserved.",
      "Visual annotations need manual cleanup.",
    ];
    document.importTrace.reviewState.reviewedUnmappedItems = ["Dynamic content was not preserved."];

    expect(getActiveUnmappedItems(document)).toEqual(["Visual annotations need manual cleanup."]);
  });

  it("clears import review state entirely when the review is dismissed", () => {
    const document = createEmptyResumeDocument("imported", "Imported");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Frontend Engineer";
    document.importTrace.portfolioImportedAt = new Date().toISOString();
    document.importTrace.pendingReview = ["Check imported basics"];

    const cleared = clearImportReview(document);

    expect(cleared.importTrace.portfolioImportedAt).toBe("");
    expect(cleared.importTrace.pdfImportedAt).toBe("");
    expect(cleared.importTrace.pendingReview).toEqual([]);
    expect(buildImportReview(cleared)).toBeNull();
  });
});
