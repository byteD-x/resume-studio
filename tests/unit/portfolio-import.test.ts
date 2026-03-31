import { afterEach, describe, expect, it, vi } from "vitest";
import { importPortfolioToResume } from "@/lib/portfolio-import";

describe("portfolio import", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps fallback portfolio data into a resume draft", async () => {
    const result = await importPortfolioToResume({
      resumeId: "default",
    });

    expect(result.document.basics.name).toBeTruthy();
    expect(result.document.sections.some((section) => section.type === "experience")).toBe(true);
    expect(result.document.sections.some((section) => section.type === "skills")).toBe(true);
  });

  it("can crawl the root page plus prioritized child pages for URL imports", async () => {
    const pages = new Map<string, string>([
      [
        "https://portfolio.test/",
        `
        <html>
          <head><title>Jane Doe</title></head>
          <body>
            <h1>Jane Doe</h1>
            <p>Frontend Engineer</p>
            <a href="/about">About</a>
            <a href="/projects">Projects</a>
            <a href="/blog">Blog</a>
          </body>
        </html>
        `,
      ],
      [
        "https://portfolio.test/about",
        `
        <html>
          <head><title>About Jane</title></head>
          <body>
            <h2>About</h2>
            <p>Built growth surfaces and design systems.</p>
          </body>
        </html>
        `,
      ],
      [
        "https://portfolio.test/projects",
        `
        <html>
          <head><title>Selected Projects</title></head>
          <body>
            <h2>Project</h2>
            <p>Resume Studio</p>
            <p>Created a local-first resume editor for structured writing.</p>
          </body>
        </html>
        `,
      ],
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        const html = pages.get(url);

        if (!html) {
          return new Response("missing", { status: 404 });
        }

        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }),
    );

    const result = await importPortfolioToResume({
      source: "url",
      payload: "https://portfolio.test/",
      resumeId: "url-import",
      urlOptions: {
        includeLinkedPages: true,
        maxPages: 3,
      },
    });

    expect(result.urlSummary?.pageCount).toBe(3);
    expect(result.urlSummary?.visitedUrls).toContain("https://portfolio.test/about");
    expect(result.document.meta.sourceRefs).toContain("https://portfolio.test/projects");
    expect(result.document.importTrace.pendingReview.some((entry) => entry.includes("同站页面"))).toBe(true);
    expect(result.document.importTrace.unmapped.some((entry) => entry.includes("动态内容"))).toBe(true);
    expect(result.document.importTrace.snapshots).toHaveLength(3);
    expect(result.document.importTrace.snapshots[0]?.source).toBe("https://portfolio.test/");
  });

  it("prefers AI extraction for URL imports and stores the selected AI settings", async () => {
    const pages = new Map<string, string>([
      [
        "https://portfolio-ai.test/",
        `
        <html>
          <head><title>Jane Doe</title></head>
          <body>
            <h1>Jane Doe</h1>
            <p>Frontend Engineer</p>
            <a href="/projects">Projects</a>
          </body>
        </html>
        `,
      ],
      [
        "https://portfolio-ai.test/projects",
        `
        <html>
          <head><title>Selected Projects</title></head>
          <body>
            <h2>Project</h2>
            <p>Resume Studio</p>
            <p>Built a local-first resume editor for structured writing.</p>
          </body>
        </html>
        `,
      ],
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "https://portfolio-ai.test/" || url === "https://portfolio-ai.test/projects") {
          const html = pages.get(url);
          return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }

        if (url === "http://127.0.0.1:11434/v1/chat/completions") {
          return Response.json({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    hero: {
                      name: "Jane Doe",
                      title: "Frontend Engineer",
                      subtitle: "Specialized in structured writing and design systems.",
                      location: "Shanghai",
                    },
                    about: {
                      zh: "聚焦编辑器、设计系统和内容工作流。",
                    },
                    projects: [
                      {
                        id: "project-1",
                        year: "2025",
                        name: "Resume Studio",
                        summary: "Built a local-first resume editor for structured writing.",
                        techTags: ["Next.js", "TypeScript"],
                        keyOutcomes: ["Improved editing flow for tailored resumes."],
                      },
                    ],
                    skills: [
                      {
                        category: "Frontend",
                        items: ["React", "Next.js", "TypeScript"],
                      },
                    ],
                    contact: {
                      websiteLinks: [{ label: "Portfolio", url: "https://portfolio-ai.test/" }],
                    },
                  }),
                },
              },
            ],
          });
        }

        return new Response("missing", { status: 404 });
      }),
    );

    const result = await importPortfolioToResume({
      source: "url",
      payload: "https://portfolio-ai.test/",
      resumeId: "url-import-ai",
      aiSettings: {
        provider: "openai-compatible",
        model: "qwen3:4b",
        baseUrl: "http://127.0.0.1:11434/v1",
      },
      urlOptions: {
        includeLinkedPages: true,
        maxPages: 2,
      },
    });

    expect(result.urlSummary?.extractionMode).toBe("ai");
    expect(result.urlSummary?.modelLabel).toBe("qwen3:4b");
    expect(result.document.ai.model).toBe("qwen3:4b");
    expect(result.document.basics.location).toBe("Shanghai");
    expect(result.document.sections.find((section) => section.type === "skills")?.items[0]?.tags).toContain("React");
  });

  it("rejects private-network URL imports by default", async () => {
    await expect(
      importPortfolioToResume({
        source: "url",
        payload: "http://127.0.0.1:3000",
        resumeId: "private-url",
      }),
    ).rejects.toThrow("public http(s) host");
  });
});
