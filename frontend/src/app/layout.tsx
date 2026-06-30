import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { CookieConsent } from "@/components/CookieConsent";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

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
    "Caerora is a modern beauty brand rooted in elegance, simplicity and confidence. Clean, cruelty-free makeup that feels luxurious and is priced fairly.",
  keywords: ["Caerora", "makeup", "clean beauty", "lipstick", "foundation", "cruelty-free"],
  openGraph: {
    title: "Caerora | Beauty. Elevated.",
    description: "Clean, cruelty-free makeup that feels luxurious and is priced fairly.",
    url: siteUrl,
    siteName: "Caerora",
    images: [{ url: "/brand/hero.png", width: 1024, height: 400 }],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Caerora | Beauty. Elevated." },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">
        <AnalyticsProvider />
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
        <CartDrawer />
        <CookieConsent />
      </body>
    </html>
  );
}
