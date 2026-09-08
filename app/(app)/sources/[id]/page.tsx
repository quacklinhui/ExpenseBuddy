"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useData } from "@/components/DataProvider";
import { ExpenseList } from "@/components/ExpenseList";
import { buildSourceRows, buildDetail } from "@/lib/cycle";

export default function SourceDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { loading, sources, expenses } = useData();
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(
    () => buildSourceRows(sources, expenses, now),
    [sources, expenses, now],
  );
  const active = rows.find((s) => s.id === id);
  const detail = useMemo(
    () => (active ? buildDetail(active, now) : null),
    [active, now],
  );
  const srcName = (sid: string) =>
    sources.find((s) => s.id === sid)?.name || "—";

  if (loading) return <p className="text-muted">Loading…</p>;

  if (!active || !detail) {
    return (
      <div>
        <button
          className="btn btn-ghost"
          onClick={() => router.push("/sources")}
        >
          ← Payment sources
        </button>
        <h1 style={{ marginTop: 12 }}>Source not found</h1>
        <p className="text-muted">
          It may have been archived. Check the sources list.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => router.push("/")}>
        ← Dashboard
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>{active.name}</h1>
        <span className="tag tag-neutral" style={{ marginBottom: 8 }}>
          {active.kind}
        </span>
        <Link
          className="btn btn-secondary"
          href={`/sources/${active.id}/edit`}
          style={{ marginLeft: "auto" }}
        >
          Edit source
        </Link>
        <Link className="btn btn-primary" href={`/add?source=${active.id}`}>
          + Add expense
        </Link>
      </div>

      {active.hasDesc && (
        <p
          className="text-muted"
          style={{ fontSize: 14, margin: "10px 0 0", maxWidth: "60ch" }}
        >
          {active.description}
        </p>
      )}

      <hr className="hr" />

      <div className="metrics" style={{ marginBottom: 8 }}>
        <div style={{ paddingRight: 14 }}>
          <div className="lbl">Spend this cycle</div>
          <div className="big" style={{ fontSize: 40 }}>
            {active.spendStr}
          </div>
        </div>
        <div className="cell">
          <div className="lbl">{detail.remLabel}</div>
          <div
            className="big"
            style={{ fontSize: 40, color: active.remColor }}
          >
            {detail.remCell}
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Cycle</div>
          <div className="big" style={{ fontSize: 22, paddingTop: 12 }}>
            {active.cycleLabel}
          </div>
          <div className="text-muted" style={{ fontSize: 11 }}>
            Resets 00:00 on day {active.anchor}
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Entries</div>
          <div className="big" style={{ fontSize: 40 }}>
            {active.count}
          </div>
        </div>
      </div>

      <div
        style={{
          height: 10,
          background: "var(--color-neutral-300)",
          margin: "14px 0 6px",
        }}
      >
        <div
          style={{
            height: 10,
            width: active.pctStr,
            background: active.barColor,
          }}
        />
      </div>
      <div className="text-muted" style={{ fontSize: 12 }}>
        {detail.barNote}
      </div>

      <h4 style={{ margin: "34px 0 10px" }}>Daily spend, this cycle</h4>
      <div
        className="chartrow hide-mobile"
        style={{
          gap: 4,
          height: 120,
          borderBottom: "2px solid var(--color-divider)",
        }}
      >
        {detail.bars.map((b, i) => (
          <div
            key={i}
            title={b.title}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              height: "100%",
            }}
          >
            <div style={{ height: b.h, background: b.color }} />
          </div>
        ))}
      </div>
      <div
        className="chartrow only-mobile mrow"
        style={{
          gap: 3,
          height: 80,
          borderBottom: "2px solid var(--color-divider)",
        }}
      >
        {detail.bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              height: "100%",
            }}
          >
            <div style={{ height: b.hSm, background: b.color }} />
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
        }}
        className="text-muted"
      >
        <span style={{ fontSize: 11 }}>{detail.firstDay}</span>
        <span style={{ fontSize: 11 }}>today</span>
        <span style={{ fontSize: 11 }}>{detail.lastDay}</span>
      </div>

      <h4 style={{ margin: "34px 0 10px" }}>Expenses in this cycle</h4>
      {active.items.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 13 }}>
          No expenses recorded on this source this cycle yet.
        </p>
      ) : (
        <ExpenseList
          rows={active.items}
          sourceName={srcName}
          showSource={false}
        />
      )}
    </div>
  );
}
