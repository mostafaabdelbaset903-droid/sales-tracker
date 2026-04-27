import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { SettingsManager } from "@/components/settings-manager";
import type { Settings } from "@/lib/types";

interface SettingsPageProps {
  searchParams?: {
    sales_person?: string;
  };
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();

  const selectedPerson = searchParams?.sales_person || "Mostafa";

  // Fetch settings for selected person
  const { data: settingsData } = await supabase
    .from("settings")
    .select("*")
    .eq("sales_person", selectedPerson)
    .single();

  const settings: Settings = settingsData || {
    id: selectedPerson === "Amin" ? 2 : 1,
    washing_target: 0,
    washing_bonus: 0,
    kitchen_target: 0,
    kitchen_bonus: 0,
    ac_target: 0,
    entertainment_target: 0,
    entertainment_bonus: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const people = ["Mostafa", "Amin"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure targets and bonuses for each person
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {people.map((person) => {
              const href = `/settings?sales_person=${encodeURIComponent(person)}`;
              const isActive = selectedPerson === person;

              return (
                <Link
                  key={person}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-accent"
                  }`}
                >
                  {person}
                </Link>
              );
            })}
          </div>
        </div>

        <SettingsManager settings={settings} />
      </main>
    </div>
  );
}
