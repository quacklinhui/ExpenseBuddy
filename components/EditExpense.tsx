"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useData } from "./DataProvider";
import { toLocalInput } from "@/lib/cycle";

type EditCtx = { open: (id: string) => void };
const Ctx = createContext<EditCtx | null>(null);

export function useEditExpense() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEditExpense must be used inside <EditExpenseProvider>");
  return c;
}

export function EditExpenseProvider({ children }: { children: React.ReactNode }) {
  const [editId, setEditId] = useState<string | null>(null);
  const value = useMemo<EditCtx>(() => ({ open: (id) => setEditId(id) }), []);
  return (
    <Ctx.Provider value={value}>
      {children}
      {editId && (
        // key: remount per expense so the form re-seeds from lazy initializers
        <EditDialog key={editId} id={editId} onClose={() => setEditId(null)} />
      )}
    </Ctx.Provider>
  );
}

function EditDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { expenses, sources, tags, updateExpense, deleteExpense, showToast } =
    useData();
  const original = expenses.find((e) => e.id === id);

  const [amount, setAmount] = useState(() =>
    original ? original.amount.toFixed(2) : "",
  );
  const [merchant, setMerchant] = useState(() => original?.merchant ?? "");
  const [note, setNote] = useState(() => original?.note ?? "");
  const [sourceId, setSourceId] = useState(() => original?.sourceId ?? "");
  const [date, setDate] = useState(() =>
    original ? toLocalInput(original.ts) : "",
  );
  const [chosen, setChosen] = useState<string[]>(() =>
    original ? [...original.tags] : [],
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!original) {
    return null;
  }

  function toggleTag(t: string) {
    setChosen((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  async function save() {
    setBusy(true);
    try {
      const amt = parseFloat(amount) || 0;
      await updateExpense(id, {
        amount: amt,
        merchant,
        note,
        sourceId,
        ts: date,
        tags: chosen,
      });
      showToast("Expense updated", (merchant || "Entry") + " · S$" + amt.toFixed(2));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteExpense(id, { silent: true });
      showToast(
        "Expense deleted",
        (merchant || "Entry") + " removed from this cycle.",
      );
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Edit expense">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="dialog-title">Edit expense</span>
          <span
            className="text-muted"
            style={{ fontSize: 11, marginLeft: "auto" }}
          >
            {original.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <hr className="hr" style={{ margin: 0 }} />

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <span
            className="big"
            style={{ fontSize: 28, color: "var(--color-neutral-500)" }}
          >
            S$
          </span>
          <input
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            aria-label="Amount"
            style={{
              font: "800 30px/1 var(--font-heading)",
              background: "transparent",
              border: 0,
              borderBottom: "2px solid var(--color-divider)",
              padding: 0,
              height: 38,
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div className="field">
            <label>Merchant</label>
            <input
              className="input"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Payment source</label>
            <select
              className="input"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date &amp; time</label>
            <input
              className="input"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Note</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="field">
          <label>Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map((t) => {
              const on = chosen.includes(t);
              return (
                <button
                  key={t}
                  className="tabbtn tag"
                  onClick={() => toggleTag(t)}
                  style={{
                    background: on
                      ? "var(--color-accent-100)"
                      : "transparent",
                    color: on
                      ? "var(--color-accent-800)"
                      : "var(--color-neutral-700)",
                    padding: "3px 10px",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="dialog-actions">
          <button
            className="btn btn-ghost"
            onClick={remove}
            disabled={busy}
            style={{ marginRight: "auto", color: "var(--color-accent-700)" }}
          >
            Delete
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
