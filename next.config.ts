import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/import/pdf": ["./data/**/*"],
    "/api/import/portfolio": ["./data/**/*"],
    "/api/resumes": ["./data/**/*"],
    "/api/resumes/[id]": ["./data/**/*"],
    "/api/resumes/[id]/duplicate": ["./data/**/*"],
    "/api/resumes/[id]/export-pdf": ["./data/**/*"],
    "/api/resumes/[id]/generate-optimized-version": ["./data/**/*"],
    "/api/resumes/[id]/generate-tailored-variant": ["./data/**/*"],
    "/resumes": ["./data/**/*"],
    "/studio/[id]": ["./data/**/*"],
    "/studio/[id]/preview": ["./data/**/*"],
  },
  serverExternalPackages: ["playwright", "pdfjs-dist"],
};

export default nextConfig;
