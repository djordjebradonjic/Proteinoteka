"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

interface StoreClick   { storeName: string; count: number; }
interface ProductClick { productId: number; productName: string; count: number; }
interface DayClick     { date: string; count: number; }

interface Stats {
  // CLICK_OUT
  clicksPerStore:    StoreClick[];
  topProducts:       ProductClick[];
  clicksLast7Days:   DayClick[];
  totalClickOuts:    number;
  // PRODUCT_VIEW
  viewsLast7Days:    DayClick[];
  topViewedProducts: ProductClick[];
  totalViews:        number;
  // COMPARE_CLICK
  compareLast7Days:  DayClick[];
  totalCompares:     number;
}

function mergeByDate(
  views: DayClick[],
  compares: DayClick[],
  clickouts: DayClick[],
): { date: string; views: number; compares: number; clickouts: number }[] {
  const map = new Map<string, { views: number; compares: number; clickouts: number }>();
  const ensure = (d: string) => {
    if (!map.has(d)) map.set(d, { views: 0, compares: 0, clickouts: 0 });
    return map.get(d)!;
  };
  views.forEach(({ date, count })    => { ensure(date).views    = count; });
  compares.forEach(({ date, count }) => { ensure(date).compares = count; });
  clickouts.forEach(({ date, count })=> { ensure(date).clickouts = count; });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

export default function AdminAnalyticsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/clicks/stats`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400 text-sm">Učitavanje...</p>
    </main>
  );

  if (error || !stats) return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-red-400 text-sm">Greška pri učitavanju podataka.</p>
    </main>
  );

  const conversionRate = stats.totalViews > 0
    ? ((stats.totalClickOuts / stats.totalViews) * 100).toFixed(1)
    : "—";

  const merged = mergeByDate(stats.viewsLast7Days, stats.compareLast7Days, stats.clicksLast7Days);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1B2B4B]">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Praćenje klikova i konverzija</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pregledi proizvoda"  value={stats.totalViews}     color="#3b82f6" />
        <StatCard label="Klikovi Uporedi"     value={stats.totalCompares}  color="#8b5cf6" />
        <StatCard label="Klikovi Kupi"        value={stats.totalClickOuts} color="#FF9900" />
        <StatCard label="Konverzija (%)"      value={conversionRate}       color="#22c55e" suffix="" />
      </div>

      {/* Combined activity chart */}
      <Section title="Aktivnost — poslednjih 7 dana">
        {merged.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={merged}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }} width={30} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs space-y-1">
                      <p className="text-slate-400 mb-1">{payload[0].payload.date}</p>
                      {payload.map((p) => (
                        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
                          {p.name}: {p.value}
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="views"     name="Pregledi"  stroke="#3b82f6"
                strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="compares"  name="Uporedi"   stroke="#8b5cf6"
                strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#8b5cf6" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="clickouts" name="Kupi"      stroke="#FF9900"
                strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "#FF9900" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Clicks per store */}
        <Section title="Klikovi Kupi — po prodavnici">
          {stats.clicksPerStore.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.clicksPerStore} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="storeName" axisLine={false} tickLine={false}
                  tick={{ fill: "#475569", fontSize: 12 }} width={90} />
                <Tooltip cursor={{ fill: "#f8fafc" }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-[#FF9900]">{payload[0].value} klikova</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="count" fill="#FF9900" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Top 10 by click-outs */}
        <Section title="Top 10 — Kupi klikovi">
          <ProductTable rows={stats.topProducts} badgeColor="#FF9900" />
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Top 10 by views */}
        <Section title="Top 10 — Pregledi proizvoda">
          <ProductTable rows={stats.topViewedProducts} badgeColor="#3b82f6" />
        </Section>

        {/* Funnel */}
        <Section title="Funnel konverzije">
          <FunnelView
            views={stats.totalViews}
            compares={stats.totalCompares}
            clickouts={stats.totalClickOuts}
          />
        </Section>
      </div>
    </main>
  );
}

function FunnelView({ views, compares, clickouts }: {
  views: number; compares: number; clickouts: number;
}) {
  const steps = [
    { label: "Pregled proizvoda", value: views,    color: "#3b82f6" },
    { label: "Klik Uporedi",      value: compares,  color: "#8b5cf6" },
    { label: "Klik Kupi",         value: clickouts, color: "#FF9900" },
  ];
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-4 py-2">
      {steps.map((s, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">{s.label}</span>
            <span className="font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
          </div>
          <div className="h-7 bg-slate-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-700 flex items-center px-2"
              style={{ width: `${Math.max(4, (s.value / max) * 100)}%`, backgroundColor: s.color }}
            >
              {s.value > 0 && max > 0 && (
                <span className="text-white text-[10px] font-bold whitespace-nowrap">
                  {((s.value / max) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      {views > 0 && (
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          Konverzija Kupi/Pregled:{" "}
          <span className="font-bold text-[#FF9900]">
            {((clickouts / views) * 100).toFixed(1)}%
          </span>
        </p>
      )}
    </div>
  );
}

function ProductTable({ rows, badgeColor }: {
  rows: { productId: number; productName: string; count: number }[];
  badgeColor: string;
}) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ label, value, color, suffix = "" }: {
  label: string; value: number | string; color: string; suffix?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );
}

function Empty() {
  return <p className="text-slate-400 text-sm py-6 text-center">Nema podataka</p>;
}
