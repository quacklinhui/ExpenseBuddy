"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "./DataProvider";
import { cycleFor, dLabel } from "@/lib/cycle";

const CURRENCIES = ["SGD", "MYR", "USD", "EUR"];

export function SourceForm({ sourceId }: { sourceId?: string }) {
  const router = useRouter();
  const {
    sources,
    createSource,
    updateSource,
    archiveSource,
    showToast,
  } = useData();
  const now = useMemo(() => new Date(), []);

  const existing = sourceId
    ? sources.find((s) => s.id === sourceId)
    : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [anchor, setAnchor] = useState<number>(existing?.anchor ?? 1);
  const [limit, setLimit] = useState(
    existing?.limit != null ? String(existing.limit) : "",
  );
  const [currency, setCurrency] = useState(existing?.currency ?? "SGD");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    const c = cycleFor(Number(anchor) || 1, now);
    return dLabel(c.start) + " → " + dLabel(c.end);
  }, [anchor, now]);

  if (sourceId && !existing) {
    return (
      <div>
        <h1>Source not found</h1>
        <button
          className="btn btn-secondary"
          onClick={() => router.push("/sources")}
        >
          Back to sources
        </button>
      </div>
    );
  }

  async function save() {
    if (!name.trim()) {
      showToast("Name required", "Give the source a name you will recognise.");
      return;
    }
    const parsedLimit =
      limit.trim() === "" ? null : parseFloat(limit) || null;
    setBusy(true);
    try {
      if (isEdit && existing) {
        await updateSource(existing.id, {
          name,
          description,
          anchor: Number(anchor),
          limit: parsedLimit,
          currency,
        });
        showToast(
          "Source updated",
          name + " resets on day " + anchor + ".",
        );
        router.push(`/sources/${existing.id}`);
      } else {
        const id = await createSource({
          name,
          description,
          anchor: Number(anchor),
          limit: parsedLimit,
          currency,
        });
        showToast(
          name + " added",
          "Cycle resets 00:00 on day " + anchor + " each month.",
        );
        router.push(`/sources/${id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!existing) return;
    setBusy(true);
    try {
      await archiveSource(existing.id);
      showToast(
        existing.name + " archived",
        "Past expenses stay in your history.",
      );
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <div className="lbl">Payment source</div>
      <h1 style={{ margin: "4px 0 0" }}>
        {isEdit ? `Edit ${existing?.name || "source"}` : "New payment source"}
      </h1>
      <hr className="hr" />

      <div className="field" style={{ marginBottom: 18 }}>
        <label>Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. DBS Altitude Visa"
        />
      </div>

      <div className="field" style={{ marginBottom: 18 }}>
        <label>What is this source used for? (optional)</label>
        <textarea
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Groceries and household bills only"
          style={{ minHeight: 64 }}
        />
      </div>

      <div className="field" style={{ marginBottom: 6 }}>
        <label>Reset day</label>
      </div>
      <div className="daygrid">
        {Array.from({ length: 28 }, (_, i) => i + 1).map((n) => {
          const on = Number(anchor) === n;
          return (
            <button
              key={n}
              className="tabbtn"
              onClick={() => setAnchor(n)}
              style={{
                padding: "7px 0",
                fontSize: 12,
                textAlign: "center",
                background: on ? "var(--color-accent)" : "var(--color-bg)",
                color: on ? "var(--color-bg)" : "var(--color-text)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
        Cycle starts at 00:00 on this day each month. Current pick: {preview}
      </div>

      <div className="formgrid2" style={{ marginTop: 22 }}>
        <div className="field">
          <label>Monthly limit (optional)</label>
          <input
            className="input"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Leave blank for no limit"
            inputMode="decimal"
          />
        </div>
        <div className="field">
          <label>Currency</label>
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
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
          onClick={() => void save()}
          disabled={busy}
        >
          Save
        </button>
        <button
          className="btn btn-ghost"
          onClick={() =>
            router.push(isEdit && existing ? `/sources/${existing.id}` : "/")
          }
          disabled={busy}
        >
          Cancel
        </button>
        {isEdit && (
          <button
            className="btn btn-secondary"
            onClick={() => void archive()}
            disabled={busy}
            style={{ marginLeft: "auto" }}
          >
            Archive source
          </button>
        )}
      </div>
    </div>
  );
}
