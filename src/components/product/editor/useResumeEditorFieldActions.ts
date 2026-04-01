"use client";

import type { MutableRefObject } from "react";
import { readClientAiConfig, writeClientAiConfig } from "@/lib/client-ai-config";
import { enhancedResumeAiPresets } from "@/lib/resume-ai";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeDocument } from "@/types/resume";
import {
  buildStylePresetLayout,
  mergeLayoutForTemplateSwitch,
  textToParagraphHtml,
  type ResumeEditorStylePreset,
} from "@/components/product/editor/resume-editor-workspace";
import { sanitizeRichTextHtml } from "@/lib/utils";
import { tagsToList } from "@/lib/resume-editor";

export type BasicsTextField =
  | "name"
  | "headline"
  | "location"
  | "website"
  | "email"
  | "phone"
  | "summaryHtml"
  | "links";

type UpdateDocument = (
  updater: (current: ResumeDocument) => ResumeDocument,
  options?: {
    message?: string;
    historyLabel?: string;
    clearDeletion?: boolean;
  },
) => void;

export function useResumeEditorFieldActions({
  clientAiApiKey,
  latestDocumentRef,
  setClientAiApiKey,
  setStatusMessage,
  suggestedKeywords,
  updateDocument,
}: {
  clientAiApiKey: string;
  latestDocumentRef: MutableRefObject<ResumeDocument>;
  setClientAiApiKey: (value: string) => void;
  setStatusMessage: (value: string) => void;
  suggestedKeywords: string[];
  updateDocument: UpdateDocument;
}) {
  const updateResumeTitle = (value: string) => {
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          title: value || "未命名简历",
        },
      }),
      {
        historyLabel: "修改简历标题",
        clearDeletion: true,
      },
    );
  };

  const updateBasicsField = (field: BasicsTextField, value: string) => {
    updateDocument(
      (current) => {
        if (field === "summaryHtml") {
          const hasInlineMarkup = /<[^>]+>/.test(value);
          return {
            ...current,
            basics: {
              ...current.basics,
              summaryHtml: hasInlineMarkup ? sanitizeRichTextHtml(value) : textToParagraphHtml(value),
            },
          };
        }

        if (field === "links") {
          return {
            ...current,
            basics: {
              ...current.basics,
              links: value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [label, ...rest] = line.split(" ");
                  return {
                    label,
                    url: rest.join(" ") || label,
                  };
                }),
            },
          };
        }

        return {
          ...current,
          basics: {
            ...current.basics,
            [field]: value,
          },
        };
      },
      {
        historyLabel: "修改基本信息",
        clearDeletion: true,
      },
    );
  };

  const updateBasicsSummaryHtml = (value: string) => {
    updateDocument(
      (current) => ({
        ...current,
        basics: {
          ...current.basics,
          summaryHtml: value,
        },
      }),
      {
        historyLabel: "更新摘要样式",
        clearDeletion: true,
      },
    );
  };

  const updateTargetingField = (field: keyof ResumeDocument["targeting"], value: string) => {
    updateDocument(
      (current) => ({
        ...current,
        targeting: {
          ...current.targeting,
          [field]: field === "focusKeywords" ? tagsToList(value) : value,
        },
      }),
      {
        historyLabel: "修改岗位定向",
        clearDeletion: true,
      },
    );
  };

  const updateLayoutField = <K extends keyof ResumeDocument["layout"]>(field: K, value: ResumeDocument["layout"][K]) => {
    updateDocument(
      (current) => ({
        ...current,
        layout: {
          ...current.layout,
          [field]: value,
        },
      }),
      {
        historyLabel: "修改版式设置",
        clearDeletion: true,
      },
    );
  };

  const updateTemplate = (template: ResumeDocument["meta"]["template"]) => {
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          template,
        },
        layout: mergeLayoutForTemplateSwitch(current, template),
      }),
      {
        historyLabel: "切换简历模板",
        clearDeletion: true,
      },
    );
  };

  const applyStylePreset = (presetId: ResumeEditorStylePreset) => {
    updateDocument(
      (current) => ({
        ...current,
        layout: buildStylePresetLayout(current, presetId),
      }),
      {
        historyLabel: "套用风格预设",
        clearDeletion: true,
      },
    );
  };

  const updateBasicsVisualField = <
    K extends "photoUrl" | "photoAlt" | "photoVisible" | "photoShape" | "photoPosition" | "photoSizeMm",
  >(
    field: K,
    value: ResumeDocument["basics"][K],
  ) => {
    updateDocument(
      (current) => ({
        ...current,
        basics: {
          ...current.basics,
          [field]: value,
        },
      }),
      {
        historyLabel: "修改头像与视觉设置",
        clearDeletion: true,
      },
    );
  };

  const updateAiField = (field: keyof ResumeDocument["ai"], value: string) => {
    const nextConfig = {
      ...readClientAiConfig(),
      [field]: value,
    };
    writeClientAiConfig(nextConfig);

    updateDocument(
      (current) => ({
        ...current,
        ai: {
          ...current.ai,
          [field]: value,
        },
      }),
      {
        historyLabel: "更新 AI 设置",
        clearDeletion: true,
      },
    );
  };

  const updateAiApiKey = (value: string) => {
    setClientAiApiKey(value);
    writeClientAiConfig({
      ...readClientAiConfig(),
      provider: latestDocumentRef.current.ai.provider,
      model: latestDocumentRef.current.ai.model,
      baseUrl: latestDocumentRef.current.ai.baseUrl,
      apiKey: value,
    });
  };

  const applyAiPreset = (presetId: string) => {
    const preset = enhancedResumeAiPresets.find((item) => item.id === presetId);
    if (!preset) return;

    writeClientAiConfig({
      ...readClientAiConfig(),
      ...preset.settings,
      apiKey: clientAiApiKey,
    });

    updateDocument(
      (current) => ({
        ...current,
        ai: {
          ...current.ai,
          ...preset.settings,
        },
      }),
      {
        historyLabel: "应用 AI 预设",
        clearDeletion: true,
        message: `已切换到 ${preset.label} 预设`,
      },
    );
  };

  const applyGeneratedAiSummarySuggestion = (suggestion: ResumeAssistSuggestion) => {
    if (typeof suggestion.nextValue !== "string") {
      setStatusMessage("当前建议无法直接应用");
      return;
    }

    updateBasicsField("summaryHtml", suggestion.nextValue);
    setStatusMessage(`已应用${suggestion.label}`);
  };

  const applySuggestedKeywords = () => {
    if (suggestedKeywords.length === 0) {
      setStatusMessage("当前没有可应用的建议关键词");
      return;
    }

    updateDocument(
      (current) => ({
        ...current,
        targeting: {
          ...current.targeting,
          focusKeywords: suggestedKeywords,
        },
      }),
      {
        historyLabel: "应用建议关键词",
        clearDeletion: true,
        message: "已应用建议关键词",
      },
    );
  };

  return {
    applyAiPreset,
    applyGeneratedAiSummarySuggestion,
    applyStylePreset,
    applySuggestedKeywords,
    updateAiApiKey,
    updateAiField,
    updateBasicsField,
    updateBasicsSummaryHtml,
    updateBasicsVisualField,
    updateLayoutField,
    updateResumeTitle,
    updateTargetingField,
    updateTemplate,
  };
}
