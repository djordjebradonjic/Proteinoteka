"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

interface StoreClick { storeName: string; count: number; }
interface ProductClick { productId: number; productName: string; count: number; }
interface DayClick { date: string; count: number; }
interface Stats {
  clicksPerStore: StoreClick[];
  topProducts: ProductClick[];
  clicksLast7Days: DayClick[];
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/clicks/stats`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const totalClicks = stats?.clicksPerStore.reduce((s, r) => s + r.count, 0) ?? 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Učitavanje...</p>
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-400 text-sm">Greška pri učitavanju podataka.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1B2B4B]">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Praćenje klikova i kupovina</p>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Ukupno klikova" value={totalClicks} />
        <StatCard label="Prodavnica" value={stats.clicksPerStore.length} />
        <StatCard label="Praćenih proizvoda" value={stats.topProducts.length} />
      </div>

      {/* Clicks last 7 days */}
      <Section title="Klikovi — poslednjih 7 dana">
        {stats.clicksLast7Days.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.clicksLast7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                width={30}
              />
              <Tooltip
                cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
                      <p className="text-slate-400 mb-0.5">{payload[0].payload.date}</p>
                      <p className="font-bold text-[#FF9900]">{payload[0].value} klikova</p>
                    </div>
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#FF9900"
                strokeWidth={3}
                dot={{ r: 4, fill: "#FF9900", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#FF9900" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Clicks per store */}
        <Section title="Klikovi po prodavnici">
          {stats.clicksPerStore.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.clicksPerStore} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="storeName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 12 }}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-[#FF9900]">{payload[0].value} klikova</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="count" fill="#1B2B4B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Top 10 products */}
        <Section title="Top 10 proizvoda">
          {stats.topProducts.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 pr-4">#</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2">Proizvod</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 pl-4">Klikovi</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((p, i) => (
                    <tr key={p.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-4 text-slate-400 font-medium text-xs">{i + 1}</td>
                      <td className="py-2.5 text-slate-700 font-medium truncate max-w-[200px]">{p.productName}</td>
                      <td className="py-2.5 pl-4 text-right">
                        <span className="text-xs font-bold bg-[#FFF8EC] text-[#b36b00] px-2 py-0.5 rounded-full border border-[#FFD980]">
                          {p.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </main>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-[#1B2B4B]">{value}</p>
    </div>
  );
}

function Empty() {
  return <p className="text-slate-400 text-sm py-6 text-center">Nema podataka</p>;
}
