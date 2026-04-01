import { editorSectionDefinitions } from "@/lib/resume-editor";

export type ResumeEditorSectionPanel = (typeof editorSectionDefinitions)[number]["type"];
export type ResumeEditorImportReviewKind = "pdf" | "portfolio";
export type ResumeEditorStylePreset = "balanced" | "compact" | "editorial";
