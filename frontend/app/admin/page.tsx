"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Trash2, RefreshCw, ChevronDown, ChevronRight, Zap, Users } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreClick   { storeName: string; count: number; }
interface ProductClick { productId: number; productName: string; count: number; }
interface DayClick     { date: string; count: number; }

interface Stats {
  clicksPerStore:    StoreClick[];
  topProducts:       ProductClick[];
  clicksLast7Days:   DayClick[];
  totalClickOuts:    number;
  viewsLast7Days:    DayClick[];
  topViewedProducts: ProductClick[];
  totalViews:        number;
  compareLast7Days:  DayClick[];
  totalCompares:     number;
}

interface RecentSubscriber { email: string; name: string | null; goal: string | null; createdAt: string; }
interface CalcStats {
  total:  number;
  byGoal: Record<string, number>;
  recent: RecentSubscriber[];
}

interface DecisionRule {
  flag:     string;
  severity: "WARNING" | "SUCCESS" | "INFO";
  message:  string;
  action:   string;
}

interface AlertMetrics {
  subscribers: { totalAlerts: number; uniqueEmails: number; withTargetPrice: number; avgAlertsPerUser: number; repeatUsers: number; };
  jobs:        { pending: number; sent: number; failed: number; failureRate: number; };
  email:       { sent: number; opened: number; clicked: number; openRate: number; clickRate: number; clickToOpenRate: number; };
  unsubscribes:{ total: number; last30Days: number; unsubscribeRate: number; };
  insights:    DecisionRule[];
}

interface AlertSubscriber { email: string; productId: number; productName: string; targetPrice: number | null; addedAt: string; }

interface GroupProduct { id: number; name: string; store: string; price: number; weight: number; source: string; }
interface ProductGroup {
  groupId: number;
  canonicalName: string;
  brand: string;
  weightGrams: number;
  storeCount: number;
  products: GroupProduct[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mergeByDate(views: DayClick[], compares: DayClick[], clickouts: DayClick[]) {
  const map = new Map<string, { views: number; compares: number; clickouts: number }>();
  const ensure = (d: string) => { if (!map.has(d)) map.set(d, { views: 0, compares: 0, clickouts: 0 }); return map.get(d)!; };
  views.forEach(({ date, count })    => { ensure(date).views    = count; });
  compares.forEach(({ date, count }) => { ensure(date).compares = count; });
  clickouts.forEach(({ date, count })=> { ensure(date).clickouts = count; });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
}

type ClearMode = "all" | "keepClickOut" | "clicks";
type Tab = "analytics" | "grupe";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("analytics");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Tab navigation */}
      <div className="bg-white border-b border-slate-200 px-6 pt-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-[#1B2B4B] mb-4">Admin Panel</h1>
          <div className="flex gap-1">
            {([
              { id: "analytics", label: "Analytics", icon: <Users className="w-4 h-4" /> },
              { id: "grupe",     label: "Grupe",     icon: <Zap  className="w-4 h-4" /> },
            ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-[#FF9900] text-[#FF9900] bg-orange-50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "grupe"     && <GrupeTab />}
      </div>
    </main>
  );
}

// ── Grupe tab ─────────────────────────────────────────────────────────────────

function GrupeTab() {
  const [groups, setGroups]     = useState<ProductGroup[]>([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGen]    = useState(false);
  const [result, setResult]     = useState<{ groupsCreated: number; clustersTooSmall: number } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups");
      if (res.ok) setGroups(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { loadGroups(); }, []);

  const autoGenerate = async () => {
    setGen(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/groups/auto-generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        await loadGroups();
      }
    } finally { setGen(false); }
  };

  const deleteGroup = async (groupId: number) => {
    setDeleting(groupId);
    try {
      await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" });
      setGroups(g => g.filter(x => x.groupId !== groupId));
    } finally { setDeleting(null); }
  };

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const crossStore = groups.filter(g => g.storeCount >= 2);
  const singleStore = groups.filter(g => g.storeCount < 2);
  const totalGrouped = groups.reduce((sum, g) => sum + g.products.length, 0);

  return (
    <div className="space-y-6">

      {/* Summary + actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upravljanje grupama</h2>
            <p className="text-sm text-slate-400 mt-0.5">Isti protein dostupan u više prodavnica</p>
          </div>
          <button
            onClick={autoGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1B2B4B] hover:bg-[#243860] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generisanje..." : "Pokreni auto-generate"}
          </button>
        </div>

        {result && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
            <span className="font-bold text-green-700">Gotovo!</span>
            <span className="text-green-600 ml-2">
              Kreirano {result.groupsCreated} novih grupa. {result.clustersTooSmall} klastera preskočeno (samo 1 prodavnica).
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Ukupno grupa" value={groups.length} color="#FF9900" />
          <StatBox label="Cross-store" value={crossStore.length} color="#22c55e" />
          <StatBox label="Produkata upareno" value={totalGrouped} color="#3b82f6" />
        </div>
      </div>

      {/* Cross-store groups */}
      {crossStore.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Cross-store grupe ({crossStore.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Isti protein dostupan u 2+ prodavnice — prikazuje se na product page-u</p>
          </div>
          <div className="divide-y divide-slate-100">
            {crossStore.map(g => (
              <GroupRow
                key={g.groupId}
                group={g}
                expanded={expanded.has(g.groupId)}
                onToggle={() => toggle(g.groupId)}
                onDelete={() => deleteGroup(g.groupId)}
                deleting={deleting === g.groupId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Single-store groups */}
      {singleStore.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Samo 1 prodavnica ({singleStore.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Grupisani proizvodi koji postoje samo u jednoj prodavnici</p>
          </div>
          <div className="divide-y divide-slate-100">
            {singleStore.map(g => (
              <GroupRow
                key={g.groupId}
                group={g}
                expanded={expanded.has(g.groupId)}
                onToggle={() => toggle(g.groupId)}
                onDelete={() => deleteGroup(g.groupId)}
                deleting={deleting === g.groupId}
              />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-400 text-sm">Učitavanje...</div>
      )}
      {!loading && groups.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          Nema kreiranih grupa. Klikni "Pokreni auto-generate" da počneš.
        </div>
      )}
    </div>
  );
}

function GroupRow({
  group, expanded, onToggle, onDelete, deleting,
}: {
  group: ProductGroup;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const cheapest = group.products.reduce((min, p) =>
    p.price < min ? p.price : min, Infinity);
  const mostExpensive = group.products.reduce((max, p) =>
    p.price > max ? p.price : max, 0);
  const saving = mostExpensive > cheapest ? Math.round(mostExpensive - cheapest) : 0;

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
        <button onClick={onToggle} className="text-slate-400 shrink-0">
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{group.canonicalName}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-slate-400">{group.brand}</span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {group.weightGrams >= 1000
                ? `${(group.weightGrams / 1000).toFixed(1)} kg`
                : `${group.weightGrams} g`}
            </span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-500">
              {group.products.length} {group.products.length === 1 ? "proizvod" : "proizvoda"}
            </span>
            {group.storeCount >= 2 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                {group.storeCount} prodavnice
              </span>
            )}
            {saving > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                uštedi {saving.toLocaleString("sr-RS")} RSD
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onDelete}
          disabled={deleting}
          className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 disabled:opacity-40 transition-colors"
          title="Obriši grupu"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-6 pb-3 bg-slate-50 border-t border-slate-100">
          <div className="pt-3 space-y-1.5">
            {group.products.map((p, i) => {
              const isCheapest = p.price === cheapest;
              return (
                <div key={p.id} className="flex items-center gap-3 text-xs">
                  <span className="w-5 text-slate-300 font-mono">{i + 1}.</span>
                  <span className={`font-semibold w-24 shrink-0 ${isCheapest ? "text-green-600" : "text-slate-600"}`}>
                    {p.store}
                  </span>
                  <span className={`font-black shrink-0 ${isCheapest ? "text-green-600" : "text-slate-700"}`}>
                    {p.price.toLocaleString("sr-RS")} RSD
                  </span>
                  {isCheapest && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">najjeftinije</span>}
                  <span className="text-slate-400 truncate">{p.name}</span>
                  <span className="text-slate-300 font-mono ml-auto">#{p.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [stats, setStats]                     = useState<Stats | null>(null);
  const [calcStats, setCalcStats]             = useState<CalcStats | null>(null);
  const [alertMetrics, setAlertMetrics]       = useState<AlertMetrics | null>(null);
  const [alertSubscribers, setAlertSubscribers] = useState<AlertSubscriber[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(false);
  const [confirm, setConfirm]                 = useState<ClearMode | null>(null);
  const [clearing, setClearing]               = useState(false);

  const fetchStats = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/stats").then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch("/api/admin/calculator-stats").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/alert-metrics").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/alert-subscribers").then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([analyticsData, calcData, alertData, subscribersData]) => {
        setStats(analyticsData);
        setCalcStats(calcData);
        setAlertMetrics(alertData);
        setAlertSubscribers(Array.isArray(subscribersData) ? subscribersData : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const clearTracking = async (mode: ClearMode) => {
    setClearing(true);
    if (mode === "clicks") {
      await fetch("/api/admin/clicks", { method: "DELETE" });
    } else {
      const qs = mode === "keepClickOut" ? "?keepClickOut=true" : "";
      await fetch(`/api/admin/tracking${qs}`, { method: "DELETE" });
    }
    setConfirm(null);
    setClearing(false);
    fetchStats();
  };

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Učitavanje...</div>;
  if (error || !stats) return <div className="text-center py-16 text-red-400 text-sm">Greška pri učitavanju.</div>;

  const rawConversion = stats.totalViews > 0 ? (stats.totalClickOuts / stats.totalViews) * 100 : null;
  const conversionRate = rawConversion !== null ? (rawConversion > 100 ? "—" : rawConversion.toFixed(1)) : "—";
  const merged = mergeByDate(stats.viewsLast7Days, stats.compareLast7Days, stats.clicksLast7Days);

  return (
    <>
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-black text-slate-900 mb-2">Potvrdi brisanje</h2>
            <p className="text-sm text-slate-500 mb-6">
              {confirm === "all"
                ? "Biće obrisani SVI tracking podaci. Ova akcija je nepovratna."
                : confirm === "clicks"
                  ? "Biće obrisani svi Kupi klikovi. Ova akcija je nepovratna."
                  : "Biće obrisani PRODUCT_VIEW i COMPARE_CLICK podaci. CLICK_OUT se čuva."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Otkaži</button>
              <button onClick={() => clearTracking(confirm)} disabled={clearing} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold transition-colors">
                {clearing ? "Brišem..." : "Obriši"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <p className="text-slate-400 text-sm">Praćenje klikova i konverzija</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setConfirm("clicks")} className="px-4 py-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-semibold transition-colors">Resetuj Kupi</button>
          <button onClick={() => setConfirm("keepClickOut")} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors">Resetuj (zadrži Kupi)</button>
          <button onClick={() => setConfirm("all")} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors">Obriši sve</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pregledi"    value={stats.totalViews}     color="#3b82f6" />
        <StatCard label="Uporedi"     value={stats.totalCompares}  color="#8b5cf6" />
        <StatCard label="Kupi"        value={stats.totalClickOuts} color="#FF9900" />
        <StatCard label="Konverzija"  value={conversionRate}       color="#22c55e" suffix="%" />
      </div>

      <Section title="Aktivnost — poslednjih 7 dana">
        {merged.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={merged}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={30} />
              <Tooltip content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs space-y-1">
                    <p className="text-slate-400 mb-1">{payload[0].payload.date}</p>
                    {payload.map(p => <p key={String(p.dataKey)} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>)}
                  </div>
                ) : null}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="views"     name="Pregledi"  stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="compares"  name="Uporedi"   stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#8b5cf6" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="clickouts" name="Kupi"      stroke="#FF9900" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#FF9900" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Section title="Klikovi Kupi — po prodavnici">
          {stats.clicksPerStore.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.clicksPerStore} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="storeName" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} width={90} />
                <Tooltip cursor={{ fill: "#f8fafc" }} content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
                      <p className="font-bold text-[#FF9900]">{payload[0].value} klikova</p>
                    </div>
                  ) : null}
                />
                <Bar dataKey="count" fill="#FF9900" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
        <Section title="Top 10 — Kupi klikovi">
          <ProductTable rows={stats.topProducts} badgeColor="#FF9900" />
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Section title="Top 10 — Pregledi">
          <ProductTable rows={stats.topViewedProducts} badgeColor="#3b82f6" />
        </Section>
        <Section title="Funnel konverzije">
          <FunnelView views={stats.totalViews} compares={stats.totalCompares} clickouts={stats.totalClickOuts} />
        </Section>
      </div>

      {calcStats && <CalculatorSection stats={calcStats} />}
      {alertMetrics && <AlertSection metrics={alertMetrics} subscribers={alertSubscribers} />}
    </>
  );
}

// ── Shared UI components ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ label, value, color, suffix = "" }: { label: string; value: number | string; color: string; suffix?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black" style={{ color }}>{typeof value === "number" ? value.toLocaleString() : value}{suffix}</p>
    </div>
  );
}

function Empty() {
  return <p className="text-slate-400 text-sm py-6 text-center">Nema podataka</p>;
}

function FunnelView({ views, compares, clickouts }: { views: number; compares: number; clickouts: number }) {
  const steps = [
    { label: "Pregled",  value: views,    color: "#3b82f6" },
    { label: "Uporedi",  value: compares,  color: "#8b5cf6" },
    { label: "Kupi",     value: clickouts, color: "#FF9900" },
  ];
  const max = Math.max(...steps.map(s => s.value), 1);
  return (
    <div className="space-y-4 py-2">
      {steps.map((s, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">{s.label}</span>
            <span className="font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
          </div>
          <div className="h-7 bg-slate-100 rounded-lg overflow-hidden">
            <div className="h-full rounded-lg transition-all duration-700 flex items-center px-2"
              style={{ width: `${Math.max(4, (s.value / max) * 100)}%`, backgroundColor: s.color }}>
              {s.value > 0 && <span className="text-white text-[10px] font-bold whitespace-nowrap">{((s.value / max) * 100).toFixed(0)}%</span>}
            </div>
          </div>
        </div>
      ))}
      {views > 0 && clickouts / views <= 1 && (
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          Konverzija Kupi/Pregled: <span className="font-bold text-[#FF9900]">{((clickouts / views) * 100).toFixed(1)}%</span>
        </p>
      )}
    </div>
  );
}

function ProductTable({ rows, badgeColor }: { rows: { productId: number; productName: string; count: number }[]; badgeColor: string }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">#</th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2">Proizvod</th>
            <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 pl-4">Br.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="py-2.5 pr-4 text-slate-400 font-medium text-xs">{i + 1}</td>
              <td className="py-2.5 text-slate-700 font-medium truncate max-w-[200px]">{p.productName}</td>
              <td className="py-2.5 pl-4 text-right">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
                  style={{ color: badgeColor, backgroundColor: `${badgeColor}15`, borderColor: `${badgeColor}40` }}>
                  {p.count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const GOAL_META: Record<string, { label: string; color: string }> = {
  mass:     { label: "Masa",       color: "#3b82f6" },
  muscle:   { label: "Mišići",     color: "#FF9900" },
  maintain: { label: "Održavanje", color: "#22c55e" },
  fat_loss: { label: "Mršavljenje",color: "#ef4444" },
};

function CalculatorSection({ stats }: { stats: CalcStats }) {
  const goalData = Object.entries(stats.byGoal).map(([goal, count]) => ({
    name: GOAL_META[goal]?.label ?? goal, count, color: GOAL_META[goal]?.color ?? "#94a3b8",
  }));
  return (
    <div className="mt-6">
      <Section title="Protein kalkulator — Subscribers">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ukupno</p>
              <p className="text-4xl font-black text-[#1B2B4B]">{stats.total.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              {goalData.map(({ name, count, color }) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600">{name}</span>
                      <span className="font-black" style={{ color }}>{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2 overflow-x-auto">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Poslednjih 10</p>
            {stats.recent.length === 0 ? <p className="text-sm text-slate-400">Nema subscribera.</p> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Email","Ime","Cilj","Datum"].map(h => (
                      <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((s, i) => {
                    const meta = s.goal ? GOAL_META[s.goal] : null;
                    const date = new Date(s.createdAt).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit", year: "numeric" });
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 pr-4 text-slate-700 font-medium text-xs truncate max-w-[160px]">{s.email}</td>
                        <td className="py-2.5 pr-4 text-slate-500 text-xs">{s.name ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          {meta ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}18` }}>{meta.label}</span>
                            : <span className="text-xs text-slate-400">{s.goal ?? "—"}</span>}
                        </td>
                        <td className="py-2.5 text-xs text-slate-400">{date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

function AlertSection({ metrics, subscribers }: { metrics: AlertMetrics; subscribers: AlertSubscriber[] }) {
  const { subscribers: s, jobs, email, unsubscribes, insights } = metrics;
  const fmt = (n: number) => (n * 100).toFixed(1) + "%";
  return (
    <div className="mt-6">
      <Section title="Price Alerts — Subscribers">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Ukupno alerta",    value: s.totalAlerts,    color: "#FF9900" },
            { label: "Jedinstvenih",     value: s.uniqueEmails,   color: "#3b82f6" },
            { label: "Sa ciljnom cenom", value: s.withTargetPrice,color: "#8b5cf6" },
            { label: "Avg po useru",     value: s.avgAlertsPerUser.toFixed(1), color: "#22c55e" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Email jobs</p>
            <div className="space-y-2">
              {[["Pending", jobs.pending, "#FF9900"], ["Poslato", jobs.sent, "#22c55e"], ["Failed", jobs.failed, "#ef4444"]].map(([l, v, c]) => (
                <div key={String(l)} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{l}</span>
                  <span className="font-bold" style={{ color: String(c) }}>{v as number}</span>
                </div>
              ))}
            </div>
          </div>
          {jobs.sent > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Engagement</p>
              <div className="space-y-2">
                {[["Open rate", fmt(email.openRate)], ["Click rate", fmt(email.clickRate)], ["CTO rate", fmt(email.clickToOpenRate)]].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{l}</span>
                    <span className="font-bold text-[#FF9900]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {insights.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Insights</p>
            <ul className="space-y-2">
              {insights.map((ins, i) => (
                <li key={i} className="text-xs text-amber-800">
                  <span className={`font-black mr-1 ${ins.severity === "WARNING" ? "text-red-600" : ins.severity === "SUCCESS" ? "text-green-600" : "text-amber-700"}`}>
                    {ins.severity === "WARNING" ? "⚠" : ins.severity === "SUCCESS" ? "✓" : "·"}
                  </span>
                  <span className="font-semibold">{ins.message}</span>
                  {ins.action && <span className="block ml-4 text-amber-700 font-normal mt-0.5">{ins.action}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Poslednjih {subscribers.length}</p>
        {subscribers.length === 0 ? <p className="text-sm text-slate-400">Nema subscribera.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Email","Proizvod","Ciljana cena","Datum"].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 text-slate-700 font-medium text-xs truncate max-w-[160px]">{sub.email}</td>
                    <td className="py-2.5 pr-4 text-slate-500 text-xs truncate max-w-[200px]">{sub.productName}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      {sub.targetPrice != null
                        ? <span className="font-bold text-[#FF9900]">{new Intl.NumberFormat("sr-RS").format(Math.round(sub.targetPrice))} RSD</span>
                        : <span className="text-slate-400">Bilo koji pad</span>}
                    </td>
                    <td className="py-2.5 text-xs text-slate-400">
                      {new Date(sub.addedAt).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
