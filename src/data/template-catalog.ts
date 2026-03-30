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
    summary: "适合常规岗位。",
    highlights: ["双栏", "紧凑", "通用"],
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
    summary: "教育和项目靠前。",
    highlights: ["校招", "双栏", "项目优先"],
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
    summary: "适合完整展示经历。",
    highlights: ["单栏", "清晰", "打印友好"],
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
    summary: "适合技术岗位。",
    highlights: ["技术", "双栏", "结果"],
    recommendedProfiles: ["experienced", "campus"],
  },
];

export const templateCategories = ["全部", "通用", "校招", "设计", "技术"] as const;
