"use client";
import { useEffect, useState } from "react";
import { adminApi, getStaffToken } from "@/lib/adminApi";
import { apiBase } from "@/lib/api";
import type { AdminCampaign, AdminSubscriber, Paginated } from "@/lib/adminTypes";
import { CampaignBadge, Card, Empty, PageHeader, Spinner } from "@/components/studio/ui";

export default function NewsletterPage() {
  const [tab, setTab] = useState<"campaigns" | "subscribers">("campaigns");
  return (
    <div className="max-w-3xl">
      <PageHeader title="Newsletter" subtitle="Compose broadcasts and manage subscribers." />
      <div className="mb-6 flex gap-2">
        {(["campaigns", "subscribers"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? "bg-espresso text-ivory" : "bg-ivory text-taupe ring-1 ring-taupe/20"}`}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "campaigns" ? <Campaigns /> : <Subscribers />}
    </div>
  );
}

function Campaigns() {
  const [items, setItems] = useState<AdminCampaign[] | null>(null);
  const [editing, setEditing] = useState<AdminCampaign | null>(null);

  function load() {
    adminApi.get<Paginated<AdminCampaign> | AdminCampaign[]>("/campaigns/?page_size=100").then((d) => {
      setItems(Array.isArray(d) ? d : d.results);
    });
  }
  useEffect(load, []);

  async function create() {
    const c = await adminApi.post<AdminCampaign>("/campaigns/", { subject: "Untitled", body_html: "<p>Hello!</p>" });
    load();
    setEditing(c);
  }

  if (editing) return <CampaignEditor campaign={editing} onClose={() => { setEditing(null); load(); }} />;
  if (!items) return <Spinner />;

  return (
    <div>
      <div className="mb-4"><button className="btn-primary" onClick={create}>New campaign</button></div>
      {items.length === 0 ? <Empty>No campaigns yet.</Empty> : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><span className="font-serif text-lg">{c.subject}</span><CampaignBadge status={c.status} /></div>
                  <p className="text-xs text-taupe">
                    {c.status === "sent" ? `Sent to ${c.recipients_count} on ${c.sent_at ? new Date(c.sent_at).toLocaleDateString() : ""}` : `Created ${new Date(c.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button className="btn-outline px-4 py-1.5 text-sm" onClick={() => setEditing(c)}>{c.status === "sent" ? "View" : "Edit"}</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignEditor({ campaign, onClose }: { campaign: AdminCampaign; onClose: () => void }) {
  const [c, setC] = useState(campaign);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const sent = c.status === "sent";

  async function save() {
    setBusy(true); setMsg("");
    try {
      const updated = await adminApi.patch<AdminCampaign>(`/campaigns/${c.id}/`, {
        subject: c.subject, preheader: c.preheader, body_html: c.body_html,
      });
      setC(updated); setMsg("Saved.");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  async function sendTest() {
    const email = prompt("Send a test to which email?");
    if (!email) return;
    await save();
    await adminApi.post(`/campaigns/${c.id}/test/`, { email });
    setMsg(`Test sent to ${email}.`);
  }
  async function send() {
    if (!confirm("Send this campaign to ALL active subscribers?")) return;
    await save();
    await adminApi.post(`/campaigns/${c.id}/send/`);
    setMsg("Sending started.");
    setTimeout(onClose, 800);
  }

  return (
    <Card>
      <button onClick={onClose} className="mb-4 text-sm text-taupe hover:text-espresso">&larr; Back to campaigns</button>
      <div className="grid gap-4">
        <div><label className="label">Subject</label><input className="input" disabled={sent} value={c.subject} onChange={(e) => setC({ ...c, subject: e.target.value })} /></div>
        <div><label className="label">Preheader</label><input className="input" disabled={sent} value={c.preheader} onChange={(e) => setC({ ...c, preheader: e.target.value })} /></div>
        <div>
          <label className="label">Body (HTML)</label>
          <textarea className="input min-h-[220px] font-mono text-xs" disabled={sent} value={c.body_html} onChange={(e) => setC({ ...c, body_html: e.target.value })} />
          <p className="mt-1 text-xs text-taupe">Wrapped automatically in the branded Caerora email shell with an unsubscribe link.</p>
        </div>
        {!sent && (
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" disabled={busy} onClick={save}>Save draft</button>
            <button className="btn-outline" disabled={busy} onClick={sendTest}>Send test</button>
            <button className="btn-rose" disabled={busy} onClick={send}>Send to all</button>
            {msg && <span className="text-sm text-taupe">{msg}</span>}
          </div>
        )}
        {sent && <p className="text-sm text-taupe">This campaign has been sent to {c.recipients_count} subscribers.</p>}
      </div>
      {c.body_html && (
        <div className="mt-6">
          <p className="label">Preview</p>
          <div className="rounded-xl border border-taupe/15 bg-white p-4 text-sm" dangerouslySetInnerHTML={{ __html: c.body_html }} />
        </div>
      )}
    </Card>
  );
}

function Subscribers() {
  const [data, setData] = useState<Paginated<AdminSubscriber> | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams({ page_size: "100" });
    if (search) qs.set("search", search);
    adminApi.get<Paginated<AdminSubscriber>>(`/subscribers/?${qs.toString()}`).then(setData);
  }, [search]);

  function exportCsv() {
    // Trigger a tokenized download via fetch → blob (Authorization header required).
    fetch(`${apiBase()}/admin/subscribers/export/`, { headers: { Authorization: `Bearer ${getStaffToken()}` } })
      .then((r) => r.blob())
      .then((b) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url; a.download = "caerora-subscribers.csv"; a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input className="input max-w-xs" placeholder="Search email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-outline" onClick={exportCsv}>Export CSV</button>
        {data && <span className="text-sm text-taupe">{data.count} subscribers</span>}
      </div>
      {!data ? <Spinner /> : data.results.length === 0 ? <Empty>No subscribers.</Empty> : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-taupe/15 text-left text-xs uppercase tracking-wider text-taupe"><th className="p-4">Email</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Joined</th></tr></thead>
            <tbody>
              {data.results.map((s) => (
                <tr key={s.id} className="border-b border-taupe/10 last:border-0">
                  <td className="p-4">{s.email}</td>
                  <td className="p-4 text-taupe">{s.source || "-"}</td>
                  <td className="p-4">{s.is_active ? "Active" : "Unsubscribed"}</td>
                  <td className="p-4 text-taupe">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
