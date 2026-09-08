"use client";

import { SourceForm } from "@/components/SourceForm";
import { useData } from "@/components/DataProvider";

export default function NewSourcePage() {
  const { loading } = useData();
  if (loading) return <p className="text-muted">Loading…</p>;
  return <SourceForm />;
}
