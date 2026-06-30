"use client";
import { apiBase } from "./api";

const TOKEN_KEY = "caerora-access";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authed(path: string, init?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${apiBase()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Request failed");
  return res.json();
}

export const auth = {
  async login(username: string, password: string) {
    const data = await authed("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access);
    return data;
  },
  async register(payload: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) {
    const data = await authed("/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(data.access);
    return data;
  },
  me: () => authed("/auth/me/"),
  orders: () => authed("/auth/orders/"),
};
