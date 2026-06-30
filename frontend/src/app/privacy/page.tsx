import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & cookies",
  description: "How Caerora handles your data and cookies, in line with GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <p className="eyebrow">Legal</p>
      <h1 className="heading-serif mt-2 text-4xl">Privacy &amp; cookies</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-taupe">
        <p>
          We respect your privacy. This page explains what data we collect, why, and the choices you
          have - in line with the EU General Data Protection Regulation (GDPR).
        </p>
        <div>
          <h2 className="font-serif text-xl text-espresso">Data we collect</h2>
          <p className="mt-2">
            To fulfil your order we collect your name, email, delivery address and payment
            confirmation. Payments are processed securely by Stripe; we never store card details.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-espresso">Cookies &amp; analytics</h2>
          <p className="mt-2">
            Necessary cookies keep the store working. With your consent, we use analytics cookies to
            understand performance and marketing cookies (Meta, Google) to measure and improve our
            advertising. You can browse the entire store without accepting optional cookies, and you
            can change your choice at any time via the cookie banner.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-espresso">Marketing emails</h2>
          <p className="mt-2">
            We only send marketing emails if you opt in. Every email includes an unsubscribe link.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-espresso">Your rights</h2>
          <p className="mt-2">
            You can request access to, correction of, or deletion of your personal data at any time
            by contacting us. We keep a record of consent decisions to honour your preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
