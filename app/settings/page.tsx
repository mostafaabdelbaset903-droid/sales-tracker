import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { SettingsManager } from "@/components/settings-manager";
import type { Settings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure targets and bonuses for each category
          </p>
        </div>

        <SettingsManager settings={settings} />
      </main>
    </div>
  );
}
