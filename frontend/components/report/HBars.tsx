// Horizontal bar chart in plain HTML/CSS: one series, one baseline, bars <= 24px with a 4px
// rounded data-end, the value at the tip (never inside the bar), labels in text colours and the
// mark in the single validated series colour. A table with the same numbers sits next to every
// chart on the page, and each row carries a native tooltip.

export interface HBarRow {
  label: string;
  value: number;
  /** Text shown at the bar tip. */
  valueLabel: string;
  /** Secondary muted text after the value label (sample size etc.). */
  note?: string;
  href?: string;
  /** Native tooltip / screen-reader text. */
  title?: string;
}

import Link from "next/link";

export function HBars({ ariaLabel, rows, max }: { ariaLabel: string; rows: HBarRow[]; max: number }) {
  return (
    <ul className="space-y-2" role="list" aria-label={ariaLabel}>
      {rows.map((r) => {
        const width = max > 0 ? Math.max(0, Math.min(100, (r.value / max) * 100)) : 0;
        return (
          <li key={r.label} title={r.title} className="grid grid-cols-[6.5rem_1fr] sm:grid-cols-[9.5rem_1fr] items-center gap-x-3">
            <span className="text-xs sm:text-sm text-slate-700 leading-tight">
              {r.href ? <Link href={r.href} className="hover:text-[#b45f00] hover:underline">{r.label}</Link> : r.label}
            </span>
            {/* the track's left border is the single baseline */}
            <span className="flex items-center gap-2 border-l border-slate-300 py-0.5 min-w-0">
              {width > 0 && (
                <span
                  className="block h-5 shrink-0 rounded-r-[4px] bg-[#2a78d6]"
                  style={{ width: `calc(${width}% * 0.6)` }}
                  aria-hidden
                />
              )}
              <span className="text-xs sm:text-sm font-semibold text-slate-900 whitespace-nowrap">
                {r.valueLabel}
                {r.note && <span className="hidden sm:inline font-normal text-slate-500"> · {r.note}</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export interface ColumnDatum {
  label: string;
  value: number;
  sub?: string;
}

/** A few labelled columns (counts per period), same colour and mark rules as HBars. */
export function Columns({ ariaLabel, data }: { ariaLabel: string; data: ColumnDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="flex items-end gap-3 sm:gap-5 h-44 border-b border-slate-300 px-1" role="list" aria-label={ariaLabel}>
      {data.map((d) => (
        <li key={d.label} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${d.label}: ${d.value}`}>
          <span className="text-sm font-bold text-slate-900 mb-1">{d.value}</span>
          <span
            className="block w-full max-w-[3.25rem] rounded-t-[4px] bg-[#2a78d6]"
            style={{ height: `${(d.value / max) * 78}%` }}
            aria-hidden
          />
        </li>
      ))}
    </ul>
  );
}
