"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Trash2, RefreshCw, ChevronDown, ChevronRight, Zap, Users, Star, Check, Globe, AlertCircle, CheckCircle2, Clock, FileText, Download } from "lucide-react";

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

interface RecentSubscriber { email: string; name: string | null; goal: string | null; market: string | null; createdAt: string; }
interface CalcStats {
  total:    number;
  byGoal:   Record<string, number>;
  byMarket: Record<string, number>;
  recent:   RecentSubscriber[];
}

interface RecentNewsletterSubscriber { email: string; source: string | null; market: string | null; createdAt: string; }
interface NewsletterStats {
  total:    number;
  bySource: Record<string, number>;
  byMarket: Record<string, number>;
  recent:   RecentNewsletterSubscriber[];
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
type Tab = "analytics" | "grupe" | "recenzije" | "domeni" | "izvestaji" | "kvalitet";
type Market = "sve" | "rs" | "hr";

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
              { id: "analytics",  label: "Analytics",  icon: <Users  className="w-4 h-4" /> },
              { id: "domeni",     label: "Domeni",     icon: <Globe  className="w-4 h-4" /> },
              { id: "grupe",      label: "Grupe",      icon: <Zap    className="w-4 h-4" /> },
              { id: "recenzije",  label: "Recenzije",  icon: <Star   className="w-4 h-4" /> },
              { id: "izvestaji",  label: "Izveštaji",  icon: <FileText className="w-4 h-4" /> },
              { id: "kvalitet",   label: "Kvalitet",   icon: <CheckCircle2 className="w-4 h-4" /> },
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
        {tab === "analytics"  && <AnalyticsTab />}
        {tab === "domeni"     && <DomeniTab />}
        {tab === "grupe"      && <GrupeTab />}
        {tab === "recenzije"  && <RecenzijeTab />}
        {tab === "izvestaji"  && <IzvestajiTab />}
        {tab === "kvalitet"   && <KvalitetTab />}
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

// ── Recenzije tab ─────────────────────────────────────────────────────────────

interface PendingReview { id: number; productId: number; displayName: string; email: string; rating: number; comment: string; createdAt: string; }

function RecenzijeTab() {
  const [reviews, setReviews]   = useState<PendingReview[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) setReviews(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    setActing(id);
    await fetch(`/api/admin/reviews/${id}`, { method: "PUT" });
    setReviews(r => r.filter(x => x.id !== id));
    setActing(null);
  };

  const reject = async (id: number) => {
    setActing(id);
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setReviews(r => r.filter(x => x.id !== id));
    setActing(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recenzije na čekanju</h2>
            <p className="text-sm text-slate-400 mt-0.5">Odobri ili odbij pre objavljivanja</p>
          </div>
          <span className="text-2xl font-black text-[#FF9900]">{reviews.length}</span>
        </div>
      </div>

      {loading && <div className="text-center py-12 text-slate-400 text-sm">Učitavanje...</div>}

      {!loading && reviews.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">Nema recenzija na čekanju.</div>
      )}

      {reviews.map(r => (
        <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-bold text-slate-800">{r.displayName || "Anonimno"}</span>
                {r.email && <span className="text-xs text-slate-400">{r.email}</span>}
                <span className="text-[10px] text-slate-400 ml-auto">
                  {new Date(r.createdAt).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className="w-4 h-4" viewBox="0 0 20 20" fill={s <= r.rating ? "#FF9900" : "#e2e8f0"}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {r.comment && <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
              <p className="text-[10px] text-slate-400 mt-2">Product ID: #{r.productId}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => approve(r.id)}
                disabled={acting === r.id}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Odobri
              </button>
              <button
                onClick={() => reject(r.id)}
                disabled={acting === r.id}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Odbij
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Izveštaji tab ────────────────────────────────────────────────────────────

interface StoreOption { name: string; market: string; }

interface Engagement { productViews: number; buyClicks: number; compareClicks: number; }
interface PricePositionSummary { groupedProductCount: number; cheapestCount: number; avgPctAboveCheapest: number; }
interface ProductPricePosition {
  productId: number; productName: string; yourPrice: number; cheapestPrice: number;
  cheapestStore: string; yourRank: number; totalStoresInGroup: number; pctAboveCheapest: number;
}
interface PriceVelocity { productId: number; productName: string; changeCount: number; }
interface RatingSummary { avgRating: number | null; reviewCount: number; }
interface BrandScore { brand: string; score: number; tier: string; }
interface SearchTerm { term: string; count: number; }
interface LostClickDetail { productName: string; competitorStore: string; count: number; }
interface LostClicksEstimate { estimatedCount: number; byCompetitor: LostClickDetail[]; }

interface StoreReport {
  storeName: string;
  market: string;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  engagement: Engagement;
  pricePositionSummary: PricePositionSummary;
  pricePositions: ProductPricePosition[];
  priceVelocity: PriceVelocity[];
  ratingSummary: RatingSummary;
  brandScores: BrandScore[];
  topSearchTerms: SearchTerm[];
  missedOpportunityBrands: string[];
  lostClicksEstimate: LostClicksEstimate;
}

function IzvestajiTab() {
  const [stores, setStores]           = useState<StoreOption[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [days, setDays]               = useState(30);
  const [report, setReport]           = useState<StoreReport | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError]     = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingStores(true);
      try {
        const res = await fetch("/api/admin/store-report");
        if (res.ok) {
          const data: StoreOption[] = await res.json();
          setStores(data);
          if (data.length > 0) setSelectedStore(data[0].name);
        }
      } finally {
        setLoadingStores(false);
      }
    })();
  }, []);

  const loadPreview = async () => {
    if (!selectedStore) return;
    setLoadingPreview(true);
    setPreviewError(null);
    setReport(null);
    try {
      const res = await fetch(`/api/admin/store-report/${encodeURIComponent(selectedStore)}?days=${days}`);
      if (!res.ok) throw new Error();
      setReport(await res.json());
    } catch {
      setPreviewError("Nije uspelo učitavanje izveštaja.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const downloadPdf = async () => {
    if (!selectedStore) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/store-report/${encodeURIComponent(selectedStore)}/pdf?days=${days}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proteinoteka-izvestaj-${selectedStore.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setPreviewError("Nije uspelo generisanje PDF-a.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Izveštaj za prodavnicu</h2>
        <p className="text-sm text-slate-400 mt-0.5 mb-4">
          Poseban PDF izveštaj (cenovna pozicija, izgubljeni klikovi, potražnja, ocene) — jedinstven za svaku prodavnicu.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Prodavnica</label>
            <select
              value={selectedStore}
              onChange={e => { setSelectedStore(e.target.value); setReport(null); }}
              disabled={loadingStores || stores.length === 0}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white min-w-[220px]"
            >
              {stores.map(s => (
                <option key={s.name} value={s.name}>{s.name} ({s.market.toUpperCase()})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Period (dana)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={e => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 30)))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl w-24"
            />
          </div>
          <button
            onClick={loadPreview}
            disabled={!selectedStore || loadingPreview}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-bold rounded-xl transition-colors"
          >
            {loadingPreview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Prikaži pregled
          </button>
          <button
            onClick={downloadPdf}
            disabled={!selectedStore || downloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Preuzmi PDF
          </button>
        </div>

        {previewError && <p className="text-sm text-red-600 mt-3">{previewError}</p>}
      </div>

      {report && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {report.storeName} <span className="text-slate-400 font-normal">— {report.periodStart} do {report.periodEnd}</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900">{report.engagement.productViews}</div>
              <div className="text-xs text-slate-400 mt-1">pregleda proizvoda</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900">{report.engagement.buyClicks}</div>
              <div className="text-xs text-slate-400 mt-1">klikova &quot;kupi&quot;</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900">~{report.lostClicksEstimate.estimatedCount}</div>
              <div className="text-xs text-slate-400 mt-1">procenjeno izgubljenih klikova</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2">Cenovna pozicija</h4>
            <p className="text-sm text-slate-600">
              Od <b>{report.pricePositionSummary.groupedProductCount}</b> proizvoda sa konkurencijom, najjeftiniji si na{" "}
              <b>{report.pricePositionSummary.cheapestCount}</b>. Prosečno <b>{report.pricePositionSummary.avgPctAboveCheapest.toFixed(1)}%</b> iznad najniže cene.
            </p>
          </div>

          {report.ratingSummary.avgRating != null && (
            <p className="text-sm text-slate-600">
              Prosečna ocena: <b>{report.ratingSummary.avgRating.toFixed(2)}</b> ({report.ratingSummary.reviewCount} recenzija)
            </p>
          )}

          {report.missedOpportunityBrands.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2">Traženi brendovi koje ne prodaješ</h4>
              <div className="flex flex-wrap gap-2">
                {report.missedOpportunityBrands.map(b => (
                  <span key={b} className="px-2.5 py-1 bg-orange-50 text-[#FF9900] text-xs font-semibold rounded-lg border border-orange-200">{b}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            Ovo je skraćen pregled — kompletan izveštaj (svi proizvodi, sve konkurencijske pozicije) je u PDF-u.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [stats, setStats]                     = useState<Stats | null>(null);
  const [calcStats, setCalcStats]             = useState<CalcStats | null>(null);
  const [newsletterStats, setNewsletterStats] = useState<NewsletterStats | null>(null);
  const [alertMetrics, setAlertMetrics]       = useState<AlertMetrics | null>(null);
  const [alertSubscribers, setAlertSubscribers] = useState<AlertSubscriber[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(false);
  const [confirm, setConfirm]                 = useState<ClearMode | null>(null);
  const [clearing, setClearing]               = useState(false);
  const [market, setMarket]                   = useState<Market>("sve");

  const fetchStats = (m: Market = market) => {
    setLoading(true);
    const qs = m !== "sve" ? `?market=${m}` : "";
    Promise.all([
      fetch(`/api/admin/stats${qs}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch("/api/admin/calculator-stats").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/alert-metrics").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/alert-subscribers").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/newsletter-stats").then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([analyticsData, calcData, alertData, subscribersData, newsletterData]) => {
        setStats(analyticsData);
        setCalcStats(calcData);
        setAlertMetrics(alertData);
        setAlertSubscribers(Array.isArray(subscribersData) ? subscribersData : []);
        setNewsletterStats(newsletterData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats("sve"); }, []);

  const handleMarketChange = (m: Market) => {
    setMarket(m);
    setError(false);
    fetchStats(m);
  };

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
        <div className="flex items-center gap-3">
          <p className="text-slate-400 text-sm">Praćenje klikova i konverzija</p>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["sve", "rs", "hr"] as Market[]).map(m => (
              <button
                key={m}
                onClick={() => handleMarketChange(m)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  market === m
                    ? m === "rs" ? "bg-[#1B2B4B] text-white"
                    : m === "hr" ? "bg-red-600 text-white"
                    : "bg-white text-slate-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "sve" ? "Sve" : m === "rs" ? ".rs" : ".hr"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setConfirm("clicks")} className="px-4 py-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-semibold transition-colors">Resetuj Kupi</button>
          <button onClick={() => setConfirm("keepClickOut")} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors">Resetuj (zadrži Kupi)</button>
          <button onClick={() => setConfirm("all")} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors">Obriši sve</button>
        </div>
      </div>

      {market !== "sve" && (
        <div className={`mb-4 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          market === "rs" ? "bg-[#1B2B4B]/10 text-[#1B2B4B]" : "bg-red-50 text-red-700"
        }`}>
          <Globe className="w-3.5 h-3.5" />
          Prikazujem podatke samo za <span className="font-black">{market === "rs" ? "proteinoteka.rs" : "proteinoteka.com.hr"}</span>
        </div>
      )}

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
      {newsletterStats && <NewsletterSection stats={newsletterStats} />}
      <NewsletterCampaignSection />
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
              <div className="flex gap-2 mt-1">
                {Object.entries(stats.byMarket).map(([market, count]) => (
                  <span key={market} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {market}: {count}
                  </span>
                ))}
              </div>
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
                    {["Email","Ime","Cilj","Market","Datum"].map(h => (
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
                        <td className="py-2.5 pr-4 text-[10px] font-bold text-slate-500 uppercase">{s.market ?? "rs"}</td>
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

const SOURCE_META: Record<string, { label: string; color: string }> = {
  footer:            { label: "Footer",       color: "#94a3b8" },
  modal_scroll:      { label: "Modal (scroll)", color: "#3b82f6" },
  modal_exit_intent: { label: "Modal (exit)",  color: "#8b5cf6" },
  inline_banner:     { label: "Inline traka",  color: "#FF9900" },
  alert_crosssell:   { label: "Alert cross-sell", color: "#22c55e" },
  landing_page:      { label: "Landing stranica", color: "#ef4444" },
  kontakt_page:      { label: "Kontakt stranica", color: "#06b6d4" },
};

function NewsletterSection({ stats }: { stats: NewsletterStats }) {
  const sourceData = Object.entries(stats.bySource).map(([source, count]) => ({
    name: SOURCE_META[source]?.label ?? source, count, color: SOURCE_META[source]?.color ?? "#94a3b8",
  }));
  return (
    <div className="mt-6">
      <Section title="Newsletter — Subscribers">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ukupno</p>
              <p className="text-4xl font-black text-[#1B2B4B]">{stats.total.toLocaleString()}</p>
              <div className="flex gap-2 mt-1">
                {Object.entries(stats.byMarket).map(([market, count]) => (
                  <span key={market} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {market}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {sourceData.map(({ name, count, color }) => {
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
                    {["Email","Izvor","Market","Datum"].map(h => (
                      <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((s, i) => {
                    const meta = s.source ? SOURCE_META[s.source] : null;
                    const date = new Date(s.createdAt).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit", year: "numeric" });
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 pr-4 text-slate-700 font-medium text-xs truncate max-w-[160px]">{s.email}</td>
                        <td className="py-2.5 pr-4">
                          {meta ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}18` }}>{meta.label}</span>
                            : <span className="text-xs text-slate-400">{s.source ?? "—"}</span>}
                        </td>
                        <td className="py-2.5 pr-4 text-[10px] font-bold text-slate-500 uppercase">{s.market ?? "rs"}</td>
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

interface CampaignPick {
  id: number;
  name: string;
  storeName: string;
  numericPrice: number;
  previousPrice: number | null;
  currency: string;
}
interface CampaignPreview {
  market: string;
  picks: CampaignPick[];
  recipientCount: number;
  lastCampaign: { sentCount: number; sentAt: string } | null;
  html: string;
}

function NewsletterCampaignSection() {
  const [market, setMarket] = useState<"rs" | "hr">("rs");
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const loadPreview = (m: "rs" | "hr") => {
    setLoading(true);
    setResult(null);
    setPreview(null);
    fetch(`/api/admin/newsletter/campaign?market=${m}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPreview)
      .catch(() => setResult("Greška pri učitavanju pregleda."))
      .finally(() => setLoading(false));
  };

  const handleSend = () => {
    if (!preview) return;
    const confirmed = window.confirm(
      `Poslati newsletter kampanju na ${preview.recipientCount} aktivnih pretplatnika (${market.toUpperCase()})? Ova akcija se ne može poništiti.`,
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);
    fetch("/api/admin/newsletter/campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market }),
    })
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        setResult(ok ? `Poslato ${data.sentCount} email-ova.` : `Greška: ${data.error ?? "nepoznata"}`);
        if (ok) loadPreview(market);
      })
      .catch(() => setResult("Greška pri slanju kampanje."))
      .finally(() => setSending(false));
  };

  return (
    <div className="mt-6">
      <Section title="Newsletter — Kampanja (2x mesečno)">
        <div className="flex items-center gap-2 mb-5">
          {(["rs", "hr"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMarket(m); loadPreview(m); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-colors ${
                market === m ? "bg-[#1B2B4B] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => loadPreview(market)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors disabled:opacity-50"
          >
            {loading ? "Učitavanje..." : "Prikaži pregled"}
          </button>
        </div>

        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Primalaca</p>
                <p className="text-2xl font-black text-[#1B2B4B]">{preview.recipientCount}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Proizvoda u digestu</p>
                <p className="text-2xl font-black text-[#1B2B4B]">{preview.picks.length}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Poslednja kampanja</p>
                <p className="text-sm font-bold text-slate-700">
                  {preview.lastCampaign
                    ? `${new Date(preview.lastCampaign.sentAt).toLocaleDateString("sr-Latn")} (${preview.lastCampaign.sentCount})`
                    : "Nikad"}
                </p>
              </div>
            </div>

            {preview.picks.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Nema proizvoda sa padom cene trenutno — kampanja se ne može poslati.</p>
            )}
            {preview.recipientCount === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Nema aktivnih pretplatnika za ovo tržište.</p>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Proizvod","Prodavnica","Cena","Pre"].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.picks.map(p => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4 text-slate-700 font-medium text-xs truncate max-w-[200px]">{p.name}</td>
                    <td className="py-2 pr-4 text-slate-500 text-xs">{p.storeName}</td>
                    <td className="py-2 pr-4 text-xs font-bold text-[#FF9900]">{Math.round(p.numericPrice)} {p.currency}</td>
                    <td className="py-2 text-xs text-slate-400">{p.previousPrice ? `${Math.round(p.previousPrice)} ${p.currency}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHtml(v => !v)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
              >
                {showHtml ? "Sakrij HTML pregled" : "Prikaži HTML pregled"}
              </button>
              <button
                onClick={handleSend}
                disabled={sending || preview.picks.length === 0 || preview.recipientCount === 0}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-50 text-[#131921] transition-colors"
              >
                {sending ? "Slanje..." : `Pošalji ${preview.recipientCount} primalaca`}
              </button>
              {result && <span className="text-xs font-semibold text-slate-600">{result}</span>}
            </div>

            {showHtml && (
              <iframe
                title="Newsletter preview"
                srcDoc={preview.html}
                className="w-full h-[500px] border border-slate-200 rounded-xl"
              />
            )}
          </div>
        )}
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

// ── Domeni tab ─────────────────────────────────────────────────────────────────

interface PageResult { path: string; status: number | null; ok: boolean; ms: number; }
interface DomainResult { domain: string; market: string; reachable: boolean; responseMs: number | null; pages: PageResult[]; }
interface HealthData { rs: DomainResult; hr: DomainResult; checkedAt: string; }

function DomeniTab() {
  const [data, setData]       = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const check = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/domain-health");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Health check — oba domena</h2>
            <p className="text-sm text-slate-400 mt-0.5">Proverava da li ključne stranice ispravno odgovaraju</p>
          </div>
          <button
            onClick={check}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1B2B4B] hover:bg-[#243860] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Proveravam..." : "Proveri ponovo"}
          </button>
        </div>
        {data && (
          <p className="text-[10px] text-slate-400 mt-3">
            Poslednja provera: {new Date(data.checkedAt).toLocaleTimeString("sr-Latn")}
          </p>
        )}
      </div>

      {loading && !data && (
        <div className="text-center py-16 text-slate-400 text-sm">Proveravam domene...</div>
      )}
      {error && (
        <div className="text-center py-16 text-red-400 text-sm">Greška pri health checku.</div>
      )}

      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          <DomainCard result={data.rs} flagEmoji="🇷🇸" />
          <DomainCard result={data.hr} flagEmoji="🇭🇷" />
        </div>
      )}
    </div>
  );
}

function DomainCard({ result, flagEmoji }: { result: DomainResult; flagEmoji: string }) {
  const allOk = result.reachable && result.pages.every(p => p.ok);
  const hasIssues = !result.reachable || result.pages.some(p => !p.ok);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      allOk ? "border-green-200" : hasIssues ? "border-red-200" : "border-slate-200"
    }`}>
      <div className={`px-6 py-4 flex items-center justify-between ${
        allOk ? "bg-green-50" : hasIssues ? "bg-red-50" : "bg-slate-50"
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{flagEmoji}</span>
          <div>
            <p className="text-sm font-bold text-slate-800">{result.domain}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {result.reachable
                ? `Dostupan · ${result.responseMs}ms`
                : "Nedostupan"}
            </p>
          </div>
        </div>
        {allOk
          ? <CheckCircle2 className="w-5 h-5 text-green-600" />
          : <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>

      <div className="divide-y divide-slate-100">
        {result.pages.map((p) => (
          <div key={p.path} className="px-6 py-3 flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full shrink-0 ${p.ok ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs font-mono text-slate-600 flex-1 truncate">{p.path}</span>
            <div className="flex items-center gap-2 shrink-0">
              {p.status != null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  p.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {p.status}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />{p.ms}ms
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Kvalitet tab ───────────────────────────────────────────────────────────────

interface DataQualityReportData {
  market: string;
  totalProducts: number;
  withProteinPer100g: number; withoutProteinPer100g: number; proteinCoveragePercent: number;
  withSugarPer100g: number; withoutSugarPer100g: number; sugarCoveragePercent: number;
  withFatPer100g: number; withoutFatPer100g: number; fatCoveragePercent: number;
  withCaloriePer100g: number; withoutCaloriePer100g: number; calorieCoveragePercent: number;
  withProteinSource: number; withoutProteinSource: number; proteinSourceCoveragePercent: number;
  withPrimaryWeightGrams: number; withoutPrimaryWeightGrams: number; primaryWeightCoveragePercent: number;
  withValueScore: number; withoutValueScore: number; valueScoreCoveragePercent: number;
  withImage: number; withoutImage: number; imageCoveragePercent: number;
  zeroPriceEntries: number; nullNumericPriceEntries: number; suspiciouslyHighPriceEntries: number;
  validPriceEntries: number; priceStringNullOrEmpty: number;
  withoutStoreEntries: number; duplicateGroups: number;
  summary: string; warnings: string[];
}
interface DataQualityResponse { report: DataQualityReportData; outliers: string[]; }

const OUTLIER_TYPE_LABELS: Record<string, string> = {
  PROTEIN_TOO_HIGH: "Protein previsok",
  PROTEIN_TOO_LOW: "Protein prenizak",
  CALORIE_IMPOSSIBLE: "Kalorije nemoguće",
  CALORIE_TOO_HIGH: "Kalorije previsoke",
  FAT_TOO_HIGH: "Masti previsoke",
  SUGAR_TOO_HIGH: "Šećer previsok",
  WEIGHT_IMPLAUSIBLE: "Težina nerealna",
  STALE_PRODUCT: "Zastareo proizvod",
};

function coverageColor(pct: number): string {
  return pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
}

function KvalitetTab() {
  const [data, setData]       = useState<DataQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [market, setMarket]   = useState<Market>("sve");
  const [showAllOutliers, setShowAllOutliers] = useState(false);

  const load = (m: Market) => {
    setLoading(true);
    setError(false);
    const qs = m !== "sve" ? `?market=${m}` : "";
    fetch(`/api/admin/data-quality${qs}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load("sve"); }, []);

  const handleMarketChange = (m: Market) => {
    setMarket(m);
    setShowAllOutliers(false);
    load(m);
  };

  if (loading && !data) return <div className="text-center py-16 text-slate-400 text-sm">Učitavanje...</div>;
  if (error || !data) return <div className="text-center py-16 text-red-400 text-sm">Greška pri učitavanju.</div>;

  const { report, outliers } = data;

  const coverageRows = [
    { label: "Protein",          pct: report.proteinCoveragePercent,       with: report.withProteinPer100g,       without: report.withoutProteinPer100g },
    { label: "Šećer",            pct: report.sugarCoveragePercent,         with: report.withSugarPer100g,         without: report.withoutSugarPer100g },
    { label: "Masti",            pct: report.fatCoveragePercent,           with: report.withFatPer100g,           without: report.withoutFatPer100g },
    { label: "Kalorije",         pct: report.calorieCoveragePercent,       with: report.withCaloriePer100g,       without: report.withoutCaloriePer100g },
    { label: "Tip proteina",     pct: report.proteinSourceCoveragePercent, with: report.withProteinSource,        without: report.withoutProteinSource },
    { label: "Težina pakovanja", pct: report.primaryWeightCoveragePercent, with: report.withPrimaryWeightGrams,   without: report.withoutPrimaryWeightGrams },
    { label: "Value Score",      pct: report.valueScoreCoveragePercent,    with: report.withValueScore,           without: report.withoutValueScore },
    { label: "Slika",            pct: report.imageCoveragePercent,         with: report.withImage,                without: report.withoutImage },
  ];

  const visibleOutliers = showAllOutliers ? outliers : outliers.slice(0, 15);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-slate-900">Kvalitet podataka</h2>
            <p className="text-sm text-slate-400 mt-0.5">Pokrivenost nutritivnih podataka i sumnjive vrednosti</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {(["sve", "rs", "hr"] as Market[]).map(m => (
                <button
                  key={m}
                  onClick={() => handleMarketChange(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    market === m
                      ? m === "rs" ? "bg-[#1B2B4B] text-white"
                      : m === "hr" ? "bg-red-600 text-white"
                      : "bg-white text-slate-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m === "sve" ? "Sve" : m === "rs" ? ".rs" : ".hr"}
                </button>
              ))}
            </div>
            <button
              onClick={() => load(market)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Osveži
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-3">{report.summary}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Ukupno proizvoda" value={report.totalProducts} color="#1B2B4B" />
        <StatBox label="Duplikat grupe" value={report.duplicateGroups} color={report.duplicateGroups > 5 ? "#ef4444" : "#22c55e"} />
        <StatBox label="Bez prodavnice" value={report.withoutStoreEntries} color={report.withoutStoreEntries > 0 ? "#ef4444" : "#22c55e"} />
        <StatBox label="Sumnjivo skupo (>100k)" value={report.suspiciouslyHighPriceEntries} color={report.suspiciouslyHighPriceEntries > 0 ? "#f59e0b" : "#22c55e"} />
      </div>

      <Section title="Pokrivenost podataka">
        <div className="space-y-3">
          {coverageRows.map(row => (
            <div key={row.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-600">{row.label}</span>
                <span className="font-bold" style={{ color: coverageColor(row.pct) }}>
                  {row.pct.toFixed(1)}% <span className="text-slate-400 font-normal">({row.with}/{row.with + row.without})</span>
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${row.pct}%`, backgroundColor: coverageColor(row.pct) }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Cene">
          <div className="space-y-2.5 text-sm">
            <DataQualityRow label="Validne cene" value={report.validPriceEntries} color="#22c55e" />
            <DataQualityRow label="numericPrice = 0" value={report.zeroPriceEntries} color="#ef4444" />
            <DataQualityRow label="numericPrice = NULL" value={report.nullNumericPriceEntries} color="#ef4444" />
            <DataQualityRow label="Prazan price string" value={report.priceStringNullOrEmpty} color="#f59e0b" />
            <DataQualityRow label="Sumnjivo visoka cena" value={report.suspiciouslyHighPriceEntries} color="#f59e0b" />
          </div>
        </Section>
        <Section title="Upozorenja">
          {report.warnings.length === 0 ? (
            <p className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Nema upozorenja.</p>
          ) : (
            <ul className="space-y-2">
              {report.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{w}</li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title={`Outlieri i zastareli proizvodi (${outliers.length})`}>
        {outliers.length === 0 ? (
          <p className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Nema pronađenih anomalija.</p>
        ) : (
          <>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {visibleOutliers.map((o, i) => <OutlierRow key={i} text={o} />)}
            </div>
            {outliers.length > 15 && (
              <button
                onClick={() => setShowAllOutliers(v => !v)}
                className="mt-3 text-xs font-semibold text-[#FF9900] hover:underline"
              >
                {showAllOutliers ? "Prikaži manje" : `Prikaži svih ${outliers.length}`}
              </button>
            )}
          </>
        )}
      </Section>
    </div>
  );
}

function DataQualityRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold" style={{ color: value > 0 ? color : "#94a3b8" }}>{value}</span>
    </div>
  );
}

function OutlierRow({ text }: { text: string }) {
  const [type, ...rest] = text.split(" — ");
  const label = OUTLIER_TYPE_LABELS[type] ?? type;
  return (
    <div className="flex items-start gap-2 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50">
      <span className="shrink-0 font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wide text-[10px]">{label}</span>
      <span className="text-slate-600 font-mono truncate">{rest.join(" — ")}</span>
    </div>
  );
}
