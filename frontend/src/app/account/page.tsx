"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, clearToken, getToken } from "@/lib/auth";
import type { Order } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({ username: "", email: "", password: "", first_name: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAccount() {
    try {
      const me = await auth.me();
      setUser(me);
      setOrders(await auth.orders());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getToken()) loadAccount();
    else setLoading(false);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") await auth.login(form.username, form.password);
      else await auth.register(form);
      await loadAccount();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    setOrders([]);
  }

  if (loading) return <div className="container-page py-20 text-center text-taupe">Loading...</div>;

  if (user) {
    return (
      <div className="container-page max-w-3xl py-12">
        <div className="flex items-center justify-between">
          <h1 className="heading-serif text-4xl">Hi, {user.first_name || user.username}</h1>
          <button onClick={logout} className="text-xs uppercase tracking-wider text-taupe hover:text-espresso">
            Sign out
          </button>
        </div>
        <h2 className="eyebrow mt-10 mb-4">Your orders</h2>
        {orders.length ? (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.number} className="card flex items-center justify-between p-5 text-sm">
                <div>
                  <Link href={`/order/${o.number}`} className="font-medium text-espresso hover:text-rose">{o.number}</Link>
                  <p className="text-taupe">{new Date(o.created_at).toLocaleDateString()} &middot; {o.fulfillment_status}</p>
                </div>
                <span>{formatMoney(o.total, o.currency)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-taupe">No orders yet. <Link href="/shop" className="underline">Start shopping</Link>.</p>
        )}
      </div>
    );
  }

  return (
    <div className="container-page max-w-md py-16">
      <div className="mb-8 text-center">
        <p className="eyebrow">Account</p>
        <h1 className="heading-serif mt-2 text-4xl">{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="mt-2 text-sm text-taupe">Checkout as a guest is always available - an account just makes reordering easier.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" placeholder="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        {mode === "register" && (
          <>
            <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </>
        )}
        <input className="input" type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button type="submit" className="btn-primary w-full">{mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 w-full text-center text-xs uppercase tracking-wider text-taupe hover:text-espresso"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
