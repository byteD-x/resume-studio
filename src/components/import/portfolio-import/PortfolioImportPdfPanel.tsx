"use client";

import type { DragEvent, RefObject } from "react";
import { Loader2, UploadCloud } from "lucide-react";

export function PortfolioImportPdfPanel({
  error,
  inputRef,
  isExtracting,
  onDrop,
  onFileSelect,
  onOpenFilePicker,
}: {
  error: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isExtracting: boolean;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onFileSelect: (file: File) => void;
  onOpenFilePicker: () => void;
}) {
  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center p-8 text-center">
      <input
        accept=".pdf,application/pdf"
        className="sr-only"
        disabled={isExtracting}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelect(file);
          }
        }}
        ref={inputRef}
        type="file"
      />

      <button
        aria-describedby="pdf-import-help"
        className={`flex h-[10rem] w-[18rem] flex-col items-center justify-center rounded-[1rem] border-2 border-dashed transition-colors ${
          isExtracting
            ? "border-slate-200 bg-slate-50"
            : "cursor-pointer border-[color:var(--accent-line)] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-layer)]"
        }`}
        disabled={isExtracting}
        onClick={() => !isExtracting && onOpenFilePicker()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        type="button"
      >
        {isExtracting ? (
          <div className="flex flex-col items-center text-[color:var(--ink-soft)]">
            <Loader2 className="mb-3 size-6 animate-spin text-[color:var(--accent)]" />
            <span className="text-[0.95rem] font-medium">正在提取内容...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-[color:var(--ink-muted)]">
            <UploadCloud className="mb-3 size-8 text-[color:var(--accent-soft)]" />
            <span className="mb-1 text-[0.95rem] font-medium text-[color:var(--ink-strong)]">选择 PDF 简历文件</span>
            <span className="text-[0.8rem]">或将文件拖至此处</span>
          </div>
        )}
      </button>

      {error ? (
        <p className="mt-4 text-[0.85rem] font-medium text-red-500" id="pdf-import-help">
          {error}
        </p>
      ) : (
        <p className="mt-6 max-w-[20rem] text-[0.85rem] text-[color:var(--ink-muted)]" id="pdf-import-help">
          系统会尽量保留基础经历，并在进入编辑器后提示你重点核对需要确认的部分。
        </p>
      )}
    </div>
  );
}
