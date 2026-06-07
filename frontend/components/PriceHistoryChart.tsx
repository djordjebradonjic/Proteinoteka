"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  datum: string;
  cena: number;
}

function fmt(val: number) {
  return Math.round(val).toLocaleString("de-DE");
}

export default function PriceHistoryChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FF9900" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#FF9900" stopOpacity={0}    />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

        <XAxis
          dataKey="datum"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          dy={8}
          interval="preserveStartEnd"
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickFormatter={fmt}
          width={58}
          domain={["auto", "auto"]}
        />

        <Tooltip
          cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "4 4" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 pointer-events-none">
                <p className="text-[11px] text-slate-400 mb-1">{payload[0].payload.datum}</p>
                <p className="text-[15px] font-black text-slate-900 leading-none">
                  {fmt(payload[0].value as number)}{" "}
                  <span className="text-xs font-semibold text-slate-400">RSD</span>
                </p>
              </div>
            ) : null
          }
        />

        <Area
          type="linear"
          dataKey="cena"
          stroke="#FF9900"
          strokeWidth={2.5}
          fill="url(#priceGradient)"
          dot={{ r: 3.5, fill: "#FF9900", stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#FF9900", stroke: "#fff", strokeWidth: 2.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
