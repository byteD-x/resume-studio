// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { ResumeLibraryPage } from "@/components/product/ResumeLibraryPage";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function toSummary(document: ReturnType<typeof createEmptyResumeDocument>): ResumeDashboardSummary {
  return {
    meta: document.meta,
    basics: document.basics,
    targeting: document.targeting,
    ai: document.ai,
    layout: document.layout,
    sections: document.sections,
    importTrace: document.importTrace,
  };
}

describe("resume library page", () => {
  it("shows lineage delete action and cascade confirmation for a source draft", () => {
    const source = createEmptyResumeDocument("lineage-source", "Lineage Source");
    const variant = createEmptyResumeDocument("lineage-variant", "Lineage Variant");
    variant.meta.sourceRefs = Array.from(new Set([...variant.meta.sourceRefs, `resume:${source.meta.id}`]));

    render(<ResumeLibraryPage resumes={[toSummary(source), toSummary(variant)]} />);

    fireEvent.click(screen.getByRole("button", { name: "删除整组" }));

    expect(screen.getByText("删除“Lineage Source”整组版本？")).toBeTruthy();
    expect(screen.getByText("这会删除当前主稿以及其下 1 个定制版本，且无法自动恢复。")).toBeTruthy();
  });
});
