"use client";

import { Keyboard, X } from "lucide-react";

const shortcutGroups = [
  {
    title: "通用",
    items: [
      ["Ctrl / Cmd + S", "保存"],
      ["Ctrl / Cmd + P", "打开预览"],
      ["Ctrl / Cmd + Z", "撤销"],
      ["Ctrl / Cmd + Shift + Z", "重做"],
      ["Ctrl / Cmd + /", "快捷键"],
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
      ["Ctrl / Cmd + Enter", "插入空行"],
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
  if (!open) return null;

  return (
    <div className="editor-shortcut-overlay" onClick={onClose} role="presentation">
      <section
        aria-label="快捷键说明"
        className="editor-shortcut-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="editor-shortcut-head">
          <div>
            <p className="editor-shortcut-kicker">快捷键</p>
            <h2 className="editor-shortcut-title">键盘操作</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            <X className="size-4" />
          </button>
        </div>

        <div className="editor-shortcut-grid">
          {shortcutGroups.map((group) => (
            <section className="editor-shortcut-group" key={group.title}>
              <div className="editor-shortcut-group-head">
                <Keyboard className="size-4 text-[color:var(--accent-strong)]" />
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
