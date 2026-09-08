"use client";

import type { Expense } from "@/lib/types";
import { dLabel, fmt, timeLabel } from "@/lib/cycle";
import { useEditExpense } from "./EditExpense";

type Props = {
  rows: Expense[];
  sourceName: (id: string) => string;
  showSource?: boolean;
};

export function ExpenseList({ rows, sourceName, showSource = true }: Props) {
  const { open } = useEditExpense();

  return (
    <>
      {/* desktop / tablet */}
      <div className="table-wrap hide-mobile">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Date</th>
              <th>Merchant</th>
              <th>Tags</th>
              {showSource && <th style={{ width: 190 }}>Payment source</th>}
              <th style={{ width: 120, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = new Date(r.ts);
              return (
                <tr
                  key={r.id}
                  className="rowlink"
                  onClick={() => open(r.id)}
                >
                  <td>
                    <span style={{ fontWeight: 800 }}>{dLabel(d)}</span>{" "}
                    <span className="text-muted">{timeLabel(d)}</span>
                  </td>
                  <td>{r.merchant || "—"}</td>
                  <td>
                    <div
                      style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                    >
                      {r.tags.map((t) => (
                        <span key={t} className="tag tag-neutral">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  {showSource && (
                    <td className="text-muted">{sourceName(r.sourceId)}</td>
                  )}
                  <td style={{ textAlign: "right", fontWeight: 800 }}>
                    {fmt(r.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* mobile */}
      <div className="only-mobile mcol">
        {rows.map((r) => {
          const d = new Date(r.ts);
          const meta =
            dLabel(d) +
            " · " +
            sourceName(r.sourceId) +
            (r.tags.length ? " · " + r.tags.join(", ") : "");
          return (
            <div
              key={r.id}
              className="rowlink"
              onClick={() => open(r.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid var(--color-divider)",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  {r.merchant || "—"}
                </div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {meta}
                </div>
              </div>
              <div className="big" style={{ fontSize: 16 }}>
                {fmt(r.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
