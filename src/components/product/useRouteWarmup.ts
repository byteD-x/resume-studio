"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LAST_RESUME_ID_KEY = "resume-studio:last-resume-id";

function prefetchSafely(router: ReturnType<typeof useRouter>, href: string) {
  try {
    router.prefetch(href);
  } catch {
    // Ignore prefetch failures in dev warmup paths.
  }
}

export function rememberLastResumeId(id: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_RESUME_ID_KEY, id);
}

export function readLastResumeId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LAST_RESUME_ID_KEY);
}

export function useRouteWarmup({
  routes = [],
  resumeId,
  includeLastResume = false,
}: {
  routes?: string[];
  resumeId?: string | null;
  includeLastResume?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    for (const route of routes) {
      prefetchSafely(router, route);
    }

    const candidateIds = new Set<string>();

    if (resumeId) {
      candidateIds.add(resumeId);
      rememberLastResumeId(resumeId);
    }

    if (includeLastResume) {
      const lastResumeId = readLastResumeId();
      if (lastResumeId) {
        candidateIds.add(lastResumeId);
      }
    }

    for (const id of candidateIds) {
      prefetchSafely(router, `/studio/${id}`);
      prefetchSafely(router, `/studio/${id}/preview`);
    }
  }, [includeLastResume, resumeId, router, routes]);
}
