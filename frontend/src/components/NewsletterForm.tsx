"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { track } from "@/lib/tracker";

export function NewsletterForm({ source = "site" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await api.newsletter(email, source);
      track({ event_type: "newsletter_signup", meta: { source } });
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="text-sm text-plum">Thank you. Check your inbox for 10% off.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="input flex-1"
      />
      <button type="submit" disabled={status === "loading"} className="btn-primary">
        {status === "loading" ? "..." : "Join"}
      </button>
      {status === "error" && <span className="text-xs text-terracotta">Please try again.</span>}
    </form>
  );
}
