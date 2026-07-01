import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { InstagramIcon, TikTokIcon, PinterestIcon } from "./icons";

const SOCIALS = [
  { href: "https://instagram.com", label: "Instagram", Icon: InstagramIcon },
  { href: "https://tiktok.com", label: "TikTok", Icon: TikTokIcon },
  { href: "https://pinterest.com", label: "Pinterest", Icon: PinterestIcon },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-taupe/15 bg-cream">
      <div className="container-page grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 text-xs leading-relaxed text-taupe">
            Modern beauty rooted in elegance, simplicity and confidence. Beauty, elevated.
          </p>
          <div className="mt-5 flex gap-3">
            {SOCIALS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full p-2 text-taupe ring-1 ring-taupe/20 transition hover:bg-plum hover:text-ivory hover:ring-plum"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="eyebrow mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-espresso/80">
            <li><Link href="/shop" className="hover:text-rose">All products</Link></li>
            <li><Link href="/shop?category=lips" className="hover:text-rose">Lips</Link></li>
            <li><Link href="/shop?category=face" className="hover:text-rose">Face</Link></li>
            <li><Link href="/shop?category=eyes" className="hover:text-rose">Eyes</Link></li>
            <li><Link href="/shop?category=skin" className="hover:text-rose">Skin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-4">Help</h4>
          <ul className="space-y-2 text-sm text-espresso/80">
            <li><Link href="/about" className="hover:text-rose">Our story</Link></li>
            <li><Link href="/shipping" className="hover:text-rose">Shipping &amp; returns</Link></li>
            <li><Link href="/privacy" className="hover:text-rose">Privacy &amp; cookies</Link></li>
            <li><Link href="/account" className="hover:text-rose">Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-4">Join the list</h4>
          <p className="mb-4 text-sm text-taupe">
            Early access, beauty edits and 10% off your first order.
          </p>
          <NewsletterForm source="footer" />
        </div>
      </div>
      <div className="border-t border-taupe/15">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-[11px] uppercase tracking-wider text-taupe sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Caerora &middot; All rights reserved</span>
          <span className="flex items-center gap-3 tracking-normal">
            <span className="rounded border border-taupe/25 px-2 py-1 text-[10px]">VISA</span>
            <span className="rounded border border-taupe/25 px-2 py-1 text-[10px]">Mastercard</span>
            <span className="rounded border border-taupe/25 px-2 py-1 text-[10px]">Amex</span>
            <span className="rounded border border-taupe/25 px-2 py-1 text-[10px]">Klarna</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
