"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  datum: string;
  cena: number;
}

export default function PriceHistoryChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="datum" axisLine={false} tickLine={false}
               tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
        <YAxis hide domain={["dataMin - 200", "dataMax + 200"]} />
        <Tooltip
          cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
                <p className="font-bold mb-0.5">{payload[0].payload.datum}</p>
                <p className="text-[#FF9900]">{payload[0].value?.toLocaleString("sr-RS")} RSD</p>
              </div>
            ) : null
          }
        />
        <Line type="stepAfter" dataKey="cena" stroke="#FF9900" strokeWidth={3}
              dot={{ r: 0 }} activeDot={{ r: 5, fill: "#FF9900" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
