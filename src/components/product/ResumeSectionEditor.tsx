"use client";

import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Files, GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResumeAssistPanel } from "@/components/product/editor/ResumeAssistPanel";
import { readClientAiConfig } from "@/lib/client-ai-config";
import type { EditorSectionDefinition } from "@/lib/resume-editor";
import { htmlFieldToText } from "@/lib/resume-editor";
import { handleSanitizedPaste } from "@/lib/editor-input";
import { buildItemAssistPack } from "@/lib/resume-assistant";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeDocument, ResumeSection, ResumeSectionItem, ResumeWriterProfile } from "@/types/resume";

function toSummaryHtml(value: string) {
  return value.trim() ? `<p>${value.trim().replace(/\n/g, "<br />")}</p>` : "";
}

function ItemCard({
  item,
  index,
  total,
  sectionType,
  expanded,
  active,
  onToggle,
  onActivate,
  onChange,
  onDelete,
  onMove,
  onDuplicate,
  onCopy,
  registerTitleInput,
  writerProfile,
  document,
}: {
  item: ResumeSectionItem;
  index: number;
  total: number;
  sectionType: EditorSectionDefinition["type"];
  expanded: boolean;
  active: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onChange: (nextItem: ResumeSectionItem) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  onDuplicate: () => void;
  onCopy: () => void;
  registerTitleInput: (element: HTMLInputElement | null) => void;
  writerProfile: ResumeWriterProfile;
  document: ResumeDocument;
}) {
  const metaSummary = [item.subtitle, item.dateRange, item.location].filter(Boolean).join(" · ");
  const summaryValue = htmlFieldToText(item.summaryHtml);
  const itemLabel = item.title.trim() || "未命名条目";
  const detailPanelId = `${item.id}-panel`;
  const assistPack = useMemo(
    () => buildItemAssistPack(sectionType, item, writerProfile),
    [item, sectionType, writerProfile],
  );
  const [remoteSuggestions, setRemoteSuggestions] = useState<ResumeAssistSuggestion[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const usesRemoteProvider = document.ai.provider === "openai-compatible";
  const targetingKeywordsKey = document.targeting.focusKeywords.join("|");
  const itemBulletsKey = item.bulletPoints.join("|");
  const itemTagsKey = item.tags.join("|");
  const combinedSuggestions =
    remoteSuggestions.length > 0 ? [...remoteSuggestions, ...assistPack.suggestions] : assistPack.suggestions;

  useEffect(() => {
    setRemoteSuggestions([]);
    setRemoteError(null);
  }, [
    document.ai.provider,
    document.ai.model,
    document.ai.baseUrl,
    document.targeting.role,
    document.targeting.jobDescription,
    targetingKeywordsKey,
    item.id,
    item.title,
    item.subtitle,
    item.meta,
    item.summaryHtml,
    itemBulletsKey,
    itemTagsKey,
  ]);

  async function handleGenerateRemoteAssist() {
    setRemoteLoading(true);
    setRemoteError(null);

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "section",
          document,
          sectionType,
          item,
          apiKey: readClientAiConfig().apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "远程写作建议生成失败");
      }

      const result = (await response.json()) as { suggestions?: ResumeAssistSuggestion[] };
      setRemoteSuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "远程写作建议生成失败");
    } finally {
      setRemoteLoading(false);
    }
  }

  return (
    <article
      className={`editor-item-card ${expanded ? "editor-item-card-expanded" : ""} ${active ? "editor-item-card-active" : ""}`}
      onFocusCapture={onActivate}
    >
      <div className="editor-item-head">
        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? "收起" : "展开"}${itemLabel}`}
          className="editor-item-summary"
          onClick={onToggle}
          type="button"
        >
          <span className="editor-item-grip" aria-hidden="true">
            <GripVertical className="size-4" />
          </span>
          <p className="editor-item-title">{item.title.trim() || "未命名"}</p>
          <p className="editor-item-subtitle">{metaSummary || "待补充"}</p>
        </button>

        <div className="editor-item-actions">
          <button
            aria-label={`复制${itemLabel}的内容`}
            className="icon-button"
            onClick={onCopy}
            title="复制条目内容"
            type="button"
          >
            <Copy className="size-4" />
          </button>
          <button
            aria-label={`复制整个${itemLabel}`}
            className="icon-button"
            onClick={onDuplicate}
            title="复制整个条目"
            type="button"
          >
            <Files className="size-4" />
          </button>
          <button
            aria-label={`上移${itemLabel}`}
            className="icon-button"
            disabled={index === 0}
            onClick={() => onMove("up")}
            title="上移"
            type="button"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            aria-label={`下移${itemLabel}`}
            className="icon-button"
            disabled={index === total - 1}
            onClick={() => onMove("down")}
            title="下移"
            type="button"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            aria-label={`删除${itemLabel}`}
            className="icon-button"
            onClick={onDelete}
            title="删除条目"
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {expanded ? (
        <div id={detailPanelId}>
          <div className="editor-field-grid editor-item-primary-fields">
            <label className="field-shell">
              <span className="field-label">{sectionType === "education" ? "学校 / 机构" : "名称"}</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, title: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.title,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, title: nextValue }),
                  })
                }
                ref={registerTitleInput}
                value={item.title}
              />
            </label>
            <label className="field-shell">
              <span className="field-label">副标题</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, subtitle: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.subtitle,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, subtitle: nextValue }),
                  })
                }
                value={item.subtitle}
              />
            </label>
            <label className="field-shell">
              <span className="field-label">时间范围</span>
              <input
                className="input-control"
                onChange={(event) => onChange({ ...item, dateRange: event.target.value })}
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.dateRange,
                    mode: "single-line",
                    onValueChange: (nextValue) => onChange({ ...item, dateRange: nextValue }),
                  })
                }
                placeholder="2023.06 - 2024.02"
                value={item.dateRange}
              />
            </label>
          </div>

          <details className="editor-item-secondary">
            <summary>补充信息</summary>
            <div className="editor-item-secondary-fields">
              <label className="field-shell">
                <span className="field-label">地点</span>
                <input
                  className="input-control"
                  onChange={(event) => onChange({ ...item, location: event.target.value })}
                  onPaste={(event) =>
                    handleSanitizedPaste(event, {
                      currentValue: item.location,
                      mode: "single-line",
                      onValueChange: (nextValue) => onChange({ ...item, location: nextValue }),
                    })
                  }
                  value={item.location}
                />
              </label>

              <label className="field-shell">
                <span className="field-label">备注</span>
                <input
                  className="input-control"
                  onChange={(event) => onChange({ ...item, meta: event.target.value })}
                  onPaste={(event) =>
                    handleSanitizedPaste(event, {
                      currentValue: item.meta,
                      mode: "single-line",
                      onValueChange: (nextValue) => onChange({ ...item, meta: nextValue }),
                    })
                  }
                  placeholder="团队或技术栈"
                  value={item.meta}
                />
              </label>

              <label className="field-shell field-shell-full">
                <span className="field-label">说明</span>
                <textarea
                  className="textarea-control min-h-28"
                  onChange={(event) =>
                    onChange({
                      ...item,
                      summaryHtml: toSummaryHtml(event.target.value),
                    })
                  }
                  onPaste={(event) =>
                    handleSanitizedPaste(event, {
                      currentValue: summaryValue,
                      mode: "multiline",
                      onValueChange: (nextValue) =>
                        onChange({
                          ...item,
                          summaryHtml: toSummaryHtml(nextValue),
                        }),
                    })
                  }
                  placeholder="补充职责或结果"
                  value={summaryValue}
                />
              </label>
            </div>
          </details>

          {sectionType === "skills" ? (
            <label className="field-shell editor-item-block">
              <span className="field-label">技能</span>
              <textarea
                className="textarea-control min-h-24"
                onChange={(event) =>
                  onChange({
                    ...item,
                    tags: event.target.value
                      .split(/[，,\n、;；|]+/)
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.tags.join(", "),
                    mode: "skills",
                    onValueChange: (nextValue) =>
                      onChange({
                        ...item,
                        tags: nextValue
                          .split(/[，,]+/)
                          .map((value) => value.trim())
                          .filter(Boolean),
                      }),
                  })
                }
                placeholder="React, TypeScript, Node.js"
                value={item.tags.join(", ")}
              />
            </label>
          ) : (
            <label className="field-shell editor-item-block">
              <span className="field-label">要点</span>
              <textarea
                className="textarea-control min-h-32"
                onChange={(event) =>
                  onChange({
                    ...item,
                    bulletPoints: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
                onPaste={(event) =>
                  handleSanitizedPaste(event, {
                    currentValue: item.bulletPoints.join("\n"),
                    mode: "bullets",
                    onValueChange: (nextValue) =>
                      onChange({
                        ...item,
                        bulletPoints: nextValue
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      }),
                  })
                }
                placeholder="每行一条"
                value={item.bulletPoints.join("\n")}
              />
            </label>
          )}

          <ResumeAssistPanel
            description=""
            getCurrentValue={(suggestion) => {
              if (suggestion.target === "summary") {
                return htmlFieldToText(item.summaryHtml);
              }

              if (suggestion.target === "bullets") {
                return item.bulletPoints;
              }

              if (suggestion.target === "tags") {
                return item.tags;
              }

              return null;
            }}
            issues={assistPack.issues}
            onGenerateRemote={() => void handleGenerateRemoteAssist()}
            onApply={(suggestion) => {
              if (suggestion.target === "summary" && typeof suggestion.nextValue === "string") {
                onChange({
                  ...item,
                  summaryHtml: toSummaryHtml(suggestion.nextValue),
                });
              }

              if (suggestion.target === "bullets" && Array.isArray(suggestion.nextValue)) {
                onChange({
                  ...item,
                  bulletPoints: suggestion.nextValue,
                });
              }

              if (suggestion.target === "tags" && Array.isArray(suggestion.nextValue)) {
                onChange({
                  ...item,
                  tags: suggestion.nextValue,
                });
              }
            }}
            remoteDisabled={!usesRemoteProvider || remoteLoading}
            remoteError={remoteError}
            remoteHint={usesRemoteProvider ? "结合当前条目生成。" : "先配置 AI 模型。"}
            remoteLoading={remoteLoading}
            remoteLabel={sectionType === "skills" ? "生成技能建议" : "生成写作建议"}
            suggestions={combinedSuggestions}
            title={sectionType === "skills" ? "技能建议" : "写作建议"}
          />
        </div>
      ) : null}
    </article>
  );
}

export function ResumeSectionEditor({
  document,
  definition,
  section,
  activeItemId,
  focusItemId,
  onChange,
  onAddItem,
  onDeleteItem,
  onDuplicateItem,
  onCopyItem,
  onMoveItem,
  onActiveItemChange,
  writerProfile,
}: {
  document: ResumeDocument;
  definition: EditorSectionDefinition;
  section: ResumeSection;
  activeItemId: string | null;
  focusItemId: string | null;
  onChange: (nextSection: ResumeSection) => void;
  onAddItem: (options?: { afterItemId?: string }) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
  onCopyItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
  onActiveItemChange: (itemId: string | null) => void;
  writerProfile: ResumeWriterProfile;
}) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(section.items[0]?.id ?? null);
  const titleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const activeExpandedItemId =
    focusItemId && section.items.some((item) => item.id === focusItemId)
      ? focusItemId
      : expandedItemId && section.items.some((item) => item.id === expandedItemId)
        ? expandedItemId
        : section.items[0]?.id ?? null;

  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <p className="resume-editor-panel-kicker">{definition.title}</p>
          <h2 className="resume-editor-panel-title">{section.title}</h2>
        </div>

        <div className="resume-editor-panel-actions">
          <button
            className="btn btn-ghost"
            onClick={() => onChange({ ...section, visible: !section.visible })}
            type="button"
          >
            {section.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {section.visible ? "隐藏" : "显示"}
          </button>
          <button className="btn btn-secondary" onClick={() => onAddItem()} type="button">
            <Plus className="size-4" />
            新建条目
          </button>
        </div>
      </div>

      <div className="resume-editor-group resume-editor-group-compact">
        <div className="resume-editor-group-head">
          <h3>区块设置</h3>
        </div>
        <div className="resume-editor-field-grid">
          <label className="field-shell">
            <span className="field-label">标题</span>
            <input
              className="input-control"
              onChange={(event) => onChange({ ...section, title: event.target.value })}
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: section.title,
                  mode: "single-line",
                  onValueChange: (nextValue) => onChange({ ...section, title: nextValue }),
                })
              }
              value={section.title}
            />
          </label>
          <label className="field-shell">
            <span className="field-label">区块说明</span>
            <textarea
              className="textarea-control min-h-28"
              onChange={(event) =>
                onChange({
                  ...section,
                  contentHtml: toSummaryHtml(event.target.value),
                })
              }
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: htmlFieldToText(section.contentHtml),
                  mode: "multiline",
                  onValueChange: (nextValue) =>
                    onChange({
                      ...section,
                      contentHtml: toSummaryHtml(nextValue),
                    }),
                })
              }
              placeholder={definition.description}
              value={htmlFieldToText(section.contentHtml)}
            />
          </label>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>{section.type === "skills" ? "技能分组" : "条目"}</h3>
        </div>

        <div className="editor-item-stack">
          {section.items.length > 0 ? (
            section.items.map((item, index) => (
              <ItemCard
                active={activeItemId === item.id}
                document={document}
                expanded={activeExpandedItemId === item.id}
                index={index}
                item={item}
                key={item.id}
                onActivate={() => onActiveItemChange(item.id)}
                onCopy={() => onCopyItem(item.id)}
                onDelete={() => onDeleteItem(item.id)}
                onDuplicate={() => onDuplicateItem(item.id)}
                onMove={(direction) => onMoveItem(item.id, direction)}
                onToggle={() => {
                  const next = activeExpandedItemId === item.id ? null : item.id;
                  setExpandedItemId(next);
                  onActiveItemChange(next ?? item.id);
                }}
                onChange={(nextItem) =>
                  onChange({
                    ...section,
                    items: section.items.map((current) => (current.id === nextItem.id ? nextItem : current)),
                  })
                }
                registerTitleInput={(element) => {
                  titleInputRefs.current[item.id] = element;
                  if (element && focusItemId === item.id) {
                    requestAnimationFrame(() => {
                      element.focus();
                      element.select();
                    });
                  }
                }}
                sectionType={definition.type}
                total={section.items.length}
                writerProfile={writerProfile}
              />
            ))
          ) : (
            <div className="empty-surface empty-surface-left">
              <p className="empty-surface-title">{definition.emptyState}</p>
              <p className="empty-surface-text">新建后即可开始编辑。</p>
              <div className="empty-surface-actions">
                <button className="btn btn-secondary" onClick={() => onAddItem()} type="button">
                  <Plus className="size-4" />
                  新建条目
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

