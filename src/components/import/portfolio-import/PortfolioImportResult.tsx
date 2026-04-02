"use client";

import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PortfolioImportResult as PortfolioImportResultValue } from "@/components/import/portfolio-import/types";
import { buildExtractionSummary } from "@/components/import/portfolio-import/utils";

const nextSteps = [
  {
    title: "先核对基础信息",
    description: "确认姓名、标题、联系方式和摘要是否被正确映射。",
  },
  {
    title: "再整理内容",
    description: "把经历、项目和未映射片段补录成更可读的主稿。",
  },
  {
    title: "最后做岗位定制",
    description: "补 JD 和关键词，再进入预览页做最终检查与导出。",
  },
  {
    title: "用导入结果起稿",
    description: "把这次抽取当作第一版，不必一次就整理到最终版。",
  },
] as const;

export function PortfolioImportResult({
  importResult,
  isPending,
  isExtracting,
  onFinish,
}: {
  importResult: PortfolioImportResultValue;
  isPending: boolean;
  isExtracting: boolean;
  onFinish: () => void;
}) {
  const extractionSummary = importResult.urlSummary ? buildExtractionSummary(importResult.urlSummary) : null;

  return (
    <div className="mx-auto w-full max-w-[60rem] overflow-hidden rounded-[1rem] bg-white shadow-sm ring-1 ring-[color:var(--line)]">
      <div className="flex flex-col items-center px-5 pb-8 pt-8 text-center sm:px-8 sm:pb-10 sm:pt-10">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-slate-50 text-[color:var(--ink-strong)] ring-1 ring-[color:var(--line)]">
          <Sparkles className="size-6" />
        </div>
        <h2 className="mb-2 text-[1.4rem] font-semibold tracking-tight text-[color:var(--ink-strong)]">基础信息已提取</h2>
        <p className="mb-8 max-w-[20rem] text-[0.95rem] leading-relaxed text-[color:var(--ink-soft)]">
          原始内容已整理成可编辑草稿，进入编辑器后继续核对与润色即可。
        </p>

        <div className="mb-8 grid w-full grid-cols-1 gap-1 rounded-lg bg-[color:var(--paper-soft)] p-1 ring-1 ring-[color:var(--line)] sm:grid-cols-3 sm:gap-0">
          <div className="flex flex-col items-center py-4">
            <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">识别身份</span>
            <strong className="max-w-full truncate px-2 text-[1rem] font-medium text-[color:var(--ink-strong)]">
              {importResult.summary.name && importResult.summary.name !== "未命名" ? importResult.summary.name : "待补全"}
            </strong>
          </div>
          <div className="flex flex-col items-center py-4 sm:border-l sm:border-[color:var(--line)]">
            <span className="mb-1 text-[0.7rem] font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">工作经历</span>
            <strong className="text-[1rem] font-medium text-[color:var(--ink-strong)]">{importResult.summary.experience} 段</strong>
          </div>
          <div className="flex flex-col items-center py-4 sm:border-l sm:border-[color:var(--line)]">
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

        {importResult.urlSummary && extractionSummary ? (
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

        <div className="home-flow-strip mb-8 w-full text-left md:grid-cols-2">
          {nextSteps.map((step, index) => (
            <article className="home-flow-step" key={step.title}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <Button
          className="h-[2.8rem] w-full max-w-[20rem] justify-center rounded-[0.5rem] bg-[color:var(--ink-strong)] text-white hover:bg-[color:var(--ink)]"
          disabled={isPending || isExtracting}
          onClick={onFinish}
        >
          {isPending || isExtracting ? <Loader2 className="mr-2 size-[1.1rem] animate-spin" /> : null}
          进入内容打磨
          <ChevronRight className="ml-1.5 size-[1.1rem]" />
        </Button>
      </div>
    </div>
  );
}
