"use client";

import { useId, useRef } from "react";
import { Bold, Code2, Eraser, Heading2, Link2, List, Quote, RotateCcw, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { handleSanitizedPaste, indentSelectedLines, isModKey } from "@/lib/editor-input";

function countLines(value: string) {
  return Math.max(1, value.split("\n").length);
}

function countChars(value: string) {
  return value.trim().length;
}

function buildLineNumbers(total: number) {
  return Array.from({ length: total }, (_, index) => index + 1);
}

type ToolbarAction =
  | { type: "wrap"; prefix: string; suffix: string; placeholder: string }
  | { type: "insert"; snippet: string };

export function ResumeMarkdownPanel({
  value,
  parseError,
  onChange,
  onInsertStarter,
  onClear,
}: {
  value: string;
  parseError: string | null;
  onChange: (value: string) => void;
  onInsertStarter: () => void;
  onClear: () => void;
}) {
  const noteId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const lineCount = countLines(value);
  const charCount = countChars(value);
  const lineNumbers = buildLineNumbers(lineCount);

  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      if (action.type === "insert") {
        onChange(`${value}${value.endsWith("\n") ? "" : "\n"}${action.snippet}`);
      }
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    let nextValue = value;
    let nextSelectionStart = start;
    let nextSelectionEnd = end;

    if (action.type === "wrap") {
      const payload = selected || action.placeholder;
      nextValue = `${before}${action.prefix}${payload}${action.suffix}${after}`;
      nextSelectionStart = start + action.prefix.length;
      nextSelectionEnd = nextSelectionStart + payload.length;
    } else {
      const needsLeadingBreak = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
      const needsTrailingBreak = after.length > 0 && !after.startsWith("\n") ? "\n" : "";
      nextValue = `${before}${needsLeadingBreak}${action.snippet}${needsTrailingBreak}${after}`;
      nextSelectionStart = start + needsLeadingBreak.length;
      nextSelectionEnd = nextSelectionStart + action.snippet.length;
    }

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  };

  return (
    <section className="resume-editor-panel resume-editor-source-panel">
      <div className="resume-editor-panel-head">
        <div>
          <p className="resume-editor-panel-kicker">Markdown</p>
          <h2 className="resume-editor-panel-title">Markdown 源码</h2>
          <p className="resume-editor-panel-copy">直接编辑 Markdown 内容。</p>
        </div>

        <div className="resume-editor-panel-actions">
          <Button onClick={onInsertStarter} variant="secondary">
            <RotateCcw className="size-4" />
            插入结构
          </Button>
          <Button onClick={onClear} variant="ghost">
            <Eraser className="size-4" />
            清空
          </Button>
        </div>
      </div>

      <div className="resume-editor-source-banner">
        <div>
          <strong>编写提示</strong>
          <p>支持常用 Markdown 语法。</p>
        </div>
        <Badge tone={parseError ? "warning" : "success"}>
          {parseError ? "需修正" : "可解析"}
        </Badge>
      </div>

      <div className="resume-editor-source-toolbar">
        <button
          className="editor-source-chip"
          onClick={() => applyAction({ type: "insert", snippet: "## 新小节 [custom]\n" })}
          type="button"
        >
          <Heading2 className="size-4" />
          标题
        </button>
        <button
          className="editor-source-chip"
          onClick={() => applyAction({ type: "wrap", prefix: "**", suffix: "**", placeholder: "强调内容" })}
          type="button"
        >
          <Bold className="size-4" />
          加粗
        </button>
        <button
          className="editor-source-chip"
          onClick={() => applyAction({ type: "insert", snippet: "- 要点一\n- 要点二\n" })}
          type="button"
        >
          <List className="size-4" />
          列表
        </button>
        <button
          className="editor-source-chip"
          onClick={() => applyAction({ type: "insert", snippet: "> 补充说明\n" })}
          type="button"
        >
          <Quote className="size-4" />
          引用
        </button>
        <button
          className="editor-source-chip"
          onClick={() =>
            applyAction({
              type: "wrap",
              prefix: "[",
              suffix: "](https://example.com)",
              placeholder: "链接文字",
            })
          }
          type="button"
        >
          <Link2 className="size-4" />
          链接
        </button>
        <button
          className="editor-source-chip"
          onClick={() => applyAction({ type: "insert", snippet: "```text\n内容\n```\n" })}
          type="button"
        >
          <Code2 className="size-4" />
          代码
        </button>
        <button
          className="editor-source-chip"
          onClick={() => applyAction({ type: "insert", snippet: "| 字段 | 内容 |\n| --- | --- |\n| 项目 | 内容 |\n" })}
          type="button"
        >
          <Table2 className="size-4" />
          表格
        </button>
      </div>

      <div className={`resume-editor-source-shell ${parseError ? "resume-editor-source-shell-error" : ""}`}>
        <div className="resume-editor-source-gutter" ref={gutterRef}>
          {lineNumbers.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <textarea
          aria-describedby={noteId}
          aria-invalid={Boolean(parseError)}
          aria-label="Markdown 源码"
          className="resume-editor-source-input"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            const textarea = event.currentTarget;

            if (event.key === "Tab") {
              event.preventDefault();
              const next = indentSelectedLines(
                value,
                textarea.selectionStart ?? 0,
                textarea.selectionEnd ?? 0,
                event.shiftKey ? "outdent" : "indent",
              );
              onChange(next.nextValue);
              requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
              });
              return;
            }

            if (isModKey(event) && event.key.toLowerCase() === "b") {
              event.preventDefault();
              applyAction({ type: "wrap", prefix: "**", suffix: "**", placeholder: "强调内容" });
              return;
            }

            if (isModKey(event) && event.key.toLowerCase() === "i") {
              event.preventDefault();
              applyAction({ type: "wrap", prefix: "_", suffix: "_", placeholder: "斜体内容" });
              return;
            }

            if (isModKey(event) && event.key === "Enter") {
              event.preventDefault();
              applyAction({ type: "insert", snippet: "\n\n" });
            }
          }}
          onPaste={(event) =>
            handleSanitizedPaste(event, {
              currentValue: value,
              mode: "markdown",
              onValueChange: onChange,
            })
          }
          onScroll={(event) => {
            if (gutterRef.current) {
              gutterRef.current.scrollTop = event.currentTarget.scrollTop;
            }
          }}
          placeholder={`# 姓名\n> 目标岗位\n\n## Summary [summary]\n补充一句介绍。`}
          ref={textareaRef}
          spellCheck={false}
          value={value}
        />
      </div>

      <div className="resume-editor-source-footer">
        <div className="resume-editor-source-stats">
          <Badge tone="neutral">{lineCount} 行</Badge>
          <Badge tone="neutral">{charCount} 字</Badge>
          <Badge tone="accent">实时预览</Badge>
        </div>
        <p className={`resume-editor-source-note ${parseError ? "resume-editor-source-note-error" : ""}`} id={noteId}>
          {parseError
            ? parseError
            : "切回表单后会保留当前内容。"}
        </p>
      </div>
    </section>
  );
}
