"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const FALLBACK_PREVIEW_WIDTH = 794;
const FALLBACK_PREVIEW_HEIGHT = 1123;

export function PreviewFrame({ html }: { html: string }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentObserverRef = useRef<ResizeObserver | null>(null);
  const [availableWidth, setAvailableWidth] = useState(FALLBACK_PREVIEW_WIDTH);
  const [intrinsicSize, setIntrinsicSize] = useState({
    width: FALLBACK_PREVIEW_WIDTH,
    height: FALLBACK_PREVIEW_HEIGHT,
  });

  const handleLoad = () => {
    contentObserverRef.current?.disconnect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextWidth = shellRef.current?.clientWidth ?? FALLBACK_PREVIEW_WIDTH;
        setAvailableWidth((current) => (Math.abs(current - nextWidth) < 1 ? current : nextWidth));
        const document = iframeRef.current?.contentDocument;
        const root = document?.documentElement;
        const body = document?.body;
        if (!root) return;

        const measureFrame = () => {
          const measuredWidth = Math.max(
            root.scrollWidth,
            root.offsetWidth,
            body?.scrollWidth ?? 0,
            body?.offsetWidth ?? 0,
            FALLBACK_PREVIEW_WIDTH,
          );
          const measuredHeight = Math.max(
            root.scrollHeight,
            root.offsetHeight,
            body?.scrollHeight ?? 0,
            body?.offsetHeight ?? 0,
            FALLBACK_PREVIEW_HEIGHT,
          );

          setIntrinsicSize((current) =>
            current.width === measuredWidth && current.height === measuredHeight
              ? current
              : { width: measuredWidth, height: measuredHeight },
          );
        };

        measureFrame();

        const observer = new ResizeObserver(() => {
          measureFrame();
        });

        observer.observe(root);
        if (body && body !== root) {
          observer.observe(body);
        }

        contentObserverRef.current = observer;
      });
    });
  };

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const syncWidth = () => {
      const nextWidth = shell.clientWidth;
      setAvailableWidth((current) => (Math.abs(current - nextWidth) < 1 ? current : nextWidth));
    };

    syncWidth();

    const observer = new ResizeObserver(() => {
      syncWidth();
    });

    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      contentObserverRef.current?.disconnect();
    },
    [],
  );

  const scale = Math.min(1, availableWidth / intrinsicSize.width);
  const shellStyle = {
    "--preview-frame-height": `${Math.max(intrinsicSize.height * scale, 320)}px`,
  } as CSSProperties;
  const stageStyle = {
    width: `${intrinsicSize.width}px`,
    height: `${intrinsicSize.height}px`,
    transform: `scale(${scale})`,
  } as CSSProperties;

  return (
    <div className="preview-frame-shell" ref={shellRef} style={shellStyle}>
      <div className="preview-frame-fit">
        <div className="preview-frame-stage" style={stageStyle}>
          <iframe
            className="preview-frame"
            onLoad={handleLoad}
            ref={iframeRef}
            sandbox="allow-same-origin"
            srcDoc={html}
            title="Resume preview"
          />
        </div>
      </div>
    </div>
  );
}
