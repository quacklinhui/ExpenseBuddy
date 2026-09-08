"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useData } from "@/components/DataProvider";
import { SourceCard } from "@/components/SourceCard";
import { buildSourceRows, buildTotals } from "@/lib/cycle";

export default function DashboardPage() {
  const { loading, sources, expenses, seedDemo } = useData();
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(
    () => buildSourceRows(sources, expenses, now),
    [sources, expenses, now],
  );
  const totals = useMemo(
    () => buildTotals(rows, sources.length),
    [rows, sources.length],
  );

  if (loading) {
    return <p className="text-muted">Loading your cycle…</p>;
  }

  if (sources.length === 0) {
    return (
      <div style={{ maxWidth: 560, padding: "32px 0" }}>
        <div className="lbl" style={{ color: "var(--color-accent)" }}>
          Get started
        </div>
        <h1 style={{ margin: "6px 0 12px" }}>No payment sources yet.</h1>
        <p style={{ maxWidth: "44ch" }}>
          Every source keeps its own monthly cycle — a card that statements on
          the 5th resets on the 5th, not on the 1st. Add your first source to
          start tracking.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/sources/new">
            + Add payment source
          </Link>
          <button className="btn btn-secondary" onClick={() => void seedDemo()}>
            Load sample data
          </button>
        </div>
        <hr className="hr" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <div>
            <div className="lbl">1</div>
            <div style={{ fontSize: 13 }}>Name the source</div>
          </div>
          <div>
            <div className="lbl">2</div>
            <div style={{ fontSize: 13 }}>Pick a reset day (1–28)</div>
          </div>
          <div>
            <div className="lbl">3</div>
            <div style={{ fontSize: 13 }}>Set a monthly limit (optional)</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <h1 style={{ margin: 0 }}>This cycle</h1>
        <span
          className="text-muted hide-mobile"
          style={{ fontSize: 13, paddingBottom: 6 }}
        >
          Each source on its own reset day
        </span>
      </div>
      <div
        className="text-muted only-mobile"
        style={{ fontSize: 12, marginTop: 4 }}
      >
        {totals.mobileNote}
      </div>
      <hr className="hr" />

      <div className="metrics">
        <div style={{ paddingRight: 14 }}>
          <div className="lbl">Spend, all sources</div>
          <div className="big" style={{ fontSize: 34 }}>
            {totals.spend}
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Combined limits</div>
          <div className="big" style={{ fontSize: 34 }}>
            {totals.limit}
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Remaining</div>
          <div className="big" style={{ fontSize: 34, color: totals.remColor }}>
            {totals.rem}
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Sources</div>
          <div className="big" style={{ fontSize: 34 }}>
            {totals.count}
          </div>
        </div>
      </div>

      <div className="srcgrid">
        {rows.map((s) => (
          <SourceCard key={s.id} s={s} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <Link className="btn btn-secondary" href="/sources/new">
          + Add payment source
        </Link>
        <Link className="btn btn-ghost" href="/expenses">
          All expenses →
        </Link>
      </div>
    </div>
  );
}
