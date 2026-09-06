"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", match: (p: string) => p === "/" },
  { href: "/expenses", label: "Expenses", match: (p: string) => p.startsWith("/expenses") },
  {
    href: "/sources",
    label: "Payment sources",
    match: (p: string) => p.startsWith("/sources"),
  },
];

const TABS = [
  { href: "/", label: "HOME", match: (p: string) => p === "/" },
  { href: "/expenses", label: "EXPENSES", match: (p: string) => p.startsWith("/expenses") },
  { href: "/sources", label: "SOURCES", match: (p: string) => p.startsWith("/sources") },
];

export function TopNav() {
  const path = usePathname();
  return (
    <div className="nav topnav">
      <span className="nav-brand">CYCLE</span>
      <div className="topnav-links">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={l.match(path) ? "page" : undefined}
          >
            {l.label}
          </Link>
        ))}
        <Link className="btn btn-primary" href="/add">
          + Add expense
        </Link>
        <form action="/auth/signout" method="post" style={{ display: "flex" }}>
          <button
            className="tabbtn"
            type="submit"
            style={{ fontSize: 13 }}
            title="Sign out"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function BottomTabs() {
  const path = usePathname();
  return (
    <nav className="bottomtabs">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          style={{ color: t.match(path) ? "var(--color-accent)" : undefined }}
        >
          {t.label}
        </Link>
      ))}
      <Link className="tab-add" href="/add">
        + ADD
      </Link>
    </nav>
  );
}
