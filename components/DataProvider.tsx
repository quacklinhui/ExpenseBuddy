"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  toSource,
  toExpense,
  type Source,
  type Expense,
  type SourceRow as DbSourceRow,
  type ExpenseRow as DbExpenseRow,
} from "@/lib/types";

const DEFAULT_TAGS = [
  "Food & drink",
  "Groceries",
  "Transport",
  "Subscriptions",
  "Home",
  "Health",
  "Shopping",
];

export type Toast = {
  id: number;
  title: string;
  body: string;
  undoExpenseId?: string | null;
};

type NewExpense = {
  sourceId: string;
  ts: string;
  merchant: string;
  amount: number;
  note: string;
  tags: string[];
};

type SourceInput = {
  name: string;
  description: string;
  anchor: number;
  limit: number | null;
  currency: string;
};

type Ctx = {
  loading: boolean;
  ready: boolean;
  sources: Source[];
  expenses: Expense[];
  tags: string[];
  toast: Toast | null;
  showToast: (title: string, body: string, undoExpenseId?: string | null) => void;
  clearToast: () => void;
  addTag: (name: string) => Promise<void>;
  addExpense: (e: NewExpense) => Promise<string>;
  updateExpense: (id: string, e: Partial<NewExpense>) => Promise<void>;
  deleteExpense: (id: string, opts?: { silent?: boolean }) => Promise<void>;
  createSource: (s: SourceInput) => Promise<string>;
  updateSource: (id: string, s: SourceInput) => Promise<void>;
  archiveSource: (id: string) => Promise<void>;
  seedDemo: () => Promise<void>;
  refresh: () => Promise<void>;
};

const DataContext = createContext<Ctx | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastSeq = useRef(0);

  const load = useCallback(async () => {
    const [srcRes, expRes, tagRes] = await Promise.all([
      supabase.from("sources").select("*").eq("archived", false).order("created_at"),
      supabase.from("expenses").select("*").order("ts", { ascending: false }),
      supabase.from("tags").select("name").order("name"),
    ]);
    if (!srcRes.error && srcRes.data) {
      setSources((srcRes.data as DbSourceRow[]).map(toSource));
    }
    if (!expRes.error && expRes.data) {
      setExpenses((expRes.data as DbExpenseRow[]).map(toExpense));
    }
    const dbTags = !tagRes.error && tagRes.data ? tagRes.data.map((t) => t.name as string) : [];
    setTags(mergeTags(DEFAULT_TAGS, dbTags));
    setLoading(false);
    setReady(true);
  }, [supabase]);

  useEffect(() => {
    // Initial data fetch on mount. setState happens only after the awaited
    // network round-trip, not synchronously, so the cascading-render lint
    // heuristic doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [load]);

  const clearToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (title: string, body: string, undoExpenseId?: string | null) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      const id = ++toastSeq.current;
      setToast({ id, title, body, undoExpenseId: undoExpenseId ?? null });
      toastTimer.current = setTimeout(() => {
        setToast((t) => (t && t.id === id ? null : t));
      }, 4200);
    },
    [],
  );

  const uid = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }, [supabase]);

  const addTag = useCallback(
    async (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      setTags((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      const user = await uid();
      if (user) {
        await supabase.from("tags").upsert(
          { user_id: user, name: clean },
          { onConflict: "user_id,name", ignoreDuplicates: true },
        );
      }
    },
    [supabase, uid],
  );

  const addExpense = useCallback(
    async (e: NewExpense) => {
      const user = await uid();
      if (!user) throw new Error("not signed in");
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          user_id: user,
          source_id: e.sourceId,
          ts: new Date(e.ts).toISOString(),
          merchant: e.merchant,
          amount: e.amount,
          note: e.note,
          tags: e.tags,
        })
        .select("*")
        .single();
      if (error) throw error;
      const exp = toExpense(data as DbExpenseRow);
      setExpenses((prev) =>
        [exp, ...prev].sort((a, b) => +new Date(b.ts) - +new Date(a.ts)),
      );
      return exp.id;
    },
    [supabase, uid],
  );

  const updateExpense = useCallback(
    async (id: string, patch: Partial<NewExpense>) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.sourceId !== undefined) dbPatch.source_id = patch.sourceId;
      if (patch.ts !== undefined) dbPatch.ts = new Date(patch.ts).toISOString();
      if (patch.merchant !== undefined) dbPatch.merchant = patch.merchant;
      if (patch.amount !== undefined) dbPatch.amount = patch.amount;
      if (patch.note !== undefined) dbPatch.note = patch.note;
      if (patch.tags !== undefined) dbPatch.tags = patch.tags;
      const { data, error } = await supabase
        .from("expenses")
        .update(dbPatch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const exp = toExpense(data as DbExpenseRow);
      setExpenses((prev) =>
        prev
          .map((x) => (x.id === id ? exp : x))
          .sort((a, b) => +new Date(b.ts) - +new Date(a.ts)),
      );
    },
    [supabase],
  );

  const deleteExpense = useCallback(
    async (id: string, opts?: { silent?: boolean }) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((x) => x.id !== id));
      if (!opts?.silent) showToast("Entry removed", "That expense was undone.");
    },
    [supabase, showToast],
  );

  const createSource = useCallback(
    async (s: SourceInput) => {
      const user = await uid();
      if (!user) throw new Error("not signed in");
      const { data, error } = await supabase
        .from("sources")
        .insert({
          user_id: user,
          name: s.name.trim(),
          kind: "Card",
          description: s.description.trim(),
          anchor: s.anchor,
          limit_amount: s.limit,
          currency: s.currency,
        })
        .select("*")
        .single();
      if (error) throw error;
      const src = toSource(data as DbSourceRow);
      setSources((prev) => [...prev, src]);
      return src.id;
    },
    [supabase, uid],
  );

  const updateSource = useCallback(
    async (id: string, s: SourceInput) => {
      const { data, error } = await supabase
        .from("sources")
        .update({
          name: s.name.trim(),
          description: s.description.trim(),
          anchor: s.anchor,
          limit_amount: s.limit,
          currency: s.currency,
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const src = toSource(data as DbSourceRow);
      setSources((prev) => prev.map((x) => (x.id === id ? src : x)));
    },
    [supabase],
  );

  const archiveSource = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("sources")
        .update({ archived: true })
        .eq("id", id);
      if (error) throw error;
      setSources((prev) => prev.filter((x) => x.id !== id));
    },
    [supabase],
  );

  const seedDemo = useCallback(async () => {
    const { error } = await supabase.rpc("seed_demo_data");
    if (error) throw error;
    await load();
    router.refresh();
  }, [supabase, load, router]);

  const value: Ctx = {
    loading,
    ready,
    sources,
    expenses,
    tags,
    toast,
    showToast,
    clearToast,
    addTag,
    addExpense,
    updateExpense,
    deleteExpense,
    createSource,
    updateSource,
    archiveSource,
    seedDemo,
    refresh: load,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function mergeTags(base: string[], extra: string[]): string[] {
  const out = [...base];
  for (const t of extra) if (!out.includes(t)) out.push(t);
  return out;
}
