"use client";

function buildNextPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function redirectToLogin(nextPath = buildNextPath()) {
  if (typeof window === "undefined") {
    return;
  }

  const href = nextPath && nextPath !== "/"
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : "/login";
  window.location.assign(href);
}

export async function getJsonOrThrow<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("需要先登录。");
  }

  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getResponseError(response: Response, fallback: string) {
  if (response.status === 401) {
    redirectToLogin();
    return "需要先登录。";
  }

  const text = await response.text();
  return text || fallback;
}
