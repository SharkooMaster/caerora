import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-taupe/15 bg-cream">
      <div className="container-page grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 text-xs leading-relaxed text-taupe">
            Modern beauty rooted in elegance, simplicity and confidence. Beauty, elevated.
          </p>
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
      <div className="border-t border-taupe/15 py-6 text-center text-[11px] uppercase tracking-wider text-taupe">
        &copy; {new Date().getFullYear()} Caerora &middot; All rights reserved
      </div>
    </footer>
  );
}
