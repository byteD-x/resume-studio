"use client";

import { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";

const shortcutGroups = [
  {
    title: "通用",
    items: [
      ["Ctrl / Cmd + S", "保存"],
      ["Ctrl / Cmd + P", "打开预览"],
      ["Ctrl / Cmd + Z", "撤销"],
      ["Ctrl / Cmd + Shift + Z", "重做"],
      ["Ctrl / Cmd + /", "打开快捷键"],
    ],
  },
  {
    title: "条目编辑",
    items: [
      ["Alt + ↑ / ↓", "调整顺序"],
      ["Ctrl / Cmd + Enter", "新增下一条"],
      ["Delete / Backspace", "删除当前条目"],
      ["Esc", "取消选择"],
    ],
  },
  {
    title: "Markdown",
    items: [
      ["Tab / Shift + Tab", "缩进或反缩进"],
      ["Ctrl / Cmd + B", "加粗"],
      ["Ctrl / Cmd + I", "斜体"],
      ["Ctrl / Cmd + Enter", "插入空白行"],
    ],
  },
] as const;

export function EditorShortcutDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="editor-shortcut-overlay" onClick={onClose} role="presentation">
      <section
        aria-labelledby="editor-shortcut-title"
        aria-modal="true"
        className="editor-shortcut-dialog"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <div className="editor-shortcut-head">
          <div>
            <p className="editor-shortcut-kicker">快捷操作</p>
            <h2 className="editor-shortcut-title" id="editor-shortcut-title">
              快捷键
            </h2>
            <p className="editor-shortcut-copy">常用操作集中查看。</p>
          </div>
          <button
            aria-label="关闭快捷键说明"
            className="icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="editor-shortcut-grid">
          {shortcutGroups.map((group) => (
            <section className="editor-shortcut-group" key={group.title}>
              <div className="editor-shortcut-group-head">
                <Keyboard className="editor-shortcut-icon size-4" />
                <strong>{group.title}</strong>
              </div>
              <div className="editor-shortcut-list">
                {group.items.map(([keys, description]) => (
                  <div className="editor-shortcut-row" key={keys}>
                    <kbd>{keys}</kbd>
                    <span>{description}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
