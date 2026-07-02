"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { staffAuth } from "@/lib/staffAuth";

export default function StudioLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await staffAuth.login(username, password);
      router.replace("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-ivory p-8 shadow-card">
        <div className="text-center">
          <div className="font-serif text-2xl tracking-[0.25em] text-espresso">CAERORA</div>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-taupe">Studio &middot; Staff sign in</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-terracotta">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
