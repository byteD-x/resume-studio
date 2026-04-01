"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { readClientAiConfig } from "@/lib/client-ai-config";
import type {
  DeleteScope,
  LibraryRow,
  PendingLibraryConfirmation,
  TailoredVariantResponse,
  VersionGroup,
} from "@/components/product/resume-library/types";
import { getJson } from "@/components/product/resume-library/utils";

export function useResumeLibraryActions(resumeCount: number) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [status, setStatus] = useState(
    resumeCount > 0 ? `已加载 ${resumeCount} 份简历` : "简历库还是空的",
  );
  const [confirmation, setConfirmation] = useState<PendingLibraryConfirmation | null>(null);
  const [, startTransition] = useTransition();

  const activeDeleteId = pendingKey?.startsWith("delete:") ? pendingKey.slice("delete:".length) : null;
  const generatingInProgress = pendingKey?.startsWith("generate:") ?? false;

  const deleteResume = async ({
    id,
    title,
    scope,
    deletedCount,
  }: {
    id: string;
    title: string;
    scope: DeleteScope;
    deletedCount: number;
  }) => {
    setPendingKey(`delete:${id}`);
    setStatus(
      scope === "lineage" && deletedCount > 1
        ? `正在删除 ${title} 及其 ${deletedCount - 1} 个定制版本`
        : `正在删除 ${title}`,
    );

    try {
      const requestUrl = scope === "lineage" ? `/api/resumes/${id}?scope=lineage` : `/api/resumes/${id}`;
      const response = await fetch(requestUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "删除失败");
      }

      setStatus(
        scope === "lineage" && deletedCount > 1
          ? `已删除 ${title} 及其 ${deletedCount - 1} 个定制版本`
          : `已删除 ${title}`,
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除失败");
    } finally {
      setPendingKey(null);
    }
  };

  const requestDeleteResume = (row: LibraryRow, group?: VersionGroup) => {
    const variantCount =
      row.lineage?.parentId === null && group?.sourceRow.resume.meta.id === row.resume.meta.id
        ? group.variantRows.length
        : 0;
    const scope: DeleteScope = variantCount > 0 ? "lineage" : "single";
    const deletedCount = scope === "lineage" ? variantCount + 1 : 1;
    const noun =
      row.lineage?.kind === "source" ? "主稿" : row.lineage?.kind === "variant" ? "定制版" : "简历";

    setConfirmation({
      title:
        scope === "lineage"
          ? `删除“${row.resume.meta.title}”整组版本？`
          : `删除这份${noun}？`,
      description:
        scope === "lineage"
          ? `这会删除当前主稿以及其下 ${variantCount} 个定制版本，且无法自动恢复。`
          : "删除后将无法自动恢复，请确认这份简历已经不再需要。",
      confirmLabel: scope === "lineage" ? "删除整组" : "确认删除",
      onConfirm: async () => {
        setConfirmation(null);
        await deleteResume({
          id: row.resume.meta.id,
          title: row.resume.meta.title,
          scope,
          deletedCount,
        });
      },
    });
  };

  const generateTailoredVariant = async (row: LibraryRow) => {
    setPendingKey(`generate:${row.resume.meta.id}`);
    setStatus(`正在根据 ${row.resume.meta.title} 生成定制版`);

    try {
      const clientAiApiKey = readClientAiConfig().apiKey;
      const result = await getJson<TailoredVariantResponse>(
        await fetch(`/api/resumes/${row.resume.meta.id}/generate-tailored-variant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: row.tailoredPlan.titleSuggestion,
            apiKey: clientAiApiKey,
          }),
        }),
      );

      setStatus(
        result.remoteSummaryApplied
          ? "已生成定制版，并通过 AI 补全摘要"
          : result.plan.missingKeywords.length > 0
            ? `已生成定制版，仍有 ${result.plan.missingKeywords.length} 个关键词未覆盖`
            : result.remoteSummaryError
              ? `已生成定制版，但 AI 摘要补全失败：${result.remoteSummaryError}`
              : "已生成定制版",
      );
      router.push(`/studio/${result.document.meta.id}?focus=ai`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "生成定制版失败");
      setPendingKey(null);
    }
  };

  return {
    activeDeleteId,
    confirmation,
    generatingInProgress,
    pendingKey,
    requestDeleteResume,
    generateTailoredVariant,
    setConfirmation,
    status,
  };
}
