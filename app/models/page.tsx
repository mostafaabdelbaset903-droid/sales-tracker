import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { ModelsManager } from "@/components/models-manager";
import type { Model } from "@/lib/types";

export default async function ModelsPage() {
  const supabase = await createClient();

  // Fetch all models
  const { data: modelsData } = await supabase
    .from("models")
    .select("*")
    .order("is_active", { ascending: false })
    .order("model_name");

  const models: Model[] = modelsData || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Models</h1>
          <p className="text-muted-foreground mt-1">
            Manage product models and their incentives
          </p>
        </div>

        <ModelsManager models={models} />
      </main>
    </div>
  );
}
