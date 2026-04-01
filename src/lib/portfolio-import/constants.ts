export const MAX_HTML_BYTES = 1_500_000;
export const FETCH_TIMEOUT_MS = 10_000;

export const defaultPortfolioPayload = [
  "Resume Candidate",
  "Product-minded Engineer",
  "Builds structured resume workflows and editing experiences.",
  "Project",
  "Resume Studio",
  "Built a local-first editor for writing and refining resumes.",
  "Skills",
  "React",
  "TypeScript",
  "Next.js",
].join("\n");

export const crawlKeywords = [
  "about",
  "profile",
  "resume",
  "cv",
  "experience",
  "work",
  "project",
  "portfolio",
  "case",
  "case-study",
  "intern",
  "career",
  "timeline",
  "education",
  "skills",
] as const;
