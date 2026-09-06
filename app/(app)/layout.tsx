import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DataProvider } from "@/components/DataProvider";
import { EditExpenseProvider } from "@/components/EditExpense";
import { TopNav, BottomTabs } from "@/components/Nav";
import { ToastHost } from "@/components/Toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DataProvider>
      <EditExpenseProvider>
        <div className="shell">
          <TopNav />
          <main className="page">{children}</main>
          <BottomTabs />
        </div>
        <ToastHost />
      </EditExpenseProvider>
    </DataProvider>
  );
}
