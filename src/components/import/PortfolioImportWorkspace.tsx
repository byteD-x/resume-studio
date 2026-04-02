"use client";

import type { Route } from "next";
import { Suspense, type DragEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PortfolioImportPdfPanel } from "@/components/import/portfolio-import/PortfolioImportPdfPanel";
import { PortfolioImportResult } from "@/components/import/portfolio-import/PortfolioImportResult";
import { PortfolioImportTabs } from "@/components/import/portfolio-import/PortfolioImportTabs";
import { PortfolioImportTextPanel } from "@/components/import/portfolio-import/PortfolioImportTextPanel";
import { useRouteWarmup } from "@/components/product/useRouteWarmup";
import type {
  ImportAiMode,
  ImportSource,
  ImportedDocumentSummary,
  ImportedUrlSummary,
  PortfolioImportResult as PortfolioImportResultValue,
} from "@/components/import/portfolio-import/types";
import { countImportedItems, getImportPlaceholder, isImportSource } from "@/components/import/portfolio-import/utils";
import {
  getDefaultClientAiConfig,
  readClientAiConfig,
  writeClientAiConfig,
} from "@/lib/client-ai-config";
import { enhancedResumeAiPresets } from "@/lib/resume-ai";

function WorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ImportSource>(isImportSource(initialTab) ? initialTab : "url");
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
  const [importResult, setImportResult] = useState<PortfolioImportResultValue | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useRouteWarmup({
    includeLastResume: true,
    routes: ["/templates", "/resumes"],
  });

  useEffect(() => {
    const config = readClientAiConfig();
    setCustomAiModel(config.model);
    setCustomAiBaseUrl(config.baseUrl);
    setCustomAiApiKey(config.apiKey);
    setImportAiMode(config.provider === "local" ? "rules" : "ai");
  }, []);

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    if (isImportSource(nextTab) && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setError("");
    }
  }, [activeTab, searchParams]);

  function persistImportAiConfig(next: { model?: string; baseUrl?: string; apiKey?: string; provider?: "local" | "openai-compatible" }) {
    const current = readClientAiConfig();
    writeClientAiConfig({
      ...current,
      provider: next.provider ?? "openai-compatible",
      model: next.model ?? customAiModel,
      baseUrl: next.baseUrl ?? customAiBaseUrl,
      apiKey: next.apiKey ?? customAiApiKey,
    });
  }

  function setImportTab(nextTab: ImportSource) {
    setActiveTab(nextTab);
    setError("");

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace((`/import?${params.toString()}`) as Route, { scroll: false });
  }

  function buildImportResult(document: ImportedDocumentSummary, urlSummary?: ImportedUrlSummary | null, isPdf?: boolean) {
    return {
      isPdf,
      resumeId: document.meta.id,
      summary: {
        experience: countImportedItems(document.sections, "experience"),
        fieldSuggestionCount: document.importTrace?.fieldSuggestions?.length ?? 0,
        name: document.basics.name || (isPdf ? "未识别" : ""),
        projects: isPdf ? 0 : countImportedItems(document.sections, "projects"),
      },
      urlSummary: urlSummary ?? null,
    } satisfies PortfolioImportResultValue;
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

      setImportResult(buildImportResult(document, urlSummary));
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
      setImportResult(buildImportResult(document, null, true));
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
    router.prefetch(`/studio/${importResult.resumeId}`);
    router.prefetch(`/studio/${importResult.resumeId}/preview`);
    startTransition(() => {
      const focus = importResult.isPdf ? "basics" : "content";
      router.push(`/studio/${importResult.resumeId}?onboarding=${importResult.isPdf ? "pdf" : "portfolio"}&focus=${focus}`);
    });
  };

  if (importResult) {
    return (
      <PortfolioImportResult
        importResult={importResult}
        isExtracting={isExtracting}
        isPending={isPending}
        onFinish={handleFinish}
      />
    );
  }

  const textModeTab = activeTab === "pdf" ? "url" : activeTab;

  return (
    <div className="mx-auto max-w-[44rem]">
      <PortfolioImportTabs activeTab={activeTab} onChange={setImportTab} />

      <div
        aria-labelledby={`import-tab-${activeTab}`}
        className="relative rounded-[0.75rem] bg-white shadow-sm ring-1 ring-[color:var(--line)] transition-shadow focus-within:ring-2 focus-within:ring-[color:var(--accent)]"
        id={`import-panel-${activeTab}`}
        role="tabpanel"
      >
        {activeTab === "pdf" ? (
          <PortfolioImportPdfPanel
            error={error}
            inputRef={pdfInputRef}
            isExtracting={isExtracting}
            onDrop={handlePdfDrop}
            onFileSelect={(file) => void handlePdfImport(file)}
            onOpenFilePicker={() => pdfInputRef.current?.click()}
          />
        ) : (
          <PortfolioImportTextPanel
            activeTab={textModeTab}
            customAiApiKey={customAiApiKey}
            customAiBaseUrl={customAiBaseUrl}
            customAiModel={customAiModel}
            error={error}
            importAiMode={importAiMode}
            includeLinkedPages={includeLinkedPages}
            inputValue={inputValue}
            isExtracting={isExtracting}
            maxLinkedPages={maxLinkedPages}
            onAiApiKeyChange={(value) => {
              setCustomAiApiKey(value);
              persistImportAiConfig({ apiKey: value });
            }}
            onAiBaseUrlChange={(value) => {
              setCustomAiBaseUrl(value);
              persistImportAiConfig({ baseUrl: value });
            }}
            onAiModeChange={(mode) => {
              setImportAiMode(mode);
              persistImportAiConfig({ provider: mode === "rules" ? "local" : "openai-compatible" });
            }}
            onAiModelChange={(value) => {
              setCustomAiModel(value);
              persistImportAiConfig({ model: value });
            }}
            onApplyAiPreset={(presetId) => {
              const preset = enhancedResumeAiPresets.find((item) => item.id === presetId);
              if (!preset) return;
              setCustomAiModel(preset.settings.model);
              setCustomAiBaseUrl(preset.settings.baseUrl);
              persistImportAiConfig({
                baseUrl: preset.settings.baseUrl,
                model: preset.settings.model,
              });
            }}
            onImport={() => void handleTextImport()}
            onIncludeLinkedPagesChange={setIncludeLinkedPages}
            onInputChange={setInputValue}
            onMaxLinkedPagesChange={setMaxLinkedPages}
            placeholder={getImportPlaceholder(textModeTab)}
          />
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
