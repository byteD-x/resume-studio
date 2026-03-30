"use client";

import { useEffect, useRef, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileCode2, Globe, Loader2, Sparkles, Type, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ImportSource = "url" | "markdown" | "text" | "pdf";

function WorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialTab = (searchParams.get("tab") as ImportSource) || "url";
  const [activeTab, setActiveTab] = useState<ImportSource>(["url", "markdown", "text", "pdf"].includes(initialTab) ? initialTab : "url");
  
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [importResult, setImportResult] = useState<{
    resumeId: string;
    summary: { projects: number; experience: number; name: string };
    isPdf?: boolean;
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
    text: "粘贴任意格式的工作经历、项目介绍或关于我的描述...",
  };

  const handleTextImport = async () => {
    if (!inputValue.trim()) {
      setError("请先粘贴内容");
      return;
    }
    setError("");
    setIsExtracting(true);

    try {
      const res = await fetch("/api/import/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: activeTab,
          payload: inputValue,
        }),
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || "无法导入所提供的内容");
      }

      const { document } = await res.json();
      const expCount = document.sections.find((s: any) => s.type === "experience")?.items?.length || 0;
      const projCount = document.sections.find((s: any) => s.type === "projects")?.items?.length || 0;
      
      setImportResult({
        resumeId: document.meta.id,
        summary: {
          name: document.basics.name,
          projects: projCount,
          experience: expCount
        }
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
      // Create initial draft
      const draftRes = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "旧简历 PDF 解析",
          starter: "blank",
          writerProfile: "experienced",
          template: "modern-two-column",
        }),
      });
      
      if (!draftRes.ok) throw new Error("无法创建简历草稿");
      const draft = await draftRes.json();
      
      const formData = new FormData();
      formData.append("resumeId", draft.meta.id);
      formData.append("file", file);
      
      const res = await fetch("/api/import/pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // cleanup draft on error
        await fetch(`/api/resumes/${draft.meta.id}`, { method: "DELETE" }).catch(() => {});
        throw new Error((await res.json()).error || "无法解析此 PDF 文件");
      }

      const { document } = await res.json();
      
      setImportResult({
        resumeId: document.meta.id,
        isPdf: true,
        summary: {
          name: document.basics.name || "未识别",
          projects: 0,
          experience: document.sections.find((s: any) => s.type === "experience")?.items?.length || 0,
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析过程出现错误");
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    } finally {
      setIsExtracting(false);
    }
  };

  const handePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isExtracting) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      void handlePdfImport(file);
    } else {
      setError("请上传标准的 PDF 文件");
    }
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
    return (
      <div className="mx-auto max-w-[32rem] overflow-hidden rounded-[1rem] bg-white ring-1 ring-[color:var(--line)] shadow-sm">
        <div className="flex flex-col items-center p-8 text-center pt-10 pb-10">
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-slate-50 text-[color:var(--ink-strong)] ring-1 ring-[color:var(--line)]">
            <Sparkles className="size-6" />
          </div>
          <h2 className="mb-2 text-[1.4rem] font-semibold tracking-tight text-[color:var(--ink-strong)]">
            基础信息已提取
          </h2>
          <p className="mb-8 text-[0.95rem] text-[color:var(--ink-soft)] max-w-[20rem] leading-relaxed">
            我们已尽力将内容结构化。如果不完美，请在工作区自由补充或修改。
          </p>
          
          <div className="mb-8 grid w-full grid-cols-3 gap-0 rounded-lg bg-[color:var(--paper-soft)] p-1 ring-1 ring-[color:var(--line)]">
            <div className="flex flex-col items-center py-4">
              <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">识别身份</span>
              <strong className="text-[1rem] font-medium text-[color:var(--ink-strong)] truncate max-w-full px-2">
                {importResult.summary.name && importResult.summary.name !== "未命名" ? importResult.summary.name : "待补充"}
              </strong>
            </div>
            <div className="flex flex-col items-center border-l border-[color:var(--line)] py-4">
              <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">工作经历</span>
              <strong className="text-[1rem] font-medium text-[color:var(--ink-strong)]">{importResult.summary.experience} 段</strong>
            </div>
            <div className="flex flex-col items-center border-l border-[color:var(--line)] py-4">
              <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">识别类型</span>
              <strong className="text-[1rem] font-medium text-[color:var(--ink-strong)]">
                {importResult.isPdf ? "旧版 PDF" : "履历段落"}
              </strong>
            </div>
          </div>
          
          <Button 
            className="h-[2.8rem] w-full max-w-[16rem] justify-center rounded-[0.5rem] bg-[color:var(--ink-strong)] text-white hover:bg-[color:var(--ink)]" 
            onClick={handleFinish} 
            disabled={isPending || isExtracting}
          >
            {(isPending || isExtracting) ? <Loader2 className="mr-2 size-[1.1rem] animate-spin" /> : null}
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
      {/* Sleek Tab Navigation */}
      <div className="relative mb-6 flex overflow-x-auto border-b border-[color:var(--line)] hide-scrollbar">
        <ul className="flex items-center gap-6 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => { setActiveTab(tab.id as ImportSource); setError(""); }}
                  className={`relative flex items-center gap-2 pb-3 pt-2 text-[0.9rem] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300 rounded-sm ${
                    isActive
                      ? "font-medium text-[color:var(--ink-strong)]"
                      : "text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-t-full bg-[color:var(--ink-strong)]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Modern Input Area */}
      <div className="relative rounded-[0.75rem] bg-white ring-1 ring-[color:var(--line)] focus-within:ring-2 focus-within:ring-[color:var(--accent)] shadow-sm transition-shadow">
        {!isPdfMode ? (
          <div className="flex min-h-[16rem] flex-col p-1.5">
            {!isTextMode ? (
              <div className="flex flex-1 flex-col justify-center px-4">
                <input
                  type="url"
                  className="w-full bg-transparent px-2 py-3 text-[1.1rem] text-[color:var(--ink-strong)] placeholder:text-slate-300 focus:outline-none"
                  placeholder={placeholders.url}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isExtracting}
                  spellCheck={false}
                />
              </div>
            ) : (
              <textarea
                className="flex-1 w-full resize-none rounded-md bg-transparent p-4 text-[0.95rem] leading-relaxed text-[color:var(--ink-strong)] placeholder:text-slate-300 focus:outline-none"
                placeholder={placeholders[activeTab]}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isExtracting}
                spellCheck={false}
              />
            )}

            <div className="flex items-center justify-between border-t border-[color:var(--line)] bg-[color:var(--paper-soft)] px-4 py-3 rounded-b-[0.6rem] m-[-0.375rem] mt-auto">
              <div className="flex items-center text-[0.8rem] text-[color:var(--ink-muted)]">
                {error ? (
                  <span className="text-red-500 font-medium">{error}</span>
                ) : (
                  <span>
                    {activeTab === "url" && "确保链接公开可访问"}
                    {activeTab === "markdown" && "结构越清晰，提取越准确"}
                    {activeTab === "text" && "不要在意格式，直接粘贴即可"}
                  </span>
                )}
              </div>
              
              <Button 
                onClick={handleTextImport} 
                disabled={!inputValue.trim() || isExtracting}
                className="h-[2.2rem] min-w-[6rem] rounded-full text-[0.85rem] bg-[color:var(--ink-strong)] hover:bg-[color:var(--ink)]"
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
          <div className="flex min-h-[20rem] flex-col p-8 items-center justify-center text-center">
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              ref={pdfInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePdfImport(file);
              }}
              disabled={isExtracting}
            />
            
            <div 
              className={`flex flex-col items-center justify-center w-[18rem] h-[10rem] border-2 border-dashed rounded-[1rem] transition-colors ${
                isExtracting ? "border-slate-200 bg-slate-50" : "border-[color:var(--accent-line)] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-layer)] cursor-pointer"
              }`}
              onClick={() => !isExtracting && pdfInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handePdfDrop}
            >
              {isExtracting ? (
                <div className="flex flex-col items-center text-[color:var(--ink-soft)]">
                  <Loader2 className="mb-3 size-6 animate-spin text-[color:var(--accent)]" />
                  <span className="text-[0.95rem] font-medium">智能抽取图文内容...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-[color:var(--ink-muted)]">
                  <UploadCloud className="mb-3 size-8 text-[color:var(--accent-soft)]" />
                  <span className="text-[0.95rem] font-medium text-[color:var(--ink-strong)] mb-1">选择 PDF 简历文件</span>
                  <span className="text-[0.8rem]">或将文件拖至此处</span>
                </div>
              )}
            </div>

            {error ? (
              <p className="mt-4 text-[0.85rem] text-red-500 font-medium">{error}</p>
            ) : (
              <p className="mt-6 max-w-[20rem] text-[0.85rem] text-[color:var(--ink-muted)]">
                系统将尽可能保留基础经历，并在进入编辑器后提醒您重点需要校准的部分。
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
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="size-6 animate-spin text-[color:var(--line)]" /></div>}>
      <WorkspaceInner />
    </Suspense>
  );
}
