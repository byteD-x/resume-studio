"use client";

import {
  Bold,
  Eraser,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Mark } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { startTransition, useEffect, useState } from "react";
import { sanitizeRichTextHtml, stripHtml } from "@/lib/utils";

type InlineStyleAttributes = {
  color?: string | null;
  fontFamily?: string | null;
  fontSize?: string | null;
};

const fontFamilyOptions = [
  { label: "默认", value: "inherit" },
  { label: "Aptos", value: "Aptos" },
  { label: "Georgia", value: "Georgia" },
  { label: "Iowan", value: "Iowan Old Style" },
  { label: "Arial", value: "Arial" },
] as const;

const fontSizeOptions = [
  { label: "默认", value: "inherit" },
  { label: "9 pt", value: "9pt" },
  { label: "10 pt", value: "10pt" },
  { label: "11 pt", value: "11pt" },
  { label: "12 pt", value: "12pt" },
  { label: "14 pt", value: "14pt" },
] as const;

const InlineStyleMark = Mark.create({
  name: "inlineStyle",
  priority: 1000,
  inclusive: true,

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
      },
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily.replace(/["']/g, "") || null,
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[style]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const style = [
      HTMLAttributes.color ? `color: ${HTMLAttributes.color}` : "",
      HTMLAttributes.fontFamily ? `font-family: ${HTMLAttributes.fontFamily}` : "",
      HTMLAttributes.fontSize ? `font-size: ${HTMLAttributes.fontSize}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    return ["span", style ? { style } : {}, 0];
  },
});

function normalizeRichTextHtml(value: string) {
  const sanitized = sanitizeRichTextHtml(value || "");
  return stripHtml(sanitized) ? sanitized : "";
}

function getEditorHtml(html: string) {
  const normalized = normalizeRichTextHtml(html);
  return normalized || "<p></p>";
}

function hasVisualContent(value: string) {
  return stripHtml(value).length > 0;
}

export function RichTextField({
  ariaLabel,
  helper,
  label,
  minHeight = 152,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel?: string;
  helper?: string;
  label?: string;
  minHeight?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const resolvedAriaLabel = ariaLabel ?? label ?? "Rich text field";
  const [isFocused, setIsFocused] = useState(false);
  const [, setRevision] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": resolvedAriaLabel,
        class: "rich-text-field-prosemirror",
      },
    },
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
      }),
      InlineStyleMark,
    ],
    content: getEditorHtml(value),
    onBlur: () => {
      setIsFocused(false);
      startTransition(() => setRevision((current) => current + 1));
    },
    onCreate: () => {
      startTransition(() => setRevision((current) => current + 1));
    },
    onFocus: () => {
      setIsFocused(true);
      startTransition(() => setRevision((current) => current + 1));
    },
    onSelectionUpdate: () => {
      startTransition(() => setRevision((current) => current + 1));
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = normalizeRichTextHtml(currentEditor.getHTML());
      onChange(nextValue);
      startTransition(() => setRevision((current) => current + 1));
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentValue = normalizeRichTextHtml(editor.getHTML());
    const nextValue = normalizeRichTextHtml(value);

    if (currentValue !== nextValue) {
      editor.commands.setContent(getEditorHtml(nextValue), { emitUpdate: false });
    }
  }, [editor, value]);

  const currentInlineStyle = (() => {
    if (!editor) {
      return {
        color: "#1c2430",
        fontFamily: "inherit",
        fontSize: "inherit",
      };
    }

    const attributes = (editor.getAttributes("inlineStyle") as InlineStyleAttributes | undefined) ?? {};

    return {
      color: attributes.color || "#1c2430",
      fontFamily: attributes.fontFamily || "inherit",
      fontSize: attributes.fontSize || "inherit",
    };
  })();

  function applyInlineStyle(partial: InlineStyleAttributes) {
    if (!editor) return;

    const current = (editor.getAttributes("inlineStyle") as InlineStyleAttributes | undefined) ?? {};
    const next = {
      color: partial.color === undefined ? current.color ?? null : partial.color,
      fontFamily: partial.fontFamily === undefined ? current.fontFamily ?? null : partial.fontFamily,
      fontSize: partial.fontSize === undefined ? current.fontSize ?? null : partial.fontSize,
    };
    const hasActiveStyle = Object.values(next).some(Boolean);
    const chain = editor.chain().focus();

    if (hasActiveStyle) {
      chain.setMark("inlineStyle", next).run();
      return;
    }

    chain.unsetMark("inlineStyle").run();
  }

  function clearFormatting() {
    if (!editor) return;

    editor.chain().focus().unsetMark("inlineStyle").unsetBold().unsetItalic().unsetUnderline().run();
  }

  return (
    <label className="field-shell field-shell-rich">
      {label ? <span className="field-label">{label}</span> : null}

      <div className="rich-text-field">
        <div aria-label={`${resolvedAriaLabel} toolbar`} className="rich-text-toolbar" role="toolbar">
          <div className="rich-text-toolbar-group">
            <select
              aria-label="字体"
              className="rich-text-select"
              onChange={(event) =>
                applyInlineStyle({
                  fontFamily: event.target.value === "inherit" ? null : event.target.value,
                })
              }
              value={currentInlineStyle.fontFamily}
            >
              {fontFamilyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="字号"
              className="rich-text-select rich-text-select-size"
              onChange={(event) =>
                applyInlineStyle({
                  fontSize: event.target.value === "inherit" ? null : event.target.value,
                })
              }
              value={currentInlineStyle.fontSize}
            >
              {fontSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="rich-text-color-shell">
              <span className="sr-only">文字颜色</span>
              <input
                aria-label="文字颜色"
                className="rich-text-color"
                onChange={(event) =>
                  applyInlineStyle({
                    color: event.target.value,
                  })
                }
                type="color"
                value={currentInlineStyle.color}
              />
            </label>
          </div>

          <div className="rich-text-toolbar-group">
            <button
              aria-pressed={editor?.isActive("bold") ?? false}
              className={`rich-text-button ${editor?.isActive("bold") ? "rich-text-button-active" : ""}`}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="加粗"
              type="button"
            >
              <Bold className="size-4" />
            </button>
            <button
              aria-pressed={editor?.isActive("italic") ?? false}
              className={`rich-text-button ${editor?.isActive("italic") ? "rich-text-button-active" : ""}`}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="斜体"
              type="button"
            >
              <Italic className="size-4" />
            </button>
            <button
              aria-pressed={editor?.isActive("underline") ?? false}
              className={`rich-text-button ${editor?.isActive("underline") ? "rich-text-button-active" : ""}`}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              title="下划线"
              type="button"
            >
              <UnderlineIcon className="size-4" />
            </button>
          </div>

          <div className="rich-text-toolbar-group">
            <button
              aria-pressed={editor?.isActive("bulletList") ?? false}
              className={`rich-text-button ${editor?.isActive("bulletList") ? "rich-text-button-active" : ""}`}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="无序列表"
              type="button"
            >
              <List className="size-4" />
            </button>
            <button
              aria-pressed={editor?.isActive("orderedList") ?? false}
              className={`rich-text-button ${editor?.isActive("orderedList") ? "rich-text-button-active" : ""}`}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="有序列表"
              type="button"
            >
              <ListOrdered className="size-4" />
            </button>
            <button className="rich-text-button" onClick={clearFormatting} title="清除格式" type="button">
              <Eraser className="size-4" />
            </button>
          </div>
        </div>

        <div className="rich-text-surface" style={{ minHeight }}>
          {!isFocused && !hasVisualContent(value) && placeholder ? (
            <span className="rich-text-placeholder">{placeholder}</span>
          ) : null}

          <EditorContent className="rich-text-editor" editor={editor} />
        </div>
      </div>

      {helper ? <span className="field-help">{helper}</span> : null}
    </label>
  );
}
