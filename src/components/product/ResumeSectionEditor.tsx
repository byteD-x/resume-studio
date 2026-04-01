"use client";

import { Eye, EyeOff, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { ResumeSectionEditorSettings } from "@/components/product/editor/ResumeSectionEditorSettings";
import { ResumeSectionItemCard } from "@/components/product/editor/ResumeSectionItemCard";
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

      <ResumeSectionEditorSettings definition={definition} onChange={onChange} section={section} />

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>{section.type === "skills" ? "技能分组" : "条目"}</h3>
        </div>

        <div className="editor-item-stack">
          {section.items.length > 0 ? (
            section.items.map((item, index) => (
              <ResumeSectionItemCard
                active={activeItemId === item.id}
                document={document}
                expanded={activeExpandedItemId === item.id}
                index={index}
                item={item}
                key={item.id}
                onActivate={() => onActiveItemChange(item.id)}
                onChange={(nextItem) =>
                  onChange({
                    ...section,
                    items: section.items.map((current) => (current.id === nextItem.id ? nextItem : current)),
                  })
                }
                onCopy={() => onCopyItem(item.id)}
                onDelete={() => onDeleteItem(item.id)}
                onDuplicate={() => onDuplicateItem(item.id)}
                onMove={(direction) => onMoveItem(item.id, direction)}
                onToggle={() => {
                  const next = activeExpandedItemId === item.id ? null : item.id;
                  setExpandedItemId(next);
                  onActiveItemChange(next ?? item.id);
                }}
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
