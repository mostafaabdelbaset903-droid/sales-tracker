import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { DashboardContent } from "@/components/dashboard-content";
import type { Settings, SaleWithModel } from "@/lib/types";
import { getMonthDateRange } from "@/lib/calculations";

interface DashboardPageProps {
  searchParams?: {
    sales_person?: string;
  };
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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const { start, end } = getMonthDateRange();

  const selectedPerson = searchParams?.sales_person || "All";

  let settings: Settings = defaultSettings;

  if (selectedPerson === "All") {
    const { data: allSettings } = await supabase
      .from("settings")
      .select("*");

    settings = {
      ...defaultSettings,
      washing_target: (allSettings || []).reduce((sum, s) => sum + Number(s.washing_target || 0), 0),
      washing_bonus: (allSettings || []).reduce((sum, s) => sum + Number(s.washing_bonus || 0), 0),
      kitchen_target: (allSettings || []).reduce((sum, s) => sum + Number(s.kitchen_target || 0), 0),
      kitchen_bonus: (allSettings || []).reduce((sum, s) => sum + Number(s.kitchen_bonus || 0), 0),
      ac_target: (allSettings || []).reduce((sum, s) => sum + Number(s.ac_target || 0), 0),
      entertainment_target: (allSettings || []).reduce((sum, s) => sum + Number(s.entertainment_target || 0), 0),
      entertainment_bonus: (allSettings || []).reduce((sum, s) => sum + Number(s.entertainment_bonus || 0), 0),
    };
  } else {
    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .eq("sales_person", selectedPerson)
      .single();

    settings = settingsData || defaultSettings;
  }

  let salesQuery = supabase
    .from("sales")
    .select(`
      *,
      model:models(*)
    `)
    .gte("sale_date", start)
    .lte("sale_date", end)
    .order("sale_date", { ascending: false });

  if (selectedPerson !== "All") {
    salesQuery = salesQuery.eq("sales_person", selectedPerson);
  }

  const { data: salesData } = await salesQuery;

  const sales: SaleWithModel[] = (salesData || []).map((sale) => ({
    ...sale,
    model: sale.model,
  }));

  const people = ["All", "Mostafa", "Amin"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Viewing results for:{" "}
            <span className="font-semibold text-foreground">{selectedPerson}</span>
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {people.map((person) => {
              const href =
                person === "All" ? "/" : `/?sales_person=${encodeURIComponent(person)}`;

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

        <DashboardContent sales={sales} settings={settings} />
      </main>
    </div>
  );
}
