"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      if (!data.session) {
        setNotice(
          "Account created. Check your email for a confirmation link, then sign in.",
        );
        setMode("signin");
        setBusy(false);
        return;
      }
      // New accounts start empty. The dashboard's "Load sample data" button
      // seeds demo data on request, so the experience is the same whether or
      // not email confirmation is enabled.
      router.replace(next);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--color-bg)",
      }}
    >
      <div style={{ width: "min(400px, 100%)" }}>
        <div
          className="nav-brand"
          style={{ fontSize: 22, marginBottom: 4, letterSpacing: ".02em" }}
        >
          CYCLE
        </div>
        <p className="text-muted" style={{ fontSize: 13, margin: "0 0 22px" }}>
          Every payment source keeps its own monthly cycle.
        </p>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-accent-700)",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}
          {notice && (
            <div className="text-muted" style={{ fontSize: 12 }}>
              {notice}
            </div>
          )}

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={busy}
            style={{ marginTop: 4 }}
          >
            {busy
              ? "Working…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 13 }} className="text-muted">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            className="tabbtn"
            style={{ color: "var(--color-accent)", fontWeight: 800 }}
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
