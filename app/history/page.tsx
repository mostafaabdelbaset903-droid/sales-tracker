import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { SalesHistoryTable } from "@/components/sales-history-table";
import type { Model, SaleWithModel } from "@/lib/types";

interface HistoryPageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Default date range: current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const fromDate = params.from || firstDayOfMonth;
  const toDate = params.to || todayStr;

  // Fetch sales with model info
  const { data: salesData } = await supabase
    .from("sales")
    .select(`
      *,
      model:models(*)
    `)
    .gte("sale_date", fromDate)
    .lte("sale_date", toDate)
    .order("sale_date", { ascending: false });

  const sales: SaleWithModel[] = (salesData || []).map((sale) => ({
    ...sale,
    model: sale.model,
  }));

  // Fetch all active models for the edit form
  const { data: modelsData } = await supabase
    .from("models")
    .select("*")
    .order("model_name");

  const models: Model[] = modelsData || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Sales History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your sales records
          </p>
        </div>

        <SalesHistoryTable
          sales={sales}
          models={models}
          defaultFromDate={fromDate}
          defaultToDate={toDate}
        />
      </main>
    </div>
  );
}
