"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useData } from "@/components/DataProvider";
import { buildSourceRows } from "@/lib/cycle";

export default function SourcesPage() {
  const router = useRouter();
  const { loading, sources, expenses } = useData();
  const now = useMemo(() => new Date(), []);
  const rows = useMemo(
    () => buildSourceRows(sources, expenses, now),
    [sources, expenses, now],
  );

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Payment sources</h1>
        <Link
          className="btn btn-primary"
          href="/sources/new"
          style={{ marginLeft: "auto" }}
        >
          + Add payment source
        </Link>
      </div>
      <hr className="hr" />

      {rows.length === 0 ? (
        <p className="text-muted">
          No sources yet. Add one to start a cycle.
        </p>
      ) : (
        <>
          {/* desktop */}
          <div className="table-wrap hide-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th style={{ width: 150 }}>Reset day</th>
                  <th style={{ width: 170 }}>Cycle</th>
                  <th style={{ width: 140, textAlign: "right" }}>Spend</th>
                  <th style={{ width: 150, textAlign: "right" }}>Limit</th>
                  <th style={{ width: 160, textAlign: "right" }}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="rowlink"
                    onClick={() => router.push(`/sources/${s.id}`)}
                  >
                    <td>
                      <span style={{ fontWeight: 800 }}>{s.name}</span>{" "}
                      <span className="text-muted">· {s.kind}</span>
                      {s.hasDesc && (
                        <div
                          className="text-muted"
                          style={{ fontSize: 12 }}
                        >
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="text-muted">{s.anchorLabel}</td>
                    <td className="text-muted">{s.cycleLabel}</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {s.spendStr}
                    </td>
                    <td style={{ textAlign: "right" }} className="text-muted">
                      {s.limitStr}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 800,
                        color: s.remColor,
                      }}
                    >
                      {s.remCell}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile */}
          <div className="only-mobile mcol">
            {rows.map((s) => (
              <div
                key={s.id}
                className="rowlink"
                onClick={() => router.push(`/sources/${s.id}`)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--color-divider)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {s.anchorLabel} · {s.cycleLabel}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="big" style={{ fontSize: 16 }}>
                    {s.spendStr}
                  </div>
                  <div style={{ fontSize: 11, color: s.remColor }}>
                    {s.mobileFoot}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
