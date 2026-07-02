"use client";
import { apiBase } from "./api";

const TOKEN_KEY = "caerora-staff-access";
const REFRESH_KEY = "caerora-staff-refresh";

export function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setStaffTokens(access: string, refresh?: string) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearStaffTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function base() {
  // Always the public base for the browser panel.
  return apiBase();
}

async function req<T>(method: string, path: string, body?: unknown, isForm = false): Promise<T> {
  const token = getStaffToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (isForm) {
      payload = body as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }
  const res = await fetch(`${base()}/admin${path}`, { method, headers, body: payload });
  if (res.status === 401) {
    clearStaffTokens();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/studio/login")) {
      window.location.href = "/studio/login";
    }
    throw new ApiError("Session expired", 401);
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    let data: unknown;
    try {
      data = await res.json();
      detail = (data as { detail?: string }).detail || JSON.stringify(data);
    } catch {
      /* noop */
    }
    throw new ApiError(detail, res.status, data);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await res.text()) as unknown as T;
  return res.json();
}

export const adminApi = {
  get: <T>(path: string) => req<T>("GET", path),
  post: <T>(path: string, body?: unknown) => req<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => req<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => req<T>("PUT", path, body),
  del: <T>(path: string) => req<T>("DELETE", path),
  postForm: <T>(path: string, form: FormData) => req<T>("POST", path, form, true),
  patchForm: <T>(path: string, form: FormData) => req<T>("PATCH", path, form, true),
  putForm: <T>(path: string, form: FormData) => req<T>("PUT", path, form, true),
};
