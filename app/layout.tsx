import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cycle — Expense Tracker",
  description:
    "Track spend against each payment source's own monthly cycle — a card that statements on the 5th resets on the 5th.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
