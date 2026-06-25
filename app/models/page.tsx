import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { ModelsManager } from "@/components/models-manager";
import { InventoryInsights } from "@/components/inventory-insights";
import type { Model, SaleWithModel } from "@/lib/types";

export default async function ModelsPage() {
  const supabase = await createClient();

  // Fetch all models
  const { data: modelsData } = await supabase
    .from("models")
    .select("*")
    .order("is_active", { ascending: false })
    .order("model_name");

  const models: Model[] = modelsData || [];

  // Fetch recent sales (last 30 days is plenty for the 14-day sales-rate
  // window used by the inventory rules engine) so InventoryInsights can
  // compute daily sales rates without re-querying per model.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: salesData } = await supabase
    .from("sales")
    .select(
      `
      *,
      model:models(*)
    `
    )
    .gte("sale_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("sale_date", { ascending: false });

  const recentSales: SaleWithModel[] = (salesData || []).map((sale) => ({
    ...sale,
    model: sale.model,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Models</h1>
          <p className="text-muted-foreground mt-1">
            Manage product models, incentives, and branch stock
          </p>
        </div>

        <InventoryInsights models={models} sales={recentSales} />

        <ModelsManager models={models} />
      </main>
    </div>
  );
}
