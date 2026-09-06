# Cycle — Expense Tracker

Track spend against **each payment source's own monthly cycle**. A card that
statements on the 5th resets on the 5th, not on the 1st. Every source carries its
own reset day (1–28), optional monthly limit, and currency.

Implementation of the `Cycle - Expense Tracker` design (Modernist design system).

## Stack

- **Next.js 16** (App Router, React 19)
- **Supabase** — Postgres + Auth (email/password), row-level security per user
- Plain CSS design system ported verbatim from the design project (`app/globals.css`)

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev
```

`.env.local` needs:

| var | where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page — the publishable / anon key |

### Database

Schema lives in Supabase migrations (`sources`, `expenses`, `tags`, all
RLS-guarded to `auth.uid()`), plus a `seed_demo_data()` RPC that fills a fresh
account with sample data dated relative to today. New sign-ups call it
automatically; existing accounts can trigger it from the empty dashboard
("Load sample data").

If email confirmation is enabled on the Supabase project, new users must confirm
before signing in. Disable it under Auth → Providers → Email for instant access.

## Routes

| path | screen |
| --- | --- |
| `/` | Dashboard — this cycle, per-source cards, combined totals |
| `/expenses` | All expenses with range / source / tag / text filters |
| `/sources` | Payment sources table |
| `/sources/[id]` | Source detail — cycle metrics, daily-spend chart, entries |
| `/sources/new`, `/sources/[id]/edit` | Source form |
| `/add` | Add expense |
| `/login` | Sign in / sign up |

Clicking any expense row opens the edit dialog (edit / delete, with undo toast).
