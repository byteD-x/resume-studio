"use client";

import { useEffect, useEffectEvent } from "react";
import type { MutableRefObject } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { EditorPanel, EditorPanelItem } from "@/components/product/editor/ResumeEditorSidebar";
import { resolveImportStatusMessage, resolveLatestImportKind } from "@/components/product/editor/resume-editor-workspace";
import type { PendingEditorConfirmation } from "@/components/product/editor/useResumeEditorSectionActions";
import { readClientAiConfig } from "@/lib/client-ai-config";
import { getJsonOrThrow } from "@/lib/client-auth";
import {
  buildOptimizedResumeTitle,
  getResumeOptimizationGoalLabel,
} from "@/lib/resume-derivatives";
import type { ResumeOptimizationGoal } from "@/lib/resume-layout";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import { buildTailoredVariantPlan, type TailoredVariantPlan } from "@/lib/resume-tailoring";
import type { ResumeDocument } from "@/types/resume";

type FormPanel = Exclude<EditorPanel, "markdown">;

interface UpdateDocumentOptions {
  message?: string;
  historyLabel?: string;
  clearDeletion?: boolean;
}

export function useResumeEditorPageActions({
  clientAiApiKey,
  editorSurfaceRef,
  latestDocumentRef,
  latestMarkdownErrorRef,
  lastFormPanelRef,
  navigateBack,
  panelMetaMap,
  pushRoute,
  saveDocument,
  searchParams,
  setActivePanel,
  setClientAiApiKey,
  setConfirmation,
  setIsCreatingOptimizedVersion,
  setGeneratedAiSummarySuggestions,
  setIsGeneratingAiSummary,
  setIsGeneratingVariant,
  setStatusMessage,
  updateDocument,
}: {
  clientAiApiKey: string;
  editorSurfaceRef: MutableRefObject<HTMLElement | null>;
  latestDocumentRef: MutableRefObject<ResumeDocument>;
  latestMarkdownErrorRef: MutableRefObject<string | null>;
  lastFormPanelRef: MutableRefObject<FormPanel>;
  navigateBack: (fallbackPath: string) => void;
  panelMetaMap: Map<EditorPanel, EditorPanelItem>;
  pushRoute: (href: string) => void;
  saveDocument: (mode: "manual" | "auto") => Promise<boolean>;
  searchParams: ReadonlyURLSearchParams;
  setActivePanel: (value: EditorPanel) => void;
  setClientAiApiKey: (value: string) => void;
  setConfirmation: (value: PendingEditorConfirmation | null) => void;
  setIsCreatingOptimizedVersion: (value: boolean) => void;
  setGeneratedAiSummarySuggestions: (value: ResumeAssistSuggestion[]) => void;
  setIsGeneratingAiSummary: (value: boolean) => void;
  setIsGeneratingVariant: (value: boolean) => void;
  setStatusMessage: (value: string) => void;
  updateDocument: (updater: (current: ResumeDocument) => ResumeDocument, options?: UpdateDocumentOptions) => void;
}) {
  const focusFormPanel = (panel: FormPanel, message = "继续编辑") => {
    lastFormPanelRef.current = panel;
    setActivePanel(panel);
    setStatusMessage(message);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        editorSurfaceRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  const syncClientAiConfig = useEffectEvent(() => {
    const config = readClientAiConfig();
    setClientAiApiKey(config.apiKey);

    const currentAi = latestDocumentRef.current.ai;
    if (
      currentAi.provider !== config.provider ||
      currentAi.model !== config.model ||
      currentAi.baseUrl !== config.baseUrl
    ) {
      updateDocument(
        (current) => ({
          ...current,
          ai: {
            ...current.ai,
            provider: config.provider,
            model: config.model,
            baseUrl: config.baseUrl,
          },
        }),
        {
          historyLabel: "同步本地 AI 配置",
          clearDeletion: true,
        },
      );
    }
  });

  useEffect(() => {
    syncClientAiConfig();
  }, []);

  const handleOpenPreview = async () => {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown");
      return;
    }

    const saved = await saveDocument("manual");
    if (!saved) {
      return;
    }

    pushRoute(`/studio/${latestDocumentRef.current.meta.id}/preview`);
  };

  const handleGenerateTailoredVariant = async () => {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown");
      return;
    }

    const plan = buildTailoredVariantPlan(latestDocumentRef.current);
    if (!plan.canGenerate) {
      setActivePanel("targeting");
      lastFormPanelRef.current = "targeting";
      setStatusMessage("先补关键词或 JD");
      return;
    }

    const saved = await saveDocument("manual");
    if (!saved) {
      return;
    }

    setIsGeneratingVariant(true);

    try {
      const result = await getJsonOrThrow<{
        document: ResumeDocument;
        plan: TailoredVariantPlan;
        remoteSummaryApplied?: boolean;
        remoteSummaryError?: string | null;
      }>(
        await fetch(`/api/resumes/${latestDocumentRef.current.meta.id}/generate-tailored-variant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document: latestDocumentRef.current,
            title: plan.titleSuggestion,
            apiKey: clientAiApiKey,
          }),
        }),
      );

      setStatusMessage(
        result.remoteSummaryApplied
          ? "已生成岗位定制版，并补上 AI 摘要建议"
          : result.plan.missingKeywords.length > 0
            ? `已生成定制版，但仍缺 ${result.plan.missingKeywords.length} 个关键词`
            : result.remoteSummaryError
              ? `已生成岗位定制版，但 AI 摘要未应用：${result.remoteSummaryError}`
              : "已生成岗位定制版",
      );
      pushRoute(`/studio/${result.document.meta.id}?focus=ai`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "生成定制版失败");
    } finally {
      setIsGeneratingVariant(false);
    }
  };

  const handleCreateOptimizedVersion = async (
    goal: ResumeOptimizationGoal = "two-page",
    options?: {
      focus?: "content" | "design";
      successMessage?: string;
    },
  ) => {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown");
      return false;
    }

    const saved = await saveDocument("manual");
    if (!saved) {
      return false;
    }

    setIsCreatingOptimizedVersion(true);
    const goalLabel = getResumeOptimizationGoalLabel(goal);

    try {
      const result = await getJsonOrThrow<{ document: ResumeDocument }>(
        await fetch(`/api/resumes/${latestDocumentRef.current.meta.id}/generate-optimized-version`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal,
            title: buildOptimizedResumeTitle(latestDocumentRef.current, goal),
          }),
        }),
      );

      setStatusMessage(
        options?.successMessage ?? `已另存为${goalLabel}，接下来可以在新稿里压缩篇幅`,
      );
      pushRoute(`/studio/${result.document.meta.id}?focus=${options?.focus ?? "content"}`);
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `新增${goalLabel}失败`);
      return false;
    } finally {
      setIsCreatingOptimizedVersion(false);
    }
  };

  const handleBack = async () => {
    if (latestMarkdownErrorRef.current) {
      setConfirmation({
        title: "Markdown 还有解析错误",
        description: "现在返回会放弃未保存的 Markdown 修改。确认后我会直接离开当前编辑页。",
        confirmLabel: "仍然返回",
        confirmVariant: "danger",
        onConfirm: () => {
          setConfirmation(null);
          navigateBack("/");
        },
      });
      return;
    }

    const saved = await saveDocument("manual");
    if (!saved) {
      return;
    }

    navigateBack("/");
  };

  const handlePanelSelect = (panel: EditorPanel) => {
    const nextItem = panelMetaMap.get(panel);

    if (panel === "markdown") {
      setActivePanel("markdown");
      setStatusMessage(nextItem ? `已切换到${nextItem.label}` : "已切换到 Markdown");
      return;
    }

    focusFormPanel(panel, nextItem ? `正在编辑${nextItem.label}` : "继续编辑");
  };

  const handleModeChange = (mode: "form" | "markdown") => {
    if (mode === "markdown") {
      handlePanelSelect("markdown");
      return;
    }

    handlePanelSelect(lastFormPanelRef.current);
  };

  const handleFocusImportedBasics = () => {
    focusFormPanel("basics", "先核对基础信息。");
  };

  const handleGenerateAiSummary = async () => {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown");
      return;
    }

    if (latestDocumentRef.current.ai.provider !== "openai-compatible") {
      setActivePanel("ai");
      lastFormPanelRef.current = "ai";
      setStatusMessage("先把 AI 提供方切换到 OpenAI Compatible");
      return;
    }

    setIsGeneratingAiSummary(true);

    try {
      const result = await getJsonOrThrow<{ suggestions?: ResumeAssistSuggestion[] }>(
        await fetch("/api/ai/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "summary",
            document: latestDocumentRef.current,
            apiKey: clientAiApiKey,
          }),
        }),
      );

      setGeneratedAiSummarySuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
      setStatusMessage("已生成 AI 摘要建议");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "AI 摘要生成失败");
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  const handleFocusDiagnostic = (target: "basics" | "summary" | "content" | "targeting" | "export") => {
    if (target === "basics" || target === "summary") {
      focusFormPanel("basics", target === "summary" ? "先补摘要。" : "先完善基础信息。");
      return;
    }

    if (target === "targeting") {
      focusFormPanel("targeting", "先补岗位和关键词。");
      return;
    }

    if (target === "content") {
      focusFormPanel("experience", "先整理经历和结果要点。");
      return;
    }

    void handleOpenPreview();
  };

  useEffect(() => {
    const focus = searchParams.get("focus");
    const onboarding = searchParams.get("onboarding");

    if (focus === "basics" || focus === "summary") {
      lastFormPanelRef.current = "basics";
      setActivePanel("basics");
      if (focus === "summary") {
        setStatusMessage("先补摘要。");
      }
    } else if (focus === "design") {
      lastFormPanelRef.current = "design";
      setActivePanel("design");
      setStatusMessage("先调整版式和外观。");
    } else if (focus === "targeting") {
      lastFormPanelRef.current = "targeting";
      setActivePanel("targeting");
      setStatusMessage("先定岗位和关键词。");
    } else if (focus === "ai") {
      setActivePanel("ai");
      lastFormPanelRef.current = "ai";
      setStatusMessage("先看 AI 分析和定制版计划。");
    } else if (focus === "content") {
      setActivePanel("experience");
      lastFormPanelRef.current = "experience";
      setStatusMessage("先补经历和结果。");
    }

    const importedKind = resolveLatestImportKind(latestDocumentRef.current);
    if (importedKind) {
      setStatusMessage(resolveImportStatusMessage(importedKind));
    } else if (onboarding === "pdf") {
      setStatusMessage("先核对 PDF 导入结果。");
    } else if (onboarding === "portfolio") {
      setStatusMessage("先核对作品集导入结果。");
    } else if (onboarding === "template") {
      setStatusMessage("先把模板示例替换成你的真实信息。");
    } else if (onboarding === "guided") {
      setStatusMessage("先补齐基础信息，再逐步添加内容。");
    }
  }, [lastFormPanelRef, latestDocumentRef, searchParams, setActivePanel, setStatusMessage]);

  return {
    focusFormPanel,
    handleBack,
    handleFocusDiagnostic,
    handleFocusImportedBasics,
    handleCreateOptimizedVersion,
    handleGenerateAiSummary,
    handleGenerateTailoredVariant,
    handleModeChange,
    handleOpenPreview,
    handlePanelSelect,
  };
}
