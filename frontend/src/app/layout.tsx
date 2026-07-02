import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { CartFab } from "@/components/CartFab";
import { CookieConsent } from "@/components/CookieConsent";
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

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">
        <AppShell
          analytics={<AnalyticsProvider />}
          header={<Header promoText={promoText} />}
          footer={<Footer />}
          overlays={
            <>
              <CartDrawer />
              <CartFab />
              <CookieConsent />
            </>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
