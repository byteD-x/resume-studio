"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Copy, PenLine } from "lucide-react";
import { htmlToMarkdown, markdownToHtml, normalizeMarkdown } from "@/lib/markdown";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [mode, setMode] = useState<"visual" | "markdown">("visual");
  const [markdownDraft, setMarkdownDraft] = useState<string | null>(null);
  const lastMarkdownRef = useRef<string | null>(null);
  const baselineMarkdown = useMemo(() => htmlToMarkdown(value), [value]);
  const markdownValue = markdownDraft ?? baselineMarkdown;
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
        },
        undoRedo: {
          depth: 50,
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    onUpdate({ editor: instance }) {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return <div className="editor-card min-h-44 animate-pulse bg-white/50" />;
  }

  const applyLink = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("粘贴链接地址", current ?? "");

    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const switchToVisual = () => {
    const html = markdownToHtml(markdownValue);
    lastMarkdownRef.current = markdownValue;
    onChange(html);
    setMarkdownDraft(null);
    setMode("visual");
  };

  const switchToMarkdown = () => {
    const currentMarkdown = htmlToMarkdown(editor.getHTML());
    if (
      lastMarkdownRef.current !== null &&
      normalizeMarkdown(lastMarkdownRef.current) === normalizeMarkdown(currentMarkdown)
    ) {
      lastMarkdownRef.current = null;
    }
    setMarkdownDraft(currentMarkdown);
    setMode("markdown");
  };

  return (
    <div className="editor-card stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="toolbar">
          <button
            type="button"
            data-active={mode === "visual"}
            onClick={switchToVisual}
          >
            <PenLine size={14} />
            可视化
          </button>
          <button
            type="button"
            data-active={mode === "markdown"}
            onClick={switchToMarkdown}
          >
            <Copy size={14} />
            Markdown 源码
          </button>
        </div>
        <p className="meta-note">
          适合先用 Markdown 批量粘贴，再回到可视化模式做结构化编辑。
        </p>
      </div>

      {mode === "visual" ? (
        <>
          <div className="toolbar">
            <button
              type="button"
              data-active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              加粗
            </button>
            <button
              type="button"
              data-active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              斜体
            </button>
            <button
              type="button"
              data-active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              下划线
            </button>
            <button
              type="button"
              data-active={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              H1
            </button>
            <button
              type="button"
              data-active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </button>
            <button
              type="button"
              data-active={editor.isActive("heading", { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </button>
            <button
              type="button"
              data-active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              无序列表
            </button>
            <button
              type="button"
              data-active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              有序列表
            </button>
            <button
              type="button"
              data-active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              引用
            </button>
            <button
              type="button"
              data-active={editor.isActive("link")}
              onClick={applyLink}
            >
              链接
            </button>
          </div>

          <EditorContent editor={editor} />
        </>
      ) : (
        <textarea
          className="text-area min-h-72 font-mono text-sm leading-7"
          spellCheck={false}
          value={markdownValue}
          onChange={(event) => {
            const nextMarkdown = event.target.value;
            setMarkdownDraft(nextMarkdown);
            lastMarkdownRef.current = nextMarkdown;
            onChange(markdownToHtml(nextMarkdown));
          }}
          placeholder={"# 章节标题\n\n- 在这里粘贴 Markdown\n- 需要时再切回可视化模式"}
        />
      )}
    </div>
  );
}
