"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CONSENT_VERSION,
  ConsentState,
  DEFAULT_CONSENT,
  readConsent,
  writeConsent,
} from "@/lib/consent";
import { api } from "@/lib/api";
import { getAnonId } from "@/lib/tracker";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const c = readConsent();
    if (!c.decided) setVisible(true);
  }, []);

  function persist(state: ConsentState) {
    writeConsent(state);
    api
      .recordConsent({
        kind: "cookie",
        anonymous_id: getAnonId(),
        analytics: state.analytics,
        marketing: state.marketing,
        necessary: true,
        granted: state.analytics || state.marketing,
        policy_version: CONSENT_VERSION,
      })
      .catch(() => {});
    setVisible(false);
  }

  function acceptAll() {
    persist({ ...DEFAULT_CONSENT, analytics: true, marketing: true, decided: true });
  }
  function rejectAll() {
    persist({ ...DEFAULT_CONSENT, analytics: false, marketing: false, decided: true });
  }
  function savePrefs() {
    persist({ necessary: true, analytics, marketing, decided: true, version: CONSENT_VERSION });
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4">
      <div className="container-page card mx-auto max-w-3xl border-taupe/20 p-5 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-espresso/90">
            <p className="font-serif text-lg text-espresso">We value your privacy</p>
            <p className="mt-1 text-xs leading-relaxed text-taupe">
              We use cookies to run the store, understand performance and personalise marketing.
              You can browse freely either way. See our{" "}
              <Link href="/privacy" className="underline hover:text-rose">privacy &amp; cookie policy</Link>.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button onClick={() => setShowPrefs((v) => !v)} className="btn-outline px-5 py-2">
              Preferences
            </button>
            <button onClick={rejectAll} className="btn-outline px-5 py-2">Reject</button>
            <button onClick={acceptAll} className="btn-primary px-5 py-2">Accept all</button>
          </div>
        </div>

        {showPrefs && (
          <div className="mt-5 space-y-3 border-t border-taupe/15 pt-4 text-sm">
            <label className="flex items-center justify-between">
              <span>Necessary <span className="text-taupe">(always on)</span></span>
              <input type="checkbox" checked disabled />
            </label>
            <label className="flex items-center justify-between">
              <span>Analytics <span className="text-taupe">(performance &amp; funnels)</span></span>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between">
              <span>Marketing <span className="text-taupe">(Meta &amp; Google ads)</span></span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            </label>
            <button onClick={savePrefs} className="btn-rose mt-2 px-5 py-2">Save preferences</button>
          </div>
        )}
      </div>
    </div>
  );
}
