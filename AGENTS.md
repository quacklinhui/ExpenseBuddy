<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cycle — project notes

Implementation of the `Cycle - Expense Tracker` design (Modernist design system).
See `README.md` for setup. Key facts:

- **Next.js 16 App Router.** Route protection is in `proxy.ts` (Next 16 renamed
  `middleware` → `proxy`); `app/(app)/layout.tsx` re-checks auth server-side.
- **Supabase** for auth + data. Project ref lives in `.env.local`. Tables:
  `sources`, `expenses`, `tags` — all RLS-scoped to `auth.uid()`. `seed_demo_data()`
  RPC (SECURITY INVOKER) fills a new account with sample data dated relative to now.
- **Client data store:** `components/DataProvider.tsx` holds sources/expenses/tags
  and all CRUD, mirroring the design prototype's single mutable state object.
  Screens are client components reading that context.
- **Cycle math** (per-source monthly window, spend/limit/remaining, chart bars)
  is ported verbatim from the prototype into `lib/cycle.ts`.
- **Design system:** `app/globals.css` is the Modernist `styles.css` copied in
  verbatim, plus the prototype's inline utilities and a responsive shell.
  `.hide-mobile` / `.only-mobile` (with `.mcol` / `.mrow`) toggle at 860px — never
  put an inline `display` on those containers or the class stops winning.
