"use client";

import Link from "next/link";
import type { SourceRow } from "@/lib/cycle";

export function SourceCard({ s }: { s: SourceRow }) {
  return (
    <Link href={`/sources/${s.id}`} className="srcCard">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ font: "800 18px/1.15 var(--font-heading)" }}>{s.name}</div>
        <span className="tag tag-neutral" style={{ marginLeft: "auto" }}>
          {s.kind}
        </span>
      </div>

      {s.hasDesc && (
        <div
          className="text-muted"
          style={{ fontSize: 12, marginTop: 6 }}
        >
          {s.description}
        </div>
      )}

      <div className="lbl" style={{ marginTop: 8 }}>
        Cycle {s.cycleLabel}
      </div>
      <div
        className="big"
        style={{ fontSize: 38, marginTop: 10, lineHeight: 1 }}
      >
        {s.spendStr}
      </div>

      <div
        style={{
          height: 10,
          background: "var(--color-neutral-300)",
          marginTop: 14,
        }}
      >
        <div
          style={{ height: 10, width: s.pctStr, background: s.barColor }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 12,
        }}
      >
        <span className="text-muted">
          {s.hasLimit
            ? `Limit ${s.limitStr} · ${s.pctLabel}`
            : `No limit set · ${s.countLabel}`}
        </span>
        {s.over ? (
          <span style={{ fontWeight: 800, color: "var(--color-accent-700)" }}>
            Over by {s.remStr}
          </span>
        ) : (
          s.hasLimit && (
            <span style={{ fontWeight: 800 }}>{s.remStr} left</span>
          )
        )}
      </div>
    </Link>
  );
}
