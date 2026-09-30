"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Play, AlertCircle, CheckCircle2 } from "lucide-react";

const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("sr-Latn", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const daysAgo = (iso: string | null | undefined) =>
  iso ? (Date.now() - new Date(iso).getTime()) / 86_400_000 : null;

function Card({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Scrape tab ────────────────────────────────────────────────────────────────

interface StoreStatus {
  storeName: string;
  lastScrapeAt: string | null;
  lastScrapeStatus: "RUNNING" | "SUCCESS" | "FAILED" | "BLOCKED" | string | null;
  lastProductsFound: number | null;
  lastFinishedAt?: string | null;
  lastError?: string | null;
  lastProductsRemoved?: number | null;
  lastTypeCounts?: string | null;
  lastProxyBytes?: number | null;
  lastSuccessAt?: string | null;
  nextScheduledAt?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  RUNNING: "bg-blue-100 text-blue-700",
  FAILED:  "bg-red-100 text-red-700",
  BLOCKED: "bg-amber-100 text-amber-700",
};

export function ScrapeTab() {
  const [rows, setRows]       = useState<StoreStatus[]>([]);
  const [cycleDay, setCycle]  = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [note, setNote]       = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/admin/scrape-status");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.stores ?? []);
      setCycle(data.cycleDay ?? null);
      setError(null);
    } catch {
      setError("Nije uspelo učitavanje statusa scrapera.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const anyRunning = rows.some(r => r.lastScrapeStatus === "RUNNING");
  useEffect(() => {
    if (!anyRunning) return;
    const t = setInterval(() => load(true), 20_000);
    return () => clearInterval(t);
  }, [anyRunning, load]);

  const run = async (store: string, types?: string) => {
    const label = types ? `${store} [${types}]` : store;
    if (!window.confirm(`Pokrenuti scrape: ${label}? Troši proxy saobraćaj i traje nekoliko minuta.`)) return;
    setStarting(label);
    setNote(null);
    try {
      const res = await fetch("/api/admin/scrape-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, types }),
      });
      setNote(res.ok ? `Pokrenuto u pozadini: ${label}.` : `Greška (${res.status}) pri pokretanju ${label}.`);
      if (res.ok) setTimeout(() => load(true), 3000);
    } catch {
      setNote(`Greška u konekciji pri pokretanju ${label}.`);
    } finally {
      setStarting(null);
    }
  };

  const problems = rows.filter(r =>
    r.lastScrapeStatus === "FAILED" || r.lastScrapeStatus === "BLOCKED" || (daysAgo(r.lastSuccessAt) ?? 99) > 8);

  return (
    <div className="space-y-6">
      <Card
        title="Scraperi"
        subtitle={`Status poslednjeg pokretanja po prodavnici${cycleDay != null ? ` · dan ciklusa ${cycleDay}` : ""}`}
        action={
          <button onClick={() => load()} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-bold rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Osveži
          </button>
        }
      >
        {problems.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span><b>{problems.length}</b> prodavnica traži pažnju (neuspeh/blokada ili bez uspešnog scrape-a 8+ dana): {problems.map(p => p.storeName).join(", ")}</span>
          </div>
        )}
        {note && <p className="mb-3 text-xs font-semibold text-slate-600">{note}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading && rows.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">Učitavanje...</p>}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Prodavnica", "Status", "Poslednji run", "Poslednji uspeh", "Proizvoda", "Tipovi", "Proxy", "Sledeći", ""].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const stale = (daysAgo(r.lastSuccessAt) ?? 99) > 8;
                  return (
                    <tr key={r.storeName} className="border-b border-slate-50 hover:bg-slate-50 align-top">
                      <td className="py-2.5 pr-4 font-semibold text-slate-700 whitespace-nowrap">{r.storeName}</td>
                      <td className="py-2.5 pr-4">
                        {r.lastScrapeStatus
                          ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.lastScrapeStatus] ?? "bg-slate-100 text-slate-600"}`}>{r.lastScrapeStatus}</span>
                          : <span className="text-xs text-slate-400">nikad</span>}
                        {r.lastError && <p className="text-[10px] text-red-500 mt-1 max-w-[220px] truncate" title={r.lastError}>{r.lastError}</p>}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(r.lastScrapeAt)}</td>
                      <td className={`py-2.5 pr-4 text-xs whitespace-nowrap ${stale ? "text-red-600 font-bold" : "text-slate-500"}`}>
                        {fmtDateTime(r.lastSuccessAt)}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600 whitespace-nowrap">
                        {r.lastProductsFound ?? "—"}{r.lastProductsRemoved ? <span className="text-slate-400"> (−{r.lastProductsRemoved})</span> : null}
                      </td>
                      <td className="py-2.5 pr-4 text-[11px] font-mono text-slate-500">{r.lastTypeCounts ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 whitespace-nowrap">
                        {r.lastProxyBytes ? `${(r.lastProxyBytes / 1_048_576).toFixed(1)} MB` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400 whitespace-nowrap">{fmtDateTime(r.nextScheduledAt)}</td>
                      <td className="py-2.5 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          <button onClick={() => run(r.storeName)} disabled={starting !== null || r.lastScrapeStatus === "RUNNING"}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#1B2B4B] hover:bg-[#243860] text-white disabled:opacity-40">
                            <Play className="w-3 h-3" /> Sve
                          </button>
                          <button onClick={() => run(r.storeName, "creatine")} disabled={starting !== null || r.lastScrapeStatus === "RUNNING"}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:border-[#FF9900] hover:text-[#FF9900] disabled:opacity-40">
                            Kreatin
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Održavanje tab ────────────────────────────────────────────────────────────

const ACTIONS = [
  { id: "recalculate-scores",        label: "Preračunaj value score",  hint: "Pokreni posle izmene pravila bodovanja ili većeg scrape-a.", confirm: "Preračunati value score za sve proizvode?" },
  { id: "recalculate-price-changes", label: "Preračunaj promene cena", hint: "Popravlja sačuvane padove cena (strana „Pad cena“, newsletter).", confirm: "Preračunati promene cena?" },
  { id: "groups-refresh",            label: "Osveži grupe",            hint: "Preračuna težine grupa i raspušta grupe sa jednim članom.", confirm: "Osvežiti metapodatke grupa? Grupe sa manje od 2 člana se raspuštaju." },
  { id: "groups-auto-generate",      label: "Auto-generiši grupe",     hint: "Prvo dodaje nepovezane proizvode u postojeće grupe, pa pravi nove.", confirm: "Pokrenuti auto-generisanje grupa?" },
];

export function MaintenanceTab() {
  const [busy, setBusy]       = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; text: string; at: string }>>({});

  const run = async (a: typeof ACTIONS[number]) => {
    if (!window.confirm(a.confirm)) return;
    setBusy(a.id);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: a.id }),
      });
      const data = await res.json().catch(() => ({}));
      const text = typeof data?.message === "string" ? data.message : JSON.stringify(data);
      setResults(r => ({ ...r, [a.id]: { ok: res.ok, text: res.ok ? text : `HTTP ${res.status}: ${text}`, at: new Date().toLocaleTimeString("sr-Latn") } }));
    } catch {
      setResults(r => ({ ...r, [a.id]: { ok: false, text: "Greška u konekciji (akcija je možda i dalje aktivna).", at: new Date().toLocaleTimeString("sr-Latn") } }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card title="Održavanje podataka" subtitle="Akcije koje su do sada tražile curl sa admin tokenom. Svaka se upisuje u log.">
      <div className="divide-y divide-slate-100">
        {ACTIONS.map(a => {
          const r = results[a.id];
          return (
            <div key={a.id} className="py-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <p className="text-sm font-bold text-slate-800">{a.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.hint}</p>
                {r && (
                  <p className={`text-xs mt-2 font-mono break-all ${r.ok ? "text-green-700" : "text-red-600"}`}>
                    {r.ok ? <CheckCircle2 className="inline w-3.5 h-3.5 mr-1" /> : <AlertCircle className="inline w-3.5 h-3.5 mr-1" />}
                    [{r.at}] {r.text.slice(0, 400)}
                  </p>
                )}
              </div>
              <button onClick={() => run(a)} disabled={busy !== null}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B2B4B] hover:bg-[#243860] disabled:opacity-50 text-white text-sm font-bold rounded-xl">
                <RefreshCw className={`w-4 h-4 ${busy === a.id ? "animate-spin" : ""}`} />
                {busy === a.id ? "Radi..." : "Pokreni"}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Log tab ───────────────────────────────────────────────────────────────────

interface AuditRow { id: number; action: string; detail: string | null; ip: string | null; createdAt: string; }

export function AuditTab() {
  const [rows, setRows]       = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/audit");
      if (!res.ok) throw new Error();
      setRows(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card
      title="Log admin akcija"
      subtitle="Poslednjih 100: prijave, brisanja, slanja i održavanje"
      action={
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-bold rounded-xl">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Osveži
        </button>
      }
    >
      {error && <p className="text-sm text-red-500">Nije uspelo učitavanje loga.</p>}
      {!error && !loading && rows.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Nema zapisa.</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100">
                {["Vreme", "Akcija", "Detalj", "IP"].map(h => (
                  <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      /FAILED|CLEARED|DELETED|REJECTED/.test(r.action) ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs text-slate-600 break-all">{r.detail ?? "—"}</td>
                  <td className="py-2 text-[11px] font-mono text-slate-400">{r.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
