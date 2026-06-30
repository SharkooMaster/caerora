"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { readConsent } from "@/lib/consent";
import { captureUtm, track } from "@/lib/tracker";

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

let gaLoaded = false;
let pixelLoaded = false;

function loadGA() {
  if (gaLoaded || !GA_ID) return;
  gaLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
}

function loadPixel() {
  if (pixelLoaded || !PIXEL_ID) return;
  pixelLoaded = true;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq!("init", PIXEL_ID);
}

function applyConsent() {
  const c = readConsent();
  if (c.analytics) loadGA();
  if (c.marketing) loadPixel();
}

function Inner() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    captureUtm();
    applyConsent();
    const handler = () => applyConsent();
    window.addEventListener("caerora:consent", handler);
    return () => window.removeEventListener("caerora:consent", handler);
  }, []);

  useEffect(() => {
    // Fire first-party + GA/Meta page_view on every route change.
    track({ event_type: "page_view", path: pathname || "/" });
    const c = readConsent();
    if (c.analytics && window.gtag && GA_ID) {
      window.gtag("event", "page_view", { page_path: pathname });
    }
    if (c.marketing && window.fbq) {
      window.fbq("track", "PageView");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  return null;
}

export function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
