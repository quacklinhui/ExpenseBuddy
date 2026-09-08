"use client";

import { useData } from "./DataProvider";

export function ToastHost() {
  const { toast, clearToast, deleteExpense } = useData();
  if (!toast) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: 24,
        bottom: 24,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--color-text)",
        color: "var(--color-bg)",
        padding: "14px 18px",
        boxShadow: "var(--shadow-lg)",
        maxWidth: 420,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          background: "var(--color-accent)",
          flex: "none",
        }}
      />
      <div>
        <div style={{ font: "800 13px/1.2 var(--font-heading)" }}>
          {toast.title}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{toast.body}</div>
      </div>
      {toast.undoExpenseId && (
        <button
          className="tabbtn"
          onClick={() => {
            const id = toast.undoExpenseId!;
            clearToast();
            void deleteExpense(id);
          }}
          style={{
            marginLeft: "auto",
            color: "var(--color-accent-400)",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          UNDO
        </button>
      )}
      <button
        className="tabbtn"
        onClick={clearToast}
        aria-label="Dismiss"
        style={{
          color: "var(--color-bg)",
          opacity: 0.6,
          marginLeft: toast.undoExpenseId ? 0 : "auto",
        }}
      >
        ×
      </button>
    </div>
  );
}
