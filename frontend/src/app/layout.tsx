import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { CartFab } from "@/components/CartFab";
import { CookieConsent } from "@/components/CookieConsent";
import { WelcomePopup } from "@/components/WelcomePopup";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { IMAGES } from "@/lib/images";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost";

// Google tag (GA4 + Google Ads) rendered into the initial HTML so Google's
// scanners detect it and consent-denied pings flow from the first paint
// (advanced Consent Mode v2). Consent defaults to denied; CookieConsent +
// AnalyticsProvider update it when the visitor chooses.
const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
// Load gtag.js via the AW- id: the GA4 stream is combined into the Google Ads
// tag (one GT- container serving both destinations), and Google 404s the
// standalone G- script URL for combined tags.
const GTAG_PRIMARY = ADS_ID || GA_ID;
const GTAG_INIT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
gtag('js', new Date());
${GA_ID ? `gtag('config', '${GA_ID}', {send_page_view: false});` : ""}
${ADS_ID ? `gtag('config', '${ADS_ID}');` : ""}
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Caerora | Life in the Spirit",
    template: "%s | Caerora",
  },
  description:
    "Caerora is a Christian clothing brand telling the complete story of the Gospel in thirteen collections \u2014 heavyweight tees and hoodies with embroidered detail and scripture you can wear. Free shipping over \u20ac45 and easy 30-day returns.",
  keywords: ["Caerora", "Christian clothing", "faith apparel", "Christian streetwear", "scripture clothing", "hoodies", "t-shirts"],
  openGraph: {
    title: "Caerora | Life in the Spirit",
    description: "Thirteen collections, one narrative \u2014 Christian clothing crafted to be kept, from the first light to the eternal day.",
    url: siteUrl,
    siteName: "Caerora",
    images: [{ url: IMAGES.og, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Caerora | Life in the Spirit" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const promoText = await api
    .siteContent()
    .then((c) => c.promo_bar_text || undefined)
    .catch(() => undefined);

  // Nav follows the live catalog: only categories that actually have products,
  // plus the thirteen seasons for the "Seasons" dropdown.
  const [nav, seasons] = await Promise.all([
    api
      .categories()
      .then((cats) =>
        cats
          .filter((c) => (c.product_count ?? 1) > 0)
          .slice(0, 4)
          .map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
      )
      .catch(() => []),
    api
      .seasons()
      .then((all) =>
        all.map((s) => ({ name: s.name, numeral: s.numeral, slug: s.slug, subtitle: s.subtitle })),
      )
      .catch(() => []),
  ]);

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <head>
        {GTAG_PRIMARY ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_PRIMARY}`} />
            <script dangerouslySetInnerHTML={{ __html: GTAG_INIT }} />
          </>
        ) : null}
      </head>
      <body className="font-sans">
        <AppShell
          analytics={<AnalyticsProvider />}
          header={<Header promoText={promoText} nav={nav} seasons={seasons} />}
          footer={<Footer nav={nav} />}
          overlays={
            <>
              <CartDrawer />
              <CartFab />
              <CookieConsent />
              <WelcomePopup />
            </>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
