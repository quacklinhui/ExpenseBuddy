"use client";

import { useParams } from "next/navigation";
import { SourceForm } from "@/components/SourceForm";
import { useData } from "@/components/DataProvider";

export default function EditSourcePage() {
  const { id } = useParams<{ id: string }>();
  const { loading } = useData();
  if (loading) return <p className="text-muted">Loading…</p>;
  return <SourceForm sourceId={id} />;
}
