import { getTemplateCatalogItem } from "@/data/template-catalog";
import { hasResumeRenderableContent } from "@/lib/resume-content";
import { getPreviewDensity } from "@/lib/resume-preview/density";
import { sanitizeImageSrc } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";

export interface PreviewTemplateContext {
  accent: string;
  asideSections: ReturnType<typeof getPreviewDensity>["visibleSections"];
  contactJustify: "center" | "flex-start";
  density: ReturnType<typeof getPreviewDensity>;
  hasPhoto: boolean;
  hasRenderableContent: boolean;
  headerTextAlign: "center" | "left";
  isModern: boolean;
  mainSections: ReturnType<typeof getPreviewDensity>["visibleSections"];
  photoInSidebar: boolean;
  safePhotoSrc: string;
  sectionDivider: string;
  sectionHeaderBackground: string;
  sectionHeaderPadding: string;
}

export function buildPreviewTemplateContext(document: ResumeDocument): PreviewTemplateContext {
  const templateDefinition = getTemplateCatalogItem(document.meta.template);
  const isModern = templateDefinition.family === "two-column";
  const accent = document.layout.accentColor;
  const density = getPreviewDensity(document);
  const safePhotoSrc = sanitizeImageSrc(document.basics.photoUrl);
  const hasPhoto = document.basics.photoVisible && safePhotoSrc.length > 0;
  const photoInSidebar = hasPhoto && isModern && document.basics.photoPosition === "sidebar";
  const headerTextAlign = document.layout.headerAlign === "center" ? "center" : "left";
  const contactJustify = document.layout.headerAlign === "center" ? "center" : "flex-start";
  const sectionDivider = document.layout.showSectionDividers ? "1px solid var(--line)" : "0";
  const sectionHeaderBackground =
    document.layout.sectionTitleStyle === "filled"
      ? "color-mix(in srgb, var(--accent) 12%, white)"
      : "transparent";
  const sectionHeaderPadding =
    document.layout.sectionTitleStyle === "filled" ? "1.8mm 2.2mm" : isModern ? "0 0 2mm" : "2.2mm 0 0";
  const asideSectionTypes = new Set(["summary", "skills", "education"]);
  const asideSections = isModern
    ? density.visibleSections.filter((section) => asideSectionTypes.has(section.type))
    : [];
  const mainSections = isModern
    ? density.visibleSections.filter((section) => !asideSectionTypes.has(section.type))
    : density.visibleSections;

  return {
    accent,
    asideSections,
    contactJustify,
    density,
    hasPhoto,
    hasRenderableContent: hasResumeRenderableContent(document),
    headerTextAlign,
    isModern,
    mainSections,
    photoInSidebar,
    safePhotoSrc,
    sectionDivider,
    sectionHeaderBackground,
    sectionHeaderPadding,
  };
}
