"use client";

import type { Route } from "next";
import { Suspense, type DragEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileCode2, Globe, Loader2, Sparkles, Type, UploadCloud } from "lucide-react";
import { AiConfigForm } from "@/components/ai/AiConfigForm";
import { Button } from "@/components/ui/Button";
import { getDefaultClientAiConfig, readClientAiConfig, writeClientAiConfig } from "@/lib/client-ai-config";
import { enhancedResumeAiPresets } from "@/lib/resume-ai";

type ImportSource = "url" | "markdown" | "text" | "pdf";
type ImportAiMode = "rules" | "ai";

type ImportedSection = {
  type: string;
  items?: unknown[];
};

type ImportedDocumentSummary = {
  meta: { id: string };
  basics: { name: string };
  sections: ImportedSection[];
  importTrace?: {
    fieldSuggestions?: Array<{ id: string }>;
  };
};

type ImportedUrlSummary = {
  baseUrl: string;
  mode: "single-page" | "multi-page";
  pageCount: number;
  selectedCandidateCount: number;
  discoveredCandidateCount: number;
  visitedUrls: string[];
  skippedUrls: string[];
  extractionMode?: "rules" | "ai" | "ai-fallback";
  modelLabel?: string;
};

function countImportedItems(sections: ImportedSection[], sectionType: string) {
  return sections.find((section) => section.type === sectionType)?.items?.length ?? 0;
}

function WorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as ImportSource) || "url";
  const [activeTab, setActiveTab] = useState<ImportSource>(
    ["url", "markdown", "text", "pdf"].includes(initialTab) ? initialTab : "url",
  );
  const [inputValue, setInputValue] = useState("");
  const [includeLinkedPages, setIncludeLinkedPages] = useState(true);
  const [maxLinkedPages, setMaxLinkedPages] = useState(3);
  const [importAiMode, setImportAiMode] = useState<ImportAiMode>("ai");
  const [customAiModel, setCustomAiModel] = useState(getDefaultClientAiConfig().model);
  const [customAiBaseUrl, setCustomAiBaseUrl] = useState(getDefaultClientAiConfig().baseUrl);
  const [customAiApiKey, setCustomAiApiKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [importResult, setImportResult] = useState<{
    resumeId: string;
    summary: { projects: number; experience: number; name: string; fieldSuggestionCount: number };
    isPdf?: boolean;
    urlSummary?: ImportedUrlSummary | null;
  } | null>(null);

  const tabs = [
    { id: "url", label: "网站链接", icon: <Globe className="size-[1.1rem]" /> },
    { id: "markdown", label: "Markdown 文本", icon: <FileCode2 className="size-[1.1rem]" /> },
    { id: "text", label: "纯文本片段", icon: <Type className="size-[1.1rem]" /> },
    { id: "pdf", label: "PDF 文件", icon: <UploadCloud className="size-[1.1rem]" /> },
  ] as const;

  const placeholders: Partial<Record<ImportSource, string>> = {
    url: "https://your-portfolio.com 或 Notion 页面链接...",
    markdown: "粘贴简历或作品集的 Markdown 源码...",
    text: "粘贴工作经历、项目介绍或关于我的描述...",
  };

  useEffect(() => {
    const config = readClientAiConfig();
    setCustomAiModel(config.model);
    setCustomAiBaseUrl(config.baseUrl);
    setCustomAiApiKey(config.apiKey);
    setImportAiMode(config.provider === "local" ? "rules" : "ai");
  }, []);

  useEffect(() => {
    const nextTab = (searchParams.get("tab") as ImportSource) || "url";
    if (["url", "markdown", "text", "pdf"].includes(nextTab) && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setError("");
    }
  }, [activeTab, searchParams]);

  function setImportTab(nextTab: ImportSource) {
    setActiveTab(nextTab);
    setError("");

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace((`/import?${params.toString()}`) as Route, { scroll: false });
  }

  function persistImportAiConfig(next: { model?: string; baseUrl?: string; apiKey?: string }) {
    const current = readClientAiConfig();
    writeClientAiConfig({
      ...current,
      provider: "openai-compatible",
      model: next.model ?? customAiModel,
      baseUrl: next.baseUrl ?? customAiBaseUrl,
      apiKey: next.apiKey ?? customAiApiKey,
    });
  }

  const handleTextImport = async () => {
    if (!inputValue.trim()) {
      setError("请先粘贴内容");
      return;
    }

    setError("");
    setIsExtracting(true);

    try {
      const response = await fetch("/api/import/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: activeTab,
          payload: inputValue,
          aiSettings:
            activeTab === "url" && importAiMode === "ai"
              ? {
                  provider: "openai-compatible",
                  model: customAiModel,
                  baseUrl: customAiBaseUrl,
                }
              : undefined,
          apiKey: activeTab === "url" && importAiMode === "ai" ? customAiApiKey : undefined,
          urlOptions:
            activeTab === "url"
              ? {
                  includeLinkedPages,
                  maxPages: maxLinkedPages,
                }
              : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || "无法导入所提供的内容");
      }

      const { document, urlSummary } = (await response.json()) as {
        document: ImportedDocumentSummary;
        urlSummary?: ImportedUrlSummary | null;
      };

      setImportResult({
        resumeId: document.meta.id,
        summary: {
          experience: countImportedItems(document.sections, "experience"),
          fieldSuggestionCount: document.importTrace?.fieldSuggestions?.length ?? 0,
          name: document.basics.name,
          projects: countImportedItems(document.sections, "projects"),
        },
        urlSummary: urlSummary ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入过程中出现错误");
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePdfImport = async (file: File) => {
    setError("");
    setIsExtracting(true);

    try {
      const draftResponse = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starter: "blank",
          template: "aurora-grid",
          title: "旧简历 PDF 解析",
          writerProfile: "experienced",
        }),
      });

      if (!draftResponse.ok) {
        throw new Error("无法创建简历草稿");
      }

      const draft = await draftResponse.json();
      const formData = new FormData();
      formData.append("resumeId", draft.meta.id);
      formData.append("file", file);

      const response = await fetch("/api/import/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        await fetch(`/api/resumes/${draft.meta.id}`, { method: "DELETE" }).catch(() => {});
        throw new Error((await response.json()).error || "无法解析该 PDF 文件");
      }

      const { document } = (await response.json()) as { document: ImportedDocumentSummary };
      setImportResult({
        isPdf: true,
        resumeId: document.meta.id,
        summary: {
          experience: countImportedItems(document.sections, "experience"),
          fieldSuggestionCount: document.importTrace?.fieldSuggestions?.length ?? 0,
          name: document.basics.name || "未识别",
          projects: 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析过程中出现错误");
      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePdfDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (isExtracting) return;

    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      void handlePdfImport(file);
      return;
    }

    setError("请上传标准的 PDF 文件");
  };

  const handleFinish = () => {
    if (!importResult) return;

    setIsExtracting(true);
    startTransition(() => {
      const focus = importResult.isPdf ? "basics" : "content";
      router.push(`/studio/${importResult.resumeId}?onboarding=${importResult.isPdf ? "pdf" : "portfolio"}&focus=${focus}`);
    });
  };

  if (importResult) {
    const extractionSummary =
      importResult.urlSummary?.extractionMode === "ai"
        ? `已用 ${importResult.urlSummary.modelLabel ?? "AI"} 完成结构化抽取`
        : importResult.urlSummary?.extractionMode === "ai-fallback"
          ? "AI 抽取失败，已回退为规则导入"
          : importResult.urlSummary?.mode === "multi-page"
            ? `已抓取 ${importResult.urlSummary.pageCount} 个页面并合并整理`
            : "当前按单页内容导入";

    return (
      <div className="mx-auto max-w-[32rem] overflow-hidden rounded-[1rem] bg-white shadow-sm ring-1 ring-[color:var(--line)]">
        <div className="flex flex-col items-center px-8 pb-10 pt-10 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-slate-50 text-[color:var(--ink-strong)] ring-1 ring-[color:var(--line)]">
            <Sparkles className="size-6" />
          </div>
          <h2 className="mb-2 text-[1.4rem] font-semibold tracking-tight text-[color:var(--ink-strong)]">基础信息已提取</h2>
          <p className="mb-8 max-w-[20rem] text-[0.95rem] leading-relaxed text-[color:var(--ink-soft)]">
            原始内容已整理成可编辑草稿，进入编辑器后继续核对与润色即可。
          </p>

          <div className="mb-8 grid w-full grid-cols-3 gap-0 rounded-lg bg-[color:var(--paper-soft)] p-1 ring-1 ring-[color:var(--line)]">
            <div className="flex flex-col items-center py-4">
              <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">识别身份</span>
              <strong className="max-w-full truncate px-2 text-[1rem] font-medium text-[color:var(--ink-strong)]">
                {importResult.summary.name && importResult.summary.name !== "未命名" ? importResult.summary.name : "待补全"}
              </strong>
            </div>
            <div className="flex flex-col items-center border-l border-[color:var(--line)] py-4">
              <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">工作经历</span>
              <strong className="text-[1rem] font-medium text-[color:var(--ink-strong)]">{importResult.summary.experience} 段</strong>
            </div>
            <div className="flex flex-col items-center border-l border-[color:var(--line)] py-4">
              <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">识别类型</span>
              <strong className="text-[1rem] font-medium text-[color:var(--ink-strong)]">
                {importResult.isPdf ? "旧版 PDF" : "履历片段"}
              </strong>
            </div>
          </div>

          {importResult.summary.fieldSuggestionCount > 0 ? (
            <p className="mb-6 max-w-[24rem] text-[0.85rem] leading-relaxed text-[color:var(--ink-soft)]">
              本次导入覆盖了 {importResult.summary.fieldSuggestionCount} 个基础字段，进入编辑区后可逐条确认。
            </p>
          ) : null}

          {importResult.urlSummary ? (
            <div className="mb-6 w-full rounded-[0.9rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] px-4 py-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">抓取摘要</p>
                  <p className="mt-1 text-[0.9rem] text-[color:var(--ink-soft)]">{extractionSummary}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[0.8rem] font-medium text-[color:var(--ink-strong)] ring-1 ring-[color:var(--line)]">
                  {importResult.urlSummary.selectedCandidateCount} 个扩展页
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {importResult.urlSummary.visitedUrls.slice(0, 4).map((url) => (
                  <div
                    className="truncate rounded-[0.7rem] bg-white px-3 py-2 text-[0.8rem] text-[color:var(--ink-soft)] ring-1 ring-[color:var(--line)]"
                    key={url}
                    title={url}
                  >
                    {url}
                  </div>
                ))}
              </div>

              {importResult.urlSummary.skippedUrls.length > 0 ? (
                <p className="mt-3 text-[0.8rem] text-[color:var(--ink-muted)]">
                  还有 {importResult.urlSummary.skippedUrls.length} 个候选页面未纳入本次导入，进入工作区后可继续核对。
                </p>
              ) : null}
            </div>
          ) : null}

          <Button
            className="h-[2.8rem] w-full max-w-[16rem] justify-center rounded-[0.5rem] bg-[color:var(--ink-strong)] text-white hover:bg-[color:var(--ink)]"
            disabled={isPending || isExtracting}
            onClick={handleFinish}
          >
            {isPending || isExtracting ? <Loader2 className="mr-2 size-[1.1rem] animate-spin" /> : null}
            进入内容打磨
            <ChevronRight className="ml-1.5 size-[1.1rem]" />
          </Button>
        </div>
      </div>
    );
  }

  const isTextMode = activeTab === "markdown" || activeTab === "text";
  const isPdfMode = activeTab === "pdf";

  return (
    <div className="mx-auto w-full max-w-[42rem]">
      <div className="relative mb-6 flex overflow-x-auto border-b border-[color:var(--line)] hide-scrollbar" role="tablist" aria-label="导入方式">
        <ul className="flex items-center gap-6 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  aria-controls={`import-panel-${tab.id}`}
                  aria-selected={isActive}
                  className={`relative flex items-center gap-2 rounded-sm pb-3 pt-2 text-[0.9rem] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300 ${
                    isActive
                      ? "font-medium text-[color:var(--ink-strong)]"
                      : "text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
                  }`}
                  id={`import-tab-${tab.id}`}
                  onClick={() => setImportTab(tab.id as ImportSource)}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                >
                  {tab.icon}
                  {tab.label}
                  {isActive ? (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-t-full bg-[color:var(--ink-strong)]" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        aria-labelledby={`import-tab-${activeTab}`}
        className="relative rounded-[0.75rem] bg-white shadow-sm ring-1 ring-[color:var(--line)] transition-shadow focus-within:ring-2 focus-within:ring-[color:var(--accent)]"
        id={`import-panel-${activeTab}`}
        role="tabpanel"
      >
        {!isPdfMode ? (
          <div className="flex min-h-[16rem] flex-col p-1.5">
            {!isTextMode ? (
              <div className="flex flex-1 flex-col justify-center px-4">
                <input
                  className="w-full bg-transparent px-2 py-3 text-[1.1rem] text-[color:var(--ink-strong)] placeholder:text-slate-300 focus:outline-none"
                  disabled={isExtracting}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder={placeholders.url}
                  spellCheck={false}
                  type="url"
                  value={inputValue}
                />

                {activeTab === "url" ? (
                  <div className="mt-3 rounded-[0.8rem] bg-[color:var(--paper-soft)] px-3 py-3 ring-1 ring-[color:var(--line)]">
                    <label className="mb-3 flex flex-col gap-2 text-left">
                      <span className="text-[0.82rem] font-semibold text-[color:var(--ink-strong)]">网站导入模式</span>
                      <select
                        className="rounded-md border border-[color:var(--line)] bg-white px-3 py-2 text-[0.85rem] text-[color:var(--ink-strong)]"
                        disabled={isExtracting}
                        onChange={(event) => {
                          const nextMode = event.target.value as ImportAiMode;
                          setImportAiMode(nextMode);
                          writeClientAiConfig({
                            ...readClientAiConfig(),
                            apiKey: customAiApiKey,
                            baseUrl: customAiBaseUrl,
                            model: customAiModel,
                            provider: nextMode === "rules" ? "local" : "openai-compatible",
                          });
                        }}
                        value={importAiMode}
                      >
                        <option value="ai">AI 结构化抽取</option>
                        <option value="rules">不用 AI，只走规则导入</option>
                      </select>
                    </label>

                    {importAiMode === "ai" ? (
                      <div className="mb-3">
                        <AiConfigForm
                          apiKey={customAiApiKey}
                          baseUrl={customAiBaseUrl}
                          description=""
                          disabled={isExtracting}
                          model={customAiModel}
                          onApiKeyChange={(value) => {
                            setCustomAiApiKey(value);
                            persistImportAiConfig({ apiKey: value });
                          }}
                          onApplyPreset={(presetId) => {
                            const preset = enhancedResumeAiPresets.find((item) => item.id === presetId);
                            if (!preset) return;
                            setCustomAiModel(preset.settings.model);
                            setCustomAiBaseUrl(preset.settings.baseUrl);
                            persistImportAiConfig({
                              baseUrl: preset.settings.baseUrl,
                              model: preset.settings.model,
                            });
                          }}
                          onBaseUrlChange={(value) => {
                            setCustomAiBaseUrl(value);
                            persistImportAiConfig({ baseUrl: value });
                          }}
                          onModelChange={(value) => {
                            setCustomAiModel(value);
                            persistImportAiConfig({ model: value });
                          }}
                          provider="openai-compatible"
                          showProvider={false}
                          title="网站导入模型"
                        />
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-start gap-3 text-left">
                        <input
                          checked={includeLinkedPages}
                          className="mt-1"
                          disabled={isExtracting}
                          onChange={(event) => setIncludeLinkedPages(event.target.checked)}
                          type="checkbox"
                        />
                        <span>
                          <strong className="block text-[0.86rem] text-[color:var(--ink-strong)]">继续抓取同站关键子页</strong>
                          <span className="block text-[0.78rem] leading-relaxed text-[color:var(--ink-soft)]">
                            优先尝试 About、Projects、Experience、Resume 页面。
                          </span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 text-[0.8rem] text-[color:var(--ink-soft)]">
                        最多抓取
                        <select
                          className="rounded-md border border-[color:var(--line)] bg-white px-2 py-1 text-[0.8rem] text-[color:var(--ink-strong)]"
                          disabled={isExtracting || !includeLinkedPages}
                          onChange={(event) => setMaxLinkedPages(Number(event.target.value))}
                          value={maxLinkedPages}
                        >
                          <option value={2}>2 页</option>
                          <option value={3}>3 页</option>
                          <option value={4}>4 页</option>
                          <option value={5}>5 页</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <textarea
                className="flex-1 w-full resize-none rounded-md bg-transparent p-4 text-[0.95rem] leading-relaxed text-[color:var(--ink-strong)] placeholder:text-slate-300 focus:outline-none"
                disabled={isExtracting}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={placeholders[activeTab]}
                spellCheck={false}
                value={inputValue}
              />
            )}

            <div className="m-[-0.375rem] mt-auto flex items-center justify-between rounded-b-[0.6rem] border-t border-[color:var(--line)] bg-[color:var(--paper-soft)] px-4 py-3">
              <div className="flex items-center text-[0.8rem] text-[color:var(--ink-muted)]">
                {error ? (
                  <span className="font-medium text-red-500">{error}</span>
                ) : (
                  <span>
                    {activeTab === "url" && "确保链接可公开访问"}
                    {activeTab === "markdown" && "结构越清晰，提取越准确"}
                    {activeTab === "text" && "不用在意格式，直接粘贴即可"}
                  </span>
                )}
              </div>

              <Button
                className="h-[2.2rem] min-w-[6rem] rounded-full bg-[color:var(--ink-strong)] text-[0.85rem] hover:bg-[color:var(--ink)]"
                disabled={!inputValue.trim() || isExtracting}
                onClick={handleTextImport}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    提取内容
                    <Sparkles className="ml-1.5 size-3.5 opacity-80" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[20rem] flex-col items-center justify-center p-8 text-center">
            <input
              accept=".pdf,application/pdf"
              className="sr-only"
              disabled={isExtracting}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handlePdfImport(file);
                }
              }}
              ref={pdfInputRef}
              type="file"
            />

            <button
              aria-describedby="pdf-import-help"
              className={`flex h-[10rem] w-[18rem] flex-col items-center justify-center rounded-[1rem] border-2 border-dashed transition-colors ${
                isExtracting
                  ? "border-slate-200 bg-slate-50"
                  : "cursor-pointer border-[color:var(--accent-line)] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-layer)]"
              }`}
              disabled={isExtracting}
              onClick={() => !isExtracting && pdfInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handlePdfDrop}
              type="button"
            >
              {isExtracting ? (
                <div className="flex flex-col items-center text-[color:var(--ink-soft)]">
                  <Loader2 className="mb-3 size-6 animate-spin text-[color:var(--accent)]" />
                  <span className="text-[0.95rem] font-medium">正在提取内容...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-[color:var(--ink-muted)]">
                  <UploadCloud className="mb-3 size-8 text-[color:var(--accent-soft)]" />
                  <span className="mb-1 text-[0.95rem] font-medium text-[color:var(--ink-strong)]">选择 PDF 简历文件</span>
                  <span className="text-[0.8rem]">或将文件拖至此处</span>
                </div>
              )}
            </button>

            {error ? (
              <p className="mt-4 text-[0.85rem] font-medium text-red-500" id="pdf-import-help">
                {error}
              </p>
            ) : (
              <p className="mt-6 max-w-[20rem] text-[0.85rem] text-[color:var(--ink-muted)]" id="pdf-import-help">
                系统会尽量保留基础经历，并在进入编辑器后提示你重点核对需要确认的部分。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PortfolioImportWorkspace() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[color:var(--line)]" />
        </div>
      }
    >
      <WorkspaceInner />
    </Suspense>
  );
}

