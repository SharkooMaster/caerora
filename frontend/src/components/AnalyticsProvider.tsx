"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { readConsent } from "@/lib/consent";
import { captureUtm, track } from "@/lib/tracker";

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

let pixelLoaded = false;
let tiktokLoaded = false;

function ensureGtagStub() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

/** Consent Mode v2 signals, sent before/with any Google tag activity. */
function updateGoogleConsent() {
  const c = readConsent();
  ensureGtagStub();
  window.gtag!("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  });
}

// The Google tag itself (gtag.js + config with consent defaulted to denied)
// is rendered in the <head> by the root layout, so scanners see it and
// cookieless pings flow immediately. Here we only update consent signals.

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

function loadTikTok() {
  if (tiktokLoaded || !TIKTOK_ID) return;
  tiktokLoaded = true;
  /* eslint-disable */
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq: any = (w[t] = w[t] || []);
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off",
      "once", "ready", "alias", "group", "enableCookie", "disableCookie",
      "holdConsent", "revokeConsent", "grantConsent",
    ];
    ttq.setAndDefer = function (obj: any, method: string) {
      obj[method] = function () {
        obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id: string) {
      const inst = ttq._i[id] || [];
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(inst, ttq.methods[i]);
      return inst;
    };
    ttq.load = function (id: string, opts?: any) {
      const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = url;
      ttq._t = ttq._t || {};
      ttq._t[id] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[id] = opts || {};
      const script = d.createElement("script") as HTMLScriptElement;
      script.type = "text/javascript";
      script.async = true;
      script.src = url + "?sdkid=" + id + "&lib=" + t;
      const first = d.getElementsByTagName("script")[0];
      first.parentNode!.insertBefore(script, first);
    };
    ttq.load(TIKTOK_ID);
    ttq.page();
  })(window, document, "ttq");
  /* eslint-enable */
}

function applyConsent() {
  const c = readConsent();
  updateGoogleConsent();
  if (c.marketing) {
    loadPixel();
    loadTikTok();
  }
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
    // Fire first-party + GA/Meta/TikTok page_view on every route change.
    track({ event_type: "page_view", path: pathname || "/" });
    const c = readConsent();
    // Always ping Google (Consent Mode makes it cookieless until accepted).
    if (window.gtag && GA_ID) {
      window.gtag("event", "page_view", { page_path: pathname });
    }
    if (c.marketing && window.fbq) {
      window.fbq("track", "PageView");
    }
    if (c.marketing && window.ttq) {
      window.ttq.page();
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
