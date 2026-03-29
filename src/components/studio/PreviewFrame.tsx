"use client";

export function PreviewFrame({ html }: { html: string }) {
  return (
    <iframe
      className="preview-frame"
      srcDoc={html}
      title="简历预览"
      sandbox="allow-same-origin"
    />
  );
}
