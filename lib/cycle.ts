import type { Source, Expense } from "./types";

/* ── formatting ─────────────────────────────────────────────────────────── */

export function fmt(n: number): string {
  return (
    "S$" +
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dLabel(d: Date): string {
  return d.getDate() + " " + MONTHS[d.getMonth()];
}

export function timeLabel(d: Date): string {
  return d
    .toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

export function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** ISO string → value for <input type="datetime-local"> (local time, no seconds) */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

/* ── cycle window ───────────────────────────────────────────────────────── */

export function cycleFor(anchor: number, now: Date): { start: Date; end: Date } {
  let start = new Date(now.getFullYear(), now.getMonth(), anchor);
  if (now.getDate() < anchor) {
    start = new Date(now.getFullYear(), now.getMonth() - 1, anchor);
  }
  const end = new Date(start.getFullYear(), start.getMonth() + 1, anchor);
  return { start, end };
}

/* ── derived rows (mirrors the prototype's renderVals) ──────────────────── */

const OVER = "var(--color-accent-700)";
const INK = "var(--color-text)";

export type SourceRow = {
  id: string;
  name: string;
  kind: string;
  anchor: number;
  description: string;
  hasDesc: boolean;
  anchorLabel: string;
  cycleLabel: string;
  spend: number;
  spendStr: string;
  hasLimit: boolean;
  noLimit: boolean;
  over: boolean;
  notOver: boolean;
  limit: number | null;
  limitStr: string;
  remStr: string;
  remCell: string;
  remColor: string;
  pct: number;
  pctStr: string;
  pctLabel: string;
  barColor: string;
  count: number;
  countLabel: string;
  mobileFoot: string;
  items: Expense[];
  start: Date;
  end: Date;
};

export function buildSourceRows(
  sources: Source[],
  expenses: Expense[],
  now: Date,
): SourceRow[] {
  return sources.map((s) => {
    const c = cycleFor(s.anchor, now);
    const items = expenses
      .filter(
        (e) =>
          e.sourceId === s.id &&
          new Date(e.ts) >= c.start &&
          new Date(e.ts) < c.end,
      )
      .sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
    const spend = items.reduce((t, e) => t + e.amount, 0);
    const hasLimit = s.limit != null && s.limit > 0;
    const limit = hasLimit ? (s.limit as number) : null;
    const rem = hasLimit ? (limit as number) - spend : 0;
    const over = hasLimit && rem < 0;
    const pct = hasLimit ? Math.min(100, (spend / (limit as number)) * 100) : 0;

    return {
      id: s.id,
      name: s.name,
      kind: s.kind,
      anchor: s.anchor,
      description: s.description || "",
      hasDesc: !!(s.description && s.description.trim()),
      anchorLabel: "Resets " + ord(s.anchor),
      cycleLabel: dLabel(c.start) + " → " + dLabel(c.end),
      spend,
      spendStr: fmt(spend),
      hasLimit,
      noLimit: !hasLimit,
      over,
      notOver: hasLimit && !over,
      limit,
      limitStr: hasLimit ? fmt(limit as number) : "No limit",
      remStr: hasLimit ? fmt(Math.abs(rem)) : "",
      remCell: hasLimit ? (over ? "−" + fmt(Math.abs(rem)) : fmt(rem)) : "—",
      remColor: over ? OVER : INK,
      pct,
      pctStr: (hasLimit ? pct : 0).toFixed(1) + "%",
      pctLabel: hasLimit
        ? Math.round((spend / (limit as number)) * 100) + "% of limit"
        : "",
      barColor: over
        ? OVER
        : pct > 85
          ? "var(--color-accent)"
          : INK,
      count: items.length,
      countLabel: items.length + (items.length === 1 ? " expense" : " expenses"),
      mobileFoot: !hasLimit
        ? "No limit · " + items.length + " entries"
        : over
          ? "Over by " + fmt(Math.abs(rem))
          : fmt(rem) + " left of " + fmt(limit as number),
      items,
      start: c.start,
      end: c.end,
    };
  });
}

export function buildTotals(rows: SourceRow[], sourceCount: number) {
  const totalSpend = rows.reduce((t, s) => t + s.spend, 0);
  const totalLimit = rows.reduce((t, s) => t + (s.limit || 0), 0);
  const totalRem =
    totalLimit -
    rows.filter((s) => s.hasLimit).reduce((t, s) => t + s.spend, 0);
  const overCount = rows.filter((s) => s.over).length;
  return {
    spend: fmt(totalSpend),
    limit: totalLimit ? fmt(totalLimit) : "—",
    rem: totalLimit ? fmt(totalRem) : "—",
    remColor: totalRem < 0 ? OVER : INK,
    count: String(sourceCount),
    mobileNote: overCount
      ? overCount + (overCount === 1 ? " source over limit" : " sources over limit")
      : rows.length + " sources on their own cycles",
  };
}

/* ── expense-detail chart + list for a single source ────────────────────── */

const DAY = 864e5;

export function buildDetail(active: SourceRow, now: Date) {
  const dayCount = Math.round((+active.end - +active.start) / DAY);
  const perDay: { d: Date; v: number; future: boolean }[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(
      active.start.getFullYear(),
      active.start.getMonth(),
      active.start.getDate() + i,
    );
    const v = active.items
      .filter((e) => {
        const t = new Date(e.ts);
        return (
          t.getFullYear() === d.getFullYear() &&
          t.getMonth() === d.getMonth() &&
          t.getDate() === d.getDate()
        );
      })
      .reduce((t, e) => t + e.amount, 0);
    perDay.push({ d, v, future: d > now });
  }
  const max = Math.max(1, ...perDay.map((p) => p.v));

  return {
    remLabel: active.hasLimit
      ? active.over
        ? "Over limit by"
        : "Remaining"
      : "Limit",
    remCell: active.hasLimit
      ? fmt(Math.abs((active.limit as number) - active.spend))
      : "None",
    barNote: active.hasLimit
      ? active.over
        ? "Limit " +
          active.limitStr +
          " · exceeded " +
          active.pctLabel.replace(" of limit", "") +
          " of limit"
        : active.pctLabel + " of " + active.limitStr + " used"
      : "No monthly limit set for this source — showing spend only.",
    firstDay: dLabel(active.start),
    lastDay: dLabel(new Date(+active.end - DAY)),
    bars: perDay.map((p) => ({
      h: Math.max(p.v > 0 ? 3 : 1, Math.round((p.v / max) * 116)),
      hSm: Math.max(p.v > 0 ? 2 : 1, Math.round((p.v / max) * 76)),
      color: p.future
        ? "var(--color-neutral-300)"
        : p.v > 0
          ? "var(--color-text)"
          : "var(--color-neutral-300)",
      title: dLabel(p.d) + " — " + fmt(p.v),
    })),
  };
}

/* ── expense list filtering (Expenses screen) ───────────────────────────── */

export type Filters = {
  range: string;
  source: string; // "all" | source id
  tag: string; // "All tags" | tag
  q: string;
};

export const RANGE_OPTS = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "This cycle",
  "All time",
];

export function filterExpenses(
  expenses: Expense[],
  rows: SourceRow[],
  f: Filters,
  now: Date,
): Expense[] {
  let out = expenses
    .slice()
    .sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

  if (f.range !== "All time") {
    if (f.range === "This cycle") {
      out = out.filter((e) => {
        const s = rows.find((x) => x.id === e.sourceId);
        return s && new Date(e.ts) >= s.start && new Date(e.ts) < s.end;
      });
    } else {
      const days =
        f.range === "Last 7 days" ? 7 : f.range === "Last 30 days" ? 30 : 90;
      const from = new Date(now.getTime() - days * DAY);
      out = out.filter((e) => new Date(e.ts) >= from);
    }
  }
  if (f.source !== "all") out = out.filter((e) => e.sourceId === f.source);
  if (f.tag !== "All tags") out = out.filter((e) => e.tags.includes(f.tag));
  if (f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    out = out.filter((e) =>
      (e.merchant + " " + e.note).toLowerCase().includes(q),
    );
  }
  return out;
}
