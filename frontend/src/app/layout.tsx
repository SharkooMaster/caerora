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
    default: "Caerora | Beauty. Elevated.",
    template: "%s | Caerora",
  },
  description:
    "Caerora is clean, high-performance makeup and skincare, designed to feel like you. Shop lips, face, eyes and skin \u2014 with free shipping and easy 30-day returns.",
  keywords: ["Caerora", "makeup", "clean beauty", "cosmetics", "skincare", "lipstick", "foundation"],
  openGraph: {
    title: "Caerora | Beauty. Elevated.",
    description: "Clean, high-performance makeup and skincare, designed to feel like you.",
    url: siteUrl,
    siteName: "Caerora",
    images: [{ url: IMAGES.og, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Caerora | Beauty. Elevated." },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const promoText = await api
    .siteContent()
    .then((c) => c.promo_bar_text || undefined)
    .catch(() => undefined);

  // Nav follows the live catalog: only categories that actually have products.
  const [nav, brands] = await Promise.all([
    api
      .categories()
      .then((cats) =>
        cats
          .filter((c) => (c.product_count ?? 1) > 0)
          .slice(0, 5)
          .map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
      )
      .catch(() => []),
    api.brands().catch(() => []),
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
          header={<Header promoText={promoText} nav={nav} brands={brands} />}
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
