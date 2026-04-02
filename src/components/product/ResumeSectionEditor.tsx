"use client";

import { Eye, EyeOff, Plus } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { ResumeSectionEditorSettings } from "@/components/product/editor/ResumeSectionEditorSettings";
import { ResumeSectionItemCard } from "@/components/product/editor/ResumeSectionItemCard";
import { hasMeaningfulItemContent, stripHtmlToText } from "@/components/product/editor/workspace/shared";
import type { EditorSectionDefinition } from "@/lib/resume-editor";
import type { ResumeDocument, ResumeSection, ResumeWriterProfile } from "@/types/resume";

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
  onFocusItemHandled,
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
  onFocusItemHandled: () => void;
  writerProfile: ResumeWriterProfile;
}) {
  const titleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const validActiveItemId =
    activeItemId && section.items.some((item) => item.id === activeItemId) ? activeItemId : section.items[0]?.id ?? null;
  const activeItem = section.items.find((item) => item.id === validActiveItemId) ?? null;
  const activeIndex = activeItem ? section.items.findIndex((item) => item.id === activeItem.id) : -1;
  const completedCount = useMemo(
    () => section.items.filter((item) => hasMeaningfulItemContent(item)).length,
    [section.items],
  );

  useEffect(() => {
    if (section.items.length === 0) {
      if (activeItemId) {
        onActiveItemChange(null);
      }
      return;
    }

    if (!activeItemId || !section.items.some((item) => item.id === activeItemId)) {
      onActiveItemChange(section.items[0].id);
    }
  }, [activeItemId, onActiveItemChange, section.items]);

  useEffect(() => {
    if (!focusItemId) {
      return;
    }

    const element = titleInputRefs.current[focusItemId];
    if (!element || globalThis.document.activeElement === element) {
      onFocusItemHandled();
      return;
    }

    requestAnimationFrame(() => {
      const currentElement = titleInputRefs.current[focusItemId];
      if (!currentElement || globalThis.document.activeElement === currentElement) {
        onFocusItemHandled();
        return;
      }

      currentElement.focus();
      currentElement.select();
      onFocusItemHandled();
    });
  }, [focusItemId, onFocusItemHandled]);

  return (
    <section className="resume-section-workbench">
      <div className="resume-section-shell">
        <aside className="resume-section-outline">
          <div className="resume-section-outline-head">
            <div>
              <h2 className="resume-section-outline-title">{section.title}</h2>
            </div>

            <div className="resume-section-outline-badges">
              <Badge tone={section.visible ? "success" : "warning"}>{section.visible ? "显示" : "隐藏"}</Badge>
              <Badge tone="neutral">
                {completedCount}/{section.items.length || 0}
              </Badge>
            </div>
          </div>

          <ResumeSectionEditorSettings definition={definition} onChange={onChange} section={section} />

          <div className="resume-section-outline-toolbar">
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
              新增
            </button>
          </div>

          <div className="resume-section-outline-list">
            {section.items.length > 0 ? (
              section.items.map((item, index) => {
                const active = item.id === activeItem?.id;
                const metaSummary = [item.subtitle, item.dateRange, item.location].filter(Boolean).join(" / ");
                const textSummary =
                  definition.type === "skills"
                    ? item.tags.slice(0, 4).join(" / ")
                    : item.bulletPoints[0] || stripHtmlToText(item.summaryHtml);

                return (
                  <button
                    className={`resume-section-outline-item ${active ? "resume-section-outline-item-active" : ""}`}
                    key={item.id}
                    onClick={() => onActiveItemChange(item.id)}
                    type="button"
                  >
                    <span className="resume-section-outline-index">{index + 1}</span>
                    <span className="resume-section-outline-content">
                      <strong>{item.title.trim() || `未命名${definition.title}`}</strong>
                      <span>{metaSummary || "补充结构信息"}</span>
                      {textSummary ? <em>{textSummary}</em> : <em>未填写</em>}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="empty-surface empty-surface-left">
                <p className="empty-surface-title">{definition.emptyState}</p>
                <div className="empty-surface-actions">
                  <button className="btn btn-secondary" onClick={() => onAddItem()} type="button">
                    <Plus className="size-4" />
                    新增
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="resume-section-detail">
          {activeItem ? (
            <>
              <div className="resume-section-detail-head">
                <div>
                  <p className="resume-section-detail-kicker">条目</p>
                  <h3 className="resume-section-detail-title">{activeItem.title.trim() || `未命名${definition.title}`}</h3>
                  <p className="resume-section-detail-copy">{definition.title}</p>
                </div>

                <div className="resume-section-detail-actions">
                  <button className="btn btn-secondary" onClick={() => onAddItem({ afterItemId: activeItem.id })} type="button">
                    <Plus className="size-4" />
                    在后面新增
                  </button>
                </div>
              </div>

              <ResumeSectionItemCard
                document={document}
                item={activeItem}
                itemIndex={activeIndex}
                onChange={(nextItem) =>
                  onChange({
                    ...section,
                    items: section.items.map((current) => (current.id === nextItem.id ? nextItem : current)),
                  })
                }
                onCopy={() => onCopyItem(activeItem.id)}
                onDelete={() => onDeleteItem(activeItem.id)}
                onDuplicate={() => onDuplicateItem(activeItem.id)}
                onMove={(direction) => onMoveItem(activeItem.id, direction)}
                registerTitleInput={(element) => {
                  titleInputRefs.current[activeItem.id] = element;
                }}
                sectionType={definition.type}
                total={section.items.length}
                writerProfile={writerProfile}
              />
            </>
          ) : (
            <div className="empty-surface empty-surface-left">
              <p className="empty-surface-title">暂无条目</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
