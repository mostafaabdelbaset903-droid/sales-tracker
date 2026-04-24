import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { AddSaleForm } from "@/components/add-sale-form";

export default async function AddSalePage() {
  const supabase = await createClient();

  // Fetch active models for the dropdown
  const { data: models } = await supabase
    .from("models")
    .select("*")
    .eq("is_active", true)
    .order("model_name");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Add New Sale</h1>
          <p className="text-muted-foreground mt-1">
            Record a new sale transaction
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <AddSaleForm models={models || []} />
        </div>
      </main>
    </div>
  );
}
