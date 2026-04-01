import { getTemplateFamily } from "@/data/template-catalog";
import { createEmptyResumeDocument, getResumeTemplateLayoutPreset } from "@/lib/resume-document";
import { ensureEditorDocument } from "@/lib/resume-editor";
import { serializeResumeToMarkdown } from "@/lib/resume-markdown";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeEditorStylePreset } from "@/components/product/editor/workspace/types";

export function createBlankMarkdownDocument(current: ResumeDocument) {
  const empty = createEmptyResumeDocument(current.meta.id, current.meta.title, {
    writerProfile: current.meta.writerProfile,
    template: current.meta.template,
  });

  return ensureEditorDocument({
    ...empty,
    meta: {
      ...empty.meta,
      title: current.meta.title,
    },
    basics: {
      ...empty.basics,
      summaryHtml: "",
    },
  });
}

export function createMarkdownStarter(current: ResumeDocument) {
  return serializeResumeToMarkdown(createBlankMarkdownDocument(current));
}

export function mergeLayoutForTemplateSwitch(
  document: ResumeDocument,
  template: ResumeDocument["meta"]["template"],
) {
  const currentPreset = getResumeTemplateLayoutPreset(document.meta.template);
  const nextPreset = getResumeTemplateLayoutPreset(template);
  const mergedLayout: ResumeDocument["layout"] = {
    ...nextPreset,
  };

  for (const key of Object.keys(nextPreset) as Array<keyof ResumeDocument["layout"]>) {
    if (key === "customCss") {
      mergedLayout.customCss = document.layout.customCss;
      continue;
    }

    if (document.layout[key] !== currentPreset[key]) {
      mergedLayout[key] = document.layout[key] as never;
    }
  }

  return mergedLayout;
}

export function buildStylePresetLayout(
  document: ResumeDocument,
  presetId: ResumeEditorStylePreset,
): ResumeDocument["layout"] {
  if (presetId === "balanced") {
    return getResumeTemplateLayoutPreset(document.meta.template);
  }

  const templateFamily = getTemplateFamily(document.meta.template);

  if (presetId === "compact") {
    return {
      ...document.layout,
      marginsMm: 11,
      lineHeight: 1.33,
      paragraphGapMm: 2.2,
      bodyFontSizePt: 9.2,
      sectionTitleSizePt: 10.4,
      itemTitleSizePt: 10.2,
      metaFontSizePt: 8.6,
      nameSizePt: 22,
      headlineSizePt: 10.2,
      sectionGapMm: 4.3,
      itemGapMm: 3.2,
      columnGapMm: templateFamily === "two-column" ? 7 : 0,
      listGapMm: 0.45,
      sectionTitleStyle: "minimal",
      sectionTitleAlign: "left",
      pageShadowVisible: true,
      showSectionDividers: false,
    };
  }

  return {
    ...document.layout,
    marginsMm: 16,
    lineHeight: 1.56,
    paragraphGapMm: 3.8,
    bodyFontSizePt: 9.9,
    sectionTitleSizePt: 12.4,
    itemTitleSizePt: 11.4,
    metaFontSizePt: 9.2,
    nameSizePt: 27,
    headlineSizePt: 11.6,
    sectionGapMm: 6.8,
    itemGapMm: 4.8,
    columnGapMm: templateFamily === "two-column" ? 10 : 0,
    listGapMm: 0.9,
    sectionTitleStyle: "filled",
    sectionTitleAlign: "left",
    pageShadowVisible: true,
    showSectionDividers: true,
  };
}
