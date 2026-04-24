import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { DashboardContent } from "@/components/dashboard-content";
import type { Settings, SaleWithModel } from "@/lib/types";
import { getMonthDateRange } from "@/lib/calculations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { start, end } = getMonthDateRange();

  // Fetch settings
  const { data: settingsData } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  const settings: Settings = settingsData || {
    id: 1,
    washing_target: 100000,
    washing_bonus: 3500,
    kitchen_target: 100000,
    kitchen_bonus: 2500,
    ac_target: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Fetch monthly sales with model data
  const { data: salesData } = await supabase
    .from("sales")
    .select(`
      *,
      model:models(*)
    `)
    .gte("sale_date", start)
    .lte("sale_date", end)
    .order("sale_date", { ascending: false });

  const sales: SaleWithModel[] = (salesData || []).map((sale) => ({
    ...sale,
    model: sale.model,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <DashboardContent sales={sales} settings={settings} />
      </main>
    </div>
  );
}
