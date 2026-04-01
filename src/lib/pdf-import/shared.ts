import type { ResumeSection } from "@/types/resume";

export interface RawPdfLine {
  page: number;
  text: string;
  x: number;
  y: number;
  fontName: string;
  fontSize: number;
}

export interface ImportedPdfSection {
  heading: string;
  lines: string[];
}

export const headingSectionMap = new Map<string, ResumeSection["type"]>([
  ["summary", "summary"],
  ["professional summary", "summary"],
  ["profile", "summary"],
  ["about", "summary"],
  ["overview", "summary"],
  ["experience", "experience"],
  ["work experience", "experience"],
  ["professional experience", "experience"],
  ["employment", "experience"],
  ["projects", "projects"],
  ["selected projects", "projects"],
  ["project experience", "projects"],
  ["education", "education"],
  ["education background", "education"],
  ["skills", "skills"],
  ["technical skills", "skills"],
  ["core skills", "skills"],
  ["工作经历", "experience"],
  ["项目经历", "projects"],
  ["项目", "projects"],
  ["教育经历", "education"],
  ["教育背景", "education"],
  ["技能", "skills"],
  ["专业技能", "skills"],
  ["个人简介", "summary"],
  ["职业摘要", "summary"],
  ["摘要", "summary"],
]);
