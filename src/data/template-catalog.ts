import type { ResumeTemplate, ResumeWriterProfile } from "@/types/resume";

export interface TemplateCatalogItem {
  id: string;
  name: string;
  subtitle: string;
  category: "通用" | "校招" | "设计" | "技术";
  template: ResumeTemplate;
  accent: string;
  background: string;
  summary: string;
  highlights: string[];
  recommendedProfiles: ResumeWriterProfile[];
}

export const templateCatalog: TemplateCatalogItem[] = [
  {
    id: "aurora-grid",
    name: "Aurora Grid",
    subtitle: "双栏",
    category: "通用",
    template: "modern-two-column",
    accent: "#3563d8",
    background:
      "linear-gradient(180deg, rgba(53, 99, 216, 0.12) 0%, rgba(53, 99, 216, 0.02) 100%)",
    summary: "适合大多数岗位，结构稳健，信息密度高。",
    highlights: ["双栏布局", "结构紧凑", "适合主流岗位"],
    recommendedProfiles: ["experienced", "career-switch"],
  },
  {
    id: "campus-line",
    name: "Campus Line",
    subtitle: "校招",
    category: "校招",
    template: "modern-two-column",
    accent: "#0f766e",
    background:
      "linear-gradient(180deg, rgba(15, 118, 110, 0.14) 0%, rgba(15, 118, 110, 0.03) 100%)",
    summary: "教育、项目和实习更靠前，适合校招与应届求职。",
    highlights: ["教育前置", "项目优先", "适合应届投递"],
    recommendedProfiles: ["campus"],
  },
  {
    id: "portfolio-brief",
    name: "Portfolio Brief",
    subtitle: "单栏",
    category: "设计",
    template: "classic-single-column",
    accent: "#875a3c",
    background:
      "linear-gradient(180deg, rgba(135, 90, 60, 0.12) 0%, rgba(135, 90, 60, 0.02) 100%)",
    summary: "留白更多，阅读节奏舒展，适合完整展示经历与作品。",
    highlights: ["单栏阅读", "信息舒展", "打印友好"],
    recommendedProfiles: ["experienced", "career-switch", "campus"],
  },
  {
    id: "engineer-pro",
    name: "Engineer Pro",
    subtitle: "技术",
    category: "技术",
    template: "modern-two-column",
    accent: "#4f46e5",
    background:
      "linear-gradient(180deg, rgba(79, 70, 229, 0.14) 0%, rgba(79, 70, 229, 0.03) 100%)",
    summary: "更适合技术岗位，把项目、技能和结果表达放在前面。",
    highlights: ["技术取向", "结果表达", "适合工程岗位"],
    recommendedProfiles: ["experienced", "campus"],
  },
];

export const templateCategories = ["全部", "通用", "校招", "设计", "技术"] as const;
