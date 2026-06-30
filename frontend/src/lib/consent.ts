"use client";

export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
  version: string;
}

export const CONSENT_KEY = "caerora-consent";
export const CONSENT_VERSION = "1.0";

export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  decided: false,
  version: CONSENT_VERSION,
};

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return DEFAULT_CONSENT;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return DEFAULT_CONSENT;
    return parsed;
  } catch (e) {
    return DEFAULT_CONSENT;
  }
}

export function writeConsent(state: ConsentState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("caerora:consent", { detail: state }));
}
