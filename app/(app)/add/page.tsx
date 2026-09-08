"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { buildSourceRows, cycleFor, fmt } from "@/lib/cycle";
import { toLocalInput } from "@/lib/cycle";

export default function AddExpensePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { loading, sources, expenses, tags, addTag, addExpense, showToast } =
    useData();
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(
    () => buildSourceRows(sources, expenses, now),
    [sources, expenses, now],
  );

  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState(
    params.get("source") || sources[0]?.id || "",
  );
  const [date, setDate] = useState(toLocalInput(now.toISOString()));
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const effectiveSource = sourceId || sources[0]?.id || "";
  const fmSrc = rows.find((s) => s.id === effectiveSource);

  const suggestions = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const base = tags
      .filter(
        (t) =>
          !chosen.includes(t) && (!q || t.toLowerCase().includes(q)),
      )
      .slice(0, 5);
    const out = base.map((label) => ({ label, value: label, create: false }));
    if (q && !tags.some((t) => t.toLowerCase() === q)) {
      out.unshift({
        label: `+ Create “${tagQuery.trim()}”`,
        value: tagQuery.trim(),
        create: true,
      });
    }
    return out;
  }, [tags, chosen, tagQuery]);

  function pickTag(value: string) {
    const clean = value.trim();
    if (!clean) return;
    if (!chosen.includes(clean)) setChosen((p) => [...p, clean]);
    if (!tags.includes(clean)) void addTag(clean);
    setTagQuery("");
  }

  function resetForm() {
    setAmount("");
    setMerchant("");
    setNote("");
    setChosen([]);
    setTagQuery("");
  }

  async function save(another: boolean) {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast("Enter an amount", "An expense needs a value above zero.");
      return;
    }
    if (!effectiveSource) {
      showToast("Pick a source", "Choose which payment source this went on.");
      return;
    }
    setBusy(true);
    try {
      await addExpense({
        sourceId: effectiveSource,
        ts: date,
        merchant,
        amount: amt,
        note,
        tags: chosen,
      });

      const s = sources.find((x) => x.id === effectiveSource)!;
      const c = cycleFor(s.anchor, now);
      const spend = [...expenses]
        .filter(
          (e) =>
            e.sourceId === s.id &&
            new Date(e.ts) >= c.start &&
            new Date(e.ts) < c.end,
        )
        .reduce((t, e) => t + e.amount, amt);
      const tail =
        s.limit != null && s.limit > 0
          ? s.limit - spend >= 0
            ? fmt(s.limit - spend) + " left this cycle"
            : "Over limit by " + fmt(spend - s.limit)
          : fmt(spend) + " this cycle";
      showToast(fmt(amt) + " saved to " + s.name, tail);

      if (another) {
        resetForm();
      } else {
        router.push("/");
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;

  if (sources.length === 0) {
    return (
      <div style={{ maxWidth: 560 }}>
        <h1>Add a payment source first</h1>
        <p className="text-muted">
          An expense has to land on a source with its own cycle.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/sources/new")}
        >
          + Add payment source
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="lbl">New entry</div>
      <h1 style={{ margin: "4px 0 0" }}>Add expense</h1>
      <hr className="hr" />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
          paddingBottom: 18,
          borderBottom: "2px solid var(--color-divider)",
        }}
      >
        <span
          className="big"
          style={{ fontSize: 52, color: "var(--color-neutral-500)" }}
        >
          S$
        </span>
        <input
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          aria-label="Amount"
          autoFocus
          style={{
            font: "800 52px/1 var(--font-heading)",
            background: "transparent",
            border: 0,
            padding: 0,
            height: 60,
            letterSpacing: "-.02em",
          }}
        />
      </div>

      <div className="formgrid2" style={{ marginTop: 22 }}>
        <div className="field">
          <label>Payment source</label>
          <select
            className="input"
            value={effectiveSource}
            onChange={(e) => setSourceId(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {fmSrc && (
            <div
              className="text-muted"
              style={{ fontSize: 11, marginTop: 5 }}
            >
              Cycle {fmSrc.cycleLabel} · {fmSrc.spendStr} spent so far
            </div>
          )}
        </div>

        <div className="field">
          <label>Date &amp; time</label>
          <input
            className="input"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="text-muted" style={{ fontSize: 11, marginTop: 5 }}>
            Defaults to now
          </div>
        </div>

        <div className="field">
          <label>Merchant (optional)</label>
          <input
            className="input"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. FairPrice Finest"
          />
        </div>

        <div className="field">
          <label>Tags</label>
          <input
            className="input"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagQuery.trim()) {
                e.preventDefault();
                pickTag(tagQuery);
              }
            }}
            placeholder="Type to search or create"
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 8,
            }}
          >
            {suggestions.map((t) => (
              <button
                key={t.label}
                className="tag tag-outline tabbtn"
                onClick={() => pickTag(t.value)}
                style={{ padding: "3px 10px" }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 12,
          minHeight: 24,
        }}
      >
        {chosen.map((t) => (
          <span key={t} className="tag tag-accent" style={{ gap: 6 }}>
            {t}
            <button
              className="tabbtn"
              onClick={() => setChosen((p) => p.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
              style={{
                color: "var(--color-accent-800)",
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="field" style={{ marginTop: 18 }}>
        <label>Note (optional)</label>
        <textarea
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ minHeight: 70 }}
        />
      </div>

      <hr className="hr" />
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => void save(false)}
          disabled={busy}
        >
          Save
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => void save(true)}
          disabled={busy}
        >
          Save &amp; add another
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => router.push("/")}
          style={{ marginLeft: "auto" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
