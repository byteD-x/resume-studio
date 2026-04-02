"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  isPreviewNavigateTarget,
  serializePreviewTarget,
  type PreviewNavigateTarget,
} from "@/lib/resume-preview/types";

const FALLBACK_PREVIEW_WIDTH = 794;
const FALLBACK_PREVIEW_HEIGHT = 1123;

export type PreviewZoomPreset = "fit-width" | "fit-page" | 80 | 100 | 120;

export interface PreviewFrameMetrics {
  pageCount: number;
  scale: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
}

export function PreviewFrame({
  focusedTarget,
  html,
  zoom = "fit-width",
  onMetricsChange,
  onNavigateTarget,
}: {
  focusedTarget?: PreviewNavigateTarget;
  html: string;
  zoom?: PreviewZoomPreset;
  onMetricsChange?: (metrics: PreviewFrameMetrics) => void;
  onNavigateTarget?: (target: PreviewNavigateTarget) => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentObserverRef = useRef<ResizeObserver | null>(null);
  const [availableSize, setAvailableSize] = useState({
    width: FALLBACK_PREVIEW_WIDTH,
    height: FALLBACK_PREVIEW_HEIGHT,
  });
  const [intrinsicSize, setIntrinsicSize] = useState({
    width: FALLBACK_PREVIEW_WIDTH,
    height: FALLBACK_PREVIEW_HEIGHT,
  });

  const handleLoad = () => {
    contentObserverRef.current?.disconnect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const shell = shellRef.current;
        const document = iframeRef.current?.contentDocument;
        const root = document?.documentElement;
        const body = document?.body;
        if (!shell || !root) {
          return;
        }

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

          setAvailableSize((current) => {
            const next = {
              width: shell.clientWidth || FALLBACK_PREVIEW_WIDTH,
              height: shell.clientHeight || FALLBACK_PREVIEW_HEIGHT,
            };
            return current.width === next.width && current.height === next.height ? current : next;
          });

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
    if (!shell) {
      return;
    }

    const syncSize = () => {
      const next = {
        width: shell.clientWidth || FALLBACK_PREVIEW_WIDTH,
        height: shell.clientHeight || FALLBACK_PREVIEW_HEIGHT,
      };
      setAvailableSize((current) => (current.width === next.width && current.height === next.height ? current : next));
    };

    syncSize();

    const observer = new ResizeObserver(() => {
      syncSize();
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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const payload = event.data as { type?: string; payload?: unknown } | null;
      if (payload?.type !== "resume-preview:navigate" || !isPreviewNavigateTarget(payload.payload)) {
        return;
      }

      onNavigateTarget?.(payload.payload);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onNavigateTarget]);

  const fitWidthScale = availableSize.width / intrinsicSize.width;
  const fitPageScale = Math.min(fitWidthScale, availableSize.height / FALLBACK_PREVIEW_HEIGHT);
  const resolvedScale =
    typeof zoom === "number"
      ? zoom / 100
      : zoom === "fit-page"
        ? fitPageScale
        : fitWidthScale;
  const scale = Math.max(0.35, Math.min(resolvedScale, 2));
  const pageCount = Math.max(1, Math.ceil(intrinsicSize.height / FALLBACK_PREVIEW_HEIGHT));

  useEffect(() => {
    if (!focusedTarget) {
      return;
    }

    const shell = shellRef.current;
    const scrollContainer = shell?.parentElement;
    const document = iframeRef.current?.contentDocument;
    if (!shell || !scrollContainer || !document) {
      return;
    }

    const targetValue = serializePreviewTarget(focusedTarget);
    const targetElement = Array.from(document.querySelectorAll<HTMLElement>("[data-preview-target]")).find(
      (element) => element.getAttribute("data-preview-target") === targetValue,
    );

    if (!targetElement) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetRect = targetElement.getBoundingClientRect();
    const nextScrollTop = Math.max(0, targetRect.top * scale - 24);

    scrollContainer.scrollTo({
      top: nextScrollTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [focusedTarget, html, intrinsicSize.height, scale]);

  useEffect(() => {
    onMetricsChange?.({
      pageCount,
      scale,
      intrinsicWidth: intrinsicSize.width,
      intrinsicHeight: intrinsicSize.height,
    });
  }, [intrinsicSize.height, intrinsicSize.width, onMetricsChange, pageCount, scale]);

  const shellStyle = {
    "--preview-frame-height": `${Math.max(intrinsicSize.height * scale, 320)}px`,
  } as CSSProperties;
  const viewportStyle = {
    width: `${intrinsicSize.width * scale}px`,
    height: `${intrinsicSize.height * scale}px`,
  } as CSSProperties;
  const stageStyle = {
    width: `${intrinsicSize.width}px`,
    height: `${intrinsicSize.height}px`,
    transform: `scale(${scale})`,
  } as CSSProperties;

  return (
    <div className="preview-frame-shell" ref={shellRef} style={shellStyle}>
      <div className="preview-frame-fit">
        <div className="preview-frame-viewport" style={viewportStyle}>
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
    </div>
  );
}
