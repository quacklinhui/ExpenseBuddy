export type Source = {
  id: string;
  name: string;
  kind: string;
  anchor: number; // reset day, 1..28
  limit: number | null; // monthly limit
  currency: string;
  description: string;
  archived: boolean;
};

export type Expense = {
  id: string;
  sourceId: string;
  ts: string; // ISO / "YYYY-MM-DDTHH:mm" local
  merchant: string;
  amount: number;
  note: string;
  tags: string[];
};

/* Rows returned from Supabase (snake_case) */
export type SourceRow = {
  id: string;
  name: string;
  kind: string;
  anchor: number;
  limit_amount: string | number | null;
  currency: string;
  description: string;
  archived: boolean;
};

export type ExpenseRow = {
  id: string;
  source_id: string;
  ts: string;
  merchant: string;
  amount: string | number;
  note: string;
  tags: string[];
};

export function toSource(r: SourceRow): Source {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    anchor: r.anchor,
    limit: r.limit_amount == null ? null : Number(r.limit_amount),
    currency: r.currency,
    description: r.description ?? "",
    archived: r.archived,
  };
}

export function toExpense(r: ExpenseRow): Expense {
  return {
    id: r.id,
    sourceId: r.source_id,
    ts: r.ts,
    merchant: r.merchant ?? "",
    amount: Number(r.amount),
    note: r.note ?? "",
    tags: r.tags ?? [],
  };
}
