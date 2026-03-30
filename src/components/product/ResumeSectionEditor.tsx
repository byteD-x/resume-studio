"use client";

import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Files, GripVertical, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { EditorSectionDefinition } from "@/lib/resume-editor";
import { htmlFieldToText } from "@/lib/resume-editor";
import { handleSanitizedPaste } from "@/lib/editor-input";
import type { ResumeSection, ResumeSectionItem } from "@/types/resume";

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
}) {
  const metaSummary = [item.subtitle, item.dateRange, item.location].filter(Boolean).join(" · ");
  const summaryValue = htmlFieldToText(item.summaryHtml);

  return (
    <article
      className={`editor-item-card ${expanded ? "editor-item-card-expanded" : ""} ${active ? "editor-item-card-active" : ""}`}
      onFocusCapture={onActivate}
    >
      <div className="editor-item-head">
        <button className="editor-item-summary" onClick={onToggle} type="button">
          <span className="editor-item-grip" aria-hidden="true">
            <GripVertical className="size-4" />
          </span>
          <p className="editor-item-title">{item.title.trim() || "未命名"}</p>
          <p className="editor-item-subtitle">{metaSummary || "补充信息"}</p>
        </button>

        <div className="editor-item-actions">
          <button className="icon-button" onClick={onCopy} title="复制条目内容" type="button">
            <Copy className="size-4" />
          </button>
          <button className="icon-button" onClick={onDuplicate} title="克隆条目" type="button">
            <Files className="size-4" />
          </button>
          <button className="icon-button" disabled={index === 0} onClick={() => onMove("up")} title="上移" type="button">
            <ChevronUp className="size-4" />
          </button>
          <button
            className="icon-button"
            disabled={index === total - 1}
            onClick={() => onMove("down")}
            title="下移"
            type="button"
          >
            <ChevronDown className="size-4" />
          </button>
          <button className="icon-button" onClick={onDelete} title="删除条目" type="button">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="editor-field-grid mt-5">
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

          <label className="field-shell mt-4">
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

          <label className="field-shell mt-4">
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

          {sectionType === "skills" ? (
            <label className="field-shell mt-4">
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
            <label className="field-shell mt-4">
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
        </>
      ) : null}
    </article>
  );
}

export function ResumeSectionEditor({
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
}: {
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
            添加条目
          </button>
        </div>
      </div>

      <div className="resume-editor-group resume-editor-group-compact">
        <div className="resume-editor-group-head">
          <h3>设置</h3>
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
            <span className="field-label">补充说明</span>
            <input
              className="input-control"
              onChange={(event) =>
                onChange({
                  ...section,
                  contentHtml: event.target.value.trim() ? `<p>${event.target.value.trim()}</p>` : "",
                })
              }
              onPaste={(event) =>
                handleSanitizedPaste(event, {
                  currentValue: htmlFieldToText(section.contentHtml),
                  mode: "single-line",
                  onValueChange: (nextValue) =>
                    onChange({
                      ...section,
                      contentHtml: nextValue.trim() ? `<p>${nextValue.trim()}</p>` : "",
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

        <div className="space-y-4">
          {section.items.length > 0 ? (
            section.items.map((item, index) => (
              <ItemCard
                active={activeItemId === item.id}
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
              />
            ))
          ) : (
            <div className="empty-surface empty-surface-left">
              <p className="empty-surface-title">{definition.emptyState}</p>
              <p className="empty-surface-text">添加后显示。</p>
              <div className="mt-4">
                <button className="btn btn-secondary" onClick={() => onAddItem()} type="button">
                  <Plus className="size-4" />
                  添加条目
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
