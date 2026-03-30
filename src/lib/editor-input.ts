import type { ClipboardEvent as ReactClipboardEvent, KeyboardEvent as ReactKeyboardEvent } from "react";

type InputLikeElement = HTMLInputElement | HTMLTextAreaElement;
type PasteMode = "single-line" | "multiline" | "skills" | "markdown" | "bullets";

function stripInvisibleCharacters(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function normalizeEditorText(value: string) {
  return stripInvisibleCharacters(value).replace(/\r\n/g, "\n").replace(/\u00A0/g, " ").replace(/\t/g, "  ");
}

export function cleanPastedText(value: string, mode: PasteMode) {
  const normalized = normalizeEditorText(value).replace(/[ \t]+\n/g, "\n");

  if (mode === "markdown") {
    return normalized.trimEnd();
  }

  if (mode === "single-line") {
    return normalized.replace(/\s+/g, " ").trim();
  }

  if (mode === "skills") {
    return normalized
      .split(/[\n,，、;；|]+/)
      .map((item) => item.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .join(", ");
  }

  if (mode === "bullets") {
    return normalized
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .join("\n");
  }

  return normalized.replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function replaceSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insertedText: string,
) {
  const nextValue = `${value.slice(0, selectionStart)}${insertedText}${value.slice(selectionEnd)}`;
  const nextCursor = selectionStart + insertedText.length;
  return {
    nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}

export function handleSanitizedPaste(
  event: ReactClipboardEvent<InputLikeElement>,
  options: {
    currentValue: string;
    mode: PasteMode;
    onValueChange: (nextValue: string) => void;
    onAfterPaste?: (nextValue: string) => void;
  },
) {
  const rawText = event.clipboardData.getData("text/plain");
  if (!rawText) return;

  event.preventDefault();
  const element = event.currentTarget;
  const cleaned = cleanPastedText(rawText, options.mode);
  const next = replaceSelection(
    options.currentValue,
    element.selectionStart ?? options.currentValue.length,
    element.selectionEnd ?? options.currentValue.length,
    cleaned,
  );

  options.onValueChange(next.nextValue);
  options.onAfterPaste?.(next.nextValue);

  requestAnimationFrame(() => {
    element.focus();
    element.setSelectionRange(next.selectionStart, next.selectionEnd);
  });
}

export function indentSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  direction: "indent" | "outdent",
) {
  const blockStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const blockEndIndex = value.indexOf("\n", selectionEnd);
  const blockEnd = blockEndIndex === -1 ? value.length : blockEndIndex;
  const before = value.slice(0, blockStart);
  const block = value.slice(blockStart, blockEnd);
  const after = value.slice(blockEnd);
  const lines = block.split("\n");

  const nextLines =
    direction === "indent"
      ? lines.map((line) => `  ${line}`)
      : lines.map((line) => line.replace(/^( {1,2}|\t)/, ""));

  const nextBlock = nextLines.join("\n");
  const nextValue = `${before}${nextBlock}${after}`;
  const delta = nextBlock.length - block.length;
  const startShift = direction === "indent" ? 2 : Math.min(2, selectionStart - blockStart);

  return {
    nextValue,
    selectionStart: selectionStart + (selectionStart === selectionEnd ? startShift : 0),
    selectionEnd: selectionEnd + delta,
  };
}

export function isTextEntryTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function isModKey(event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>) {
  return event.metaKey || event.ctrlKey;
}
