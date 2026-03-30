import { createId, stripHtml } from "@/lib/utils";
import type {
  ResumeDocument,
  ResumeImportField,
  ResumeImportFieldSuggestion,
} from "@/types/resume";

export interface ResumeImportReviewTask {
  id: string;
  title: string;
  detail: string;
  focus: "basics" | "content";
  priority: "high" | "medium";
}

const trackedBasicsFields: Array<{ field: ResumeImportField; label: string }> = [
  { field: "name", label: "姓名" },
  { field: "headline", label: "职位标题" },
  { field: "location", label: "所在城市" },
  { field: "email", label: "邮箱" },
  { field: "phone", label: "电话" },
  { field: "website", label: "个人主页" },
  { field: "summaryHtml", label: "个人摘要" },
];

function normalizeFieldValue(field: ResumeImportField, value: string) {
  return field === "summaryHtml" ? stripHtml(value) : value.trim();
}

export function buildBasicsImportFieldSuggestions(
  previousBasics: ResumeDocument["basics"],
  importedBasics: ResumeDocument["basics"],
  sourceLabel: string,
) {
  return trackedBasicsFields
    .map(({ field, label }) => {
      const importedValue = importedBasics[field] ?? "";
      const previousValue = previousBasics[field] ?? "";
      const normalizedImported = normalizeFieldValue(field, importedValue);
      const normalizedPrevious = normalizeFieldValue(field, previousValue);

      if (!normalizedImported || !normalizedPrevious || normalizedPrevious === normalizedImported) {
        return null;
      }

      return {
        id: createId("import-field"),
        field,
        label,
        importedValue,
        previousValue,
        sourceLabel,
      };
    })
    .filter((suggestion): suggestion is ResumeImportFieldSuggestion => Boolean(suggestion));
}

export function getActiveImportFieldSuggestions(document: ResumeDocument) {
  const reviewedFieldSuggestionIds = new Set(document.importTrace.reviewState.reviewedFieldSuggestionIds);

  return document.importTrace.fieldSuggestions.filter((suggestion) => !reviewedFieldSuggestionIds.has(suggestion.id));
}

export function getActivePendingReviewItems(document: ResumeDocument) {
  const reviewedItems = new Set(document.importTrace.reviewState.reviewedPendingItems);

  return document.importTrace.pendingReview.filter((item) => !reviewedItems.has(item));
}

export function getActiveImportSnapshots(document: ResumeDocument) {
  const reviewedSnapshotIds = new Set(document.importTrace.reviewState.reviewedSnapshotIds);

  return document.importTrace.snapshots.filter((snapshot) => !reviewedSnapshotIds.has(snapshot.id));
}

export function getActiveUnmappedItems(document: ResumeDocument) {
  const reviewedItems = new Set(document.importTrace.reviewState.reviewedUnmappedItems);

  return document.importTrace.unmapped.filter((item) => !reviewedItems.has(item));
}

function countVisibleItems(document: ResumeDocument, type: "experience" | "projects" | "education" | "skills") {
  return document.sections
    .filter((section) => section.type === type)
    .reduce((sum, section) => sum + section.items.length, 0);
}

export function buildResumeImportReviewTasks(document: ResumeDocument) {
  const completedTaskIds = new Set(document.importTrace.reviewState.completedTaskIds);
  const tasks: ResumeImportReviewTask[] = [];
  const contactCount = [
    document.basics.email,
    document.basics.phone,
    document.basics.website,
    ...document.basics.links.map((link) => link.url),
  ].filter((value) => value.trim()).length;
  const experienceCount = countVisibleItems(document, "experience");
  const projectCount = countVisibleItems(document, "projects");
  const educationCount = countVisibleItems(document, "education");
  const skillCount = countVisibleItems(document, "skills");
  const remainingPendingReviewItems = getActivePendingReviewItems(document);
  const remainingSnapshots = getActiveImportSnapshots(document);
  const remainingFieldSuggestions = getActiveImportFieldSuggestions(document);
  const remainingUnmappedItems = getActiveUnmappedItems(document);

  if (!document.basics.name.trim() || !document.basics.headline.trim()) {
    tasks.push({
      id: "review-identity",
      title: "核对姓名和职位标题",
      detail: "当前导入结果还缺少可靠的姓名或职位标题，先补全这两项再继续编辑。",
      focus: "basics",
      priority: "high",
    });
  }

  if (contactCount < 2) {
    tasks.push({
      id: "review-contact",
      title: "补全联系方式",
      detail: "导入结果中的联系方式不足，建议至少保留两种可联系到你的方式。",
      focus: "basics",
      priority: "high",
    });
  }

  if (experienceCount + projectCount === 0) {
    tasks.push({
      id: "review-core-content",
      title: "确认经历映射结果",
      detail: "当前还没有形成标准的工作或项目经历，检查原始内容是否需要手动归类。",
      focus: "content",
      priority: "high",
    });
  } else {
    tasks.push({
      id: "review-mapped-content",
      title: "检查工作与项目经历",
      detail: `当前草稿里已有 ${experienceCount} 段工作经历和 ${projectCount} 段项目经历，先确认归类是否正确，再继续润色。`,
      focus: "content",
      priority: "medium",
    });
  }

  if (educationCount + skillCount > 0) {
    tasks.push({
      id: "review-supporting-sections",
      title: "检查教育与技能信息",
      detail: `教育和技能共识别出 ${educationCount + skillCount} 项内容，建议删除噪音，只保留适合写进简历的信息。`,
      focus: "content",
      priority: "medium",
    });
  }

  if (remainingUnmappedItems.length > 0) {
    tasks.push({
      id: "review-unmapped",
      title: "处理未映射内容",
      detail: `还有 ${remainingUnmappedItems.length} 条导入提示表示部分原始信息未被完整保留。`,
      focus: "content",
      priority: "medium",
    });
  }

  if (remainingFieldSuggestions.length > 0) {
    tasks.push({
      id: "review-imported-fields",
      title: "核对基础字段替换",
      detail: `有 ${remainingFieldSuggestions.length} 个基础字段被本次导入覆盖，可先确认是否保留导入值。`,
      focus: "basics",
      priority: "medium",
    });
  }

  if (remainingPendingReviewItems.length > 0) {
    tasks.push({
      id: "review-pending-items",
      title: "处理导入待确认提示",
      detail: `还有 ${remainingPendingReviewItems.length} 条导入提示需要快速核对，处理完再继续润色更稳妥。`,
      focus: "content",
      priority: "medium",
    });
  }

  if (remainingSnapshots.length > 0) {
    tasks.push({
      id: "review-source-snapshots",
      title: "对照原始来源片段",
      detail: `可使用下方 ${remainingSnapshots.length} 条原始片段，确认 AI 整理时没有漏掉关键事实。`,
      focus: "content",
      priority: "medium",
    });
  }

  return tasks
    .filter((task) => task.priority === "high" || !completedTaskIds.has(task.id))
    .slice(0, 4);
}
