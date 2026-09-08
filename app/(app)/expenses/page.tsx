"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { ExpenseList } from "@/components/ExpenseList";
import {
  buildSourceRows,
  filterExpenses,
  fmt,
  RANGE_OPTS,
  type Filters,
} from "@/lib/cycle";

export default function ExpensesPage() {
  const { loading, sources, expenses, tags } = useData();
  const now = useMemo(() => new Date(), []);

  const [filters, setFilters] = useState<Filters>({
    range: "Last 30 days",
    source: "all",
    tag: "All tags",
    q: "",
  });

  const rows = useMemo(
    () => buildSourceRows(sources, expenses, now),
    [sources, expenses, now],
  );
  const filtered = useMemo(
    () => filterExpenses(expenses, rows, filters, now),
    [expenses, rows, filters, now],
  );
  const total = filtered.reduce((t, e) => t + e.amount, 0);
  const srcName = (id: string) =>
    sources.find((s) => s.id === id)?.name || "—";

  const patch = (p: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...p }));

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Expenses</h1>
        <span
          className="text-muted"
          style={{ fontSize: 13, paddingBottom: 6 }}
        >
          {filtered.length} entries · {fmt(total)} · {filters.range.toLowerCase()}
        </span>
        <Link
          className="btn btn-primary"
          href="/add"
          style={{ marginLeft: "auto" }}
        >
          + Add expense
        </Link>
      </div>
      <hr className="hr" />

      <div
        className="filtergrid"
        style={{
          paddingBottom: 18,
          borderBottom: "2px solid var(--color-divider)",
        }}
      >
        <div className="field">
          <label>Date range</label>
          <select
            className="input"
            value={filters.range}
            onChange={(e) => patch({ range: e.target.value })}
          >
            {RANGE_OPTS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Payment source</label>
          <select
            className="input"
            value={filters.source}
            onChange={(e) => patch({ source: e.target.value })}
          >
            <option value="all">All sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Tag</label>
          <select
            className="input"
            value={filters.tag}
            onChange={(e) => patch({ tag: e.target.value })}
          >
            <option value="All tags">All tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Search merchant or note</label>
          <input
            className="input"
            value={filters.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Search…"
          />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <ExpenseList rows={filtered} sourceName={srcName} />
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            padding: "56px 0",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          <h3 style={{ margin: "0 0 6px" }}>Nothing here yet</h3>
          <p className="text-muted" style={{ fontSize: 13 }}>
            No expenses match these filters. Widen the date range, or record your
            first entry.
          </p>
          <Link className="btn btn-primary" href="/add">
            + Add expense
          </Link>
        </div>
      )}

      {filtered.length > 0 && (
        <div
          className="text-muted"
          style={{ fontSize: 12, marginTop: 12 }}
        >
          Click any row to edit.
        </div>
      )}
    </div>
  );
}
