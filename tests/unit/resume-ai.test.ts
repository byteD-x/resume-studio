import { afterEach, describe, expect, it, vi } from "vitest";
import { createGuidedResumeDocument } from "@/lib/resume-document";
import {
  applySummaryText,
  canUseRemoteResumeAi,
  checkRemoteResumeAiConnection,
  generateRemoteItemSuggestions,
  generateRemoteResumeSummary,
  generateRemoteSummarySuggestions,
  getRemoteResumeAiConfigError,
} from "@/lib/resume-ai";

const originalFetch = global.fetch;
const originalEnv = {
  RESUME_STUDIO_AI_API_KEY: process.env.RESUME_STUDIO_AI_API_KEY,
  OPENAI_COMPATIBLE_API_KEY: process.env.OPENAI_COMPATIBLE_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

function createConfiguredDocument() {
  const document = createGuidedResumeDocument("ai", "AI Resume");
  document.ai.provider = "openai-compatible";
  document.ai.model = "gpt-4.1-mini";
  document.ai.baseUrl = "https://example.com/v1";
  document.basics.headline = "Staff Frontend Engineer";
  document.targeting.role = "Staff Frontend Engineer";
  document.targeting.focusKeywords = ["React", "Next.js"];
  document.sections[0]!.items = [
    {
      id: "exp-1",
      title: "Acme",
      subtitle: "Staff Frontend Engineer",
      location: "Shanghai",
      dateRange: "2023 - Now",
      meta: "",
      summaryHtml: "",
      bulletPoints: ["Led a shared frontend platform migration.", "Improved release confidence across teams."],
      tags: ["React", "Next.js"],
    },
  ];
  return document;
}

describe("resume ai", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    process.env.RESUME_STUDIO_AI_API_KEY = originalEnv.RESUME_STUDIO_AI_API_KEY;
    process.env.OPENAI_COMPATIBLE_API_KEY = originalEnv.OPENAI_COMPATIBLE_API_KEY;
    process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
    vi.restoreAllMocks();
  });

  it("requires remote provider, model, and base url", () => {
    const document = createConfiguredDocument();
    delete process.env.RESUME_STUDIO_AI_API_KEY;
    delete process.env.OPENAI_COMPATIBLE_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(canUseRemoteResumeAi(document.ai)).toBe(true);
    expect(getRemoteResumeAiConfigError(document.ai)).toBeNull();
  });

  it("calls an OpenAI-compatible chat completions endpoint", async () => {
    const document = createConfiguredDocument();
    process.env.RESUME_STUDIO_AI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "聚焦前端平台与设计系统建设，持续推动交付质量与跨团队协作效率提升。",
            },
          },
        ],
      }),
    }) as typeof fetch;

    const summary = await generateRemoteResumeSummary(document);

    expect(summary).toContain("聚焦前端平台");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      }),
    );
  });

  it("normalizes array content and applies summary html", async () => {
    const document = createConfiguredDocument();
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: [
                { text: "摘要：聚焦 React 与 Next.js 平台建设。" },
                { text: "持续改进交付效率与团队协作。" },
              ],
            },
          },
        ],
      }),
    }) as typeof fetch;

    const summary = await generateRemoteResumeSummary(document);
    const nextDocument = applySummaryText(document, summary);

    expect(summary).toBe("聚焦 React 与 Next.js 平台建设。\n持续改进交付效率与团队协作。");
    expect(nextDocument.basics.summaryHtml).toContain("<p>");
    expect(nextDocument.basics.summaryHtml).toContain("聚焦 React 与 Next.js 平台建设。");
  });

  it("builds remote summary suggestions from structured json", async () => {
    const document = createConfiguredDocument();
    process.env.RESUME_STUDIO_AI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                variants: [
                  {
                    label: "定制摘要",
                    detail: "更聚焦岗位关键词。",
                    text: "聚焦前端平台与设计系统建设，持续推进跨团队交付效率提升。",
                  },
                ],
              }),
            },
          },
        ],
      }),
    }) as typeof fetch;

    const suggestions = await generateRemoteSummarySuggestions(document);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.target).toBe("summary");
    expect(suggestions[0]?.label).toBe("定制摘要");
  });

  it("builds remote item suggestions for resume bullets", async () => {
    const document = createConfiguredDocument();
    process.env.RESUME_STUDIO_AI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detail: "更贴近目标岗位表达。",
                summary: "围绕共享前端平台建设，持续提升交付稳定性与团队协作效率。",
                bullets: [
                  "主导共享前端平台迁移，统一关键页面的技术基线。",
                  "推动发布流程收敛，提升跨团队协作与交付稳定性。",
                ],
              }),
            },
          },
        ],
      }),
    }) as typeof fetch;

    const suggestions = await generateRemoteItemSuggestions(
      document,
      "experience",
      document.sections[0]!.items[0]!,
    );

    expect(suggestions.some((item) => item.target === "summary")).toBe(true);
    expect(suggestions.some((item) => item.target === "bullets")).toBe(true);
  });

  it("builds remote skill suggestions", async () => {
    const document = createConfiguredDocument();
    process.env.RESUME_STUDIO_AI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detail: "保留更适合目标岗位的技能词。",
                tags: ["React", "Next.js", "TypeScript", "Design Systems"],
              }),
            },
          },
        ],
      }),
    }) as typeof fetch;

    const suggestions = await generateRemoteItemSuggestions(document, "skills", {
      id: "skill-1",
      title: "Skills",
      subtitle: "",
      location: "",
      dateRange: "",
      meta: "",
      summaryHtml: "",
      bulletPoints: [],
      tags: ["React", "Next.js", "TypeScript"],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.target).toBe("tags");
    expect(Array.isArray(suggestions[0]?.nextValue)).toBe(true);
  });

  it("checks Ollama connectivity without requiring an api key", async () => {
    const document = createConfiguredDocument();
    document.ai.model = "qwen3:4b";
    document.ai.baseUrl = "http://127.0.0.1:11434/v1";
    delete process.env.RESUME_STUDIO_AI_API_KEY;
    delete process.env.OPENAI_COMPATIBLE_API_KEY;
    delete process.env.OPENAI_API_KEY;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: "qwen3:4b" }, { id: "qwen3:8b" }],
      }),
    }) as typeof fetch;

    const result = await checkRemoteResumeAiConnection(document.ai);

    expect(result.modelFound).toBe(true);
    expect(result.isLocalOllama).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/v1/models",
      expect.objectContaining({
        headers: {},
        method: "GET",
      }),
    );
  });

  it("warns when the configured model is missing from the remote service", async () => {
    const document = createConfiguredDocument();
    document.ai.model = "qwen3:14b";
    document.ai.baseUrl = "http://127.0.0.1:11434/v1";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: "qwen3:4b" }, { id: "qwen3:8b" }],
      }),
    }) as typeof fetch;

    const result = await checkRemoteResumeAiConnection(document.ai);

    expect(result.modelFound).toBe(false);
    expect(result.availableModels).toEqual(["qwen3:4b", "qwen3:8b"]);
    expect(result.message).toContain("not installed");
  });
});
