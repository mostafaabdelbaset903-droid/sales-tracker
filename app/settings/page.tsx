import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { SettingsManager } from "@/components/settings-manager";
import type { Settings } from "@/lib/types";

interface SettingsPageProps {
  searchParams?: Promise<{
    sales_person?: string;
    month?: string;
  }>;
}

const defaultSettings: Settings = {
  id: 1,
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

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPersonBaseId(person: string): number {
  return person === "Amin" ? 2 : 1;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createClient();

  const params = await searchParams;

  const selectedPerson = params?.sales_person || "Mostafa";
  const selectedMonth = params?.month || getCurrentMonth();

  const { data: settingsData } = await supabase
    .from("settings")
    .select("*")
    .eq("sales_person", selectedPerson)
    .eq("target_month", selectedMonth)
    .maybeSingle();

  const settings: Settings = settingsData || {
    ...defaultSettings,
    id: getPersonBaseId(selectedPerson),
  };

  const people = ["Mostafa", "Amin"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>

          <p className="text-muted-foreground mt-1">
            Configure monthly targets and bonuses for each person
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {people.map((person) => {
              const href = `/settings?sales_person=${encodeURIComponent(
                person
              )}&month=${selectedMonth}`;

              const isActive = selectedPerson === person;

              return (
                <a
                  key={person}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-accent"
                  }`}
                >
                  {person}
                </a>
              );
            })}
          </div>

          <form method="GET" className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <input type="hidden" name="sales_person" value={selectedPerson} />

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Target Month
              </label>
              <input
                type="month"
                name="month"
                defaultValue={selectedMonth}
                className="h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View Month
            </button>

            <a
              href={`/settings?sales_person=${encodeURIComponent(
                selectedPerson
              )}&month=${getCurrentMonth()}`}
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium flex items-center justify-center hover:bg-accent transition-colors"
            >
              Current Month
            </a>
          </form>
        </div>

        <SettingsManager
          settings={settings}
          salesPerson={selectedPerson}
          targetMonth={selectedMonth}
        />
      </main>
    </div>
  );
}
