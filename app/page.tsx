import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { DashboardContent } from "@/components/dashboard-content";
import type { Settings, SaleWithModel } from "@/lib/types";
import { getMonthDateRange } from "@/lib/calculations";

interface DashboardPageProps {
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

function getMonthInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getDateFromMonthParam(monthParam?: string): Date {
  if (!monthParam) return new Date();

  const [year, month] = monthParam.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return new Date();
  }

  return new Date(year, month - 1, 1);
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();

  const params = await searchParams;

  const selectedPerson = params?.sales_person || "All";
  const selectedDate = getDateFromMonthParam(params?.month);
  const selectedMonth = getMonthInputValue(selectedDate);

  const { start, end } = getMonthDateRange(selectedDate);

  let settings: Settings = defaultSettings;

  if (selectedPerson === "All") {
    const { data: allSettings } = await supabase
      .from("settings")
      .select("*")
      .eq("target_month", selectedMonth);

    settings = {
      ...defaultSettings,
      washing_target: (allSettings || []).reduce(
        (sum, s) => sum + Number(s.washing_target || 0),
        0
      ),
      washing_bonus: (allSettings || []).reduce(
        (sum, s) => sum + Number(s.washing_bonus || 0),
        0
      ),
      kitchen_target: (allSettings || []).reduce(
        (sum, s) => sum + Number(s.kitchen_target || 0),
        0
      ),
      kitchen_bonus: (allSettings || []).reduce(
        (sum, s) => sum + Number(s.kitchen_bonus || 0),
        0
      ),
      ac_target: (allSettings || []).reduce(
        (sum, s) => sum + Number(s.ac_target || 0),
        0
      ),
      entertainment_target: (allSettings || []).reduce(
        (sum, s) => sum + Number(s.entertainment_target || 0),
        0
      ),
      entertainment_bonus: (allSettings || []).reduce(
        (sum, s) => sum + Number(s.entertainment_bonus || 0),
        0
      ),
    };
  } else {
    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .eq("sales_person", selectedPerson)
      .eq("target_month", selectedMonth)
      .maybeSingle();

    settings = settingsData || {
      ...defaultSettings,
      id: selectedPerson === "Amin" ? 2 : 1,
    };
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

  const currentMonthLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

          <p className="text-muted-foreground mt-1">
            Viewing results for:{" "}
            <span className="font-semibold text-foreground">
              {selectedPerson}
            </span>{" "}
            —{" "}
            <span className="font-semibold text-foreground">
              {currentMonthLabel}
            </span>
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {people.map((person) => {
              const href =
                person === "All"
                  ? `/?month=${selectedMonth}`
                  : `/?sales_person=${encodeURIComponent(
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

          <form
            method="GET"
            className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            {selectedPerson !== "All" && (
              <input
                type="hidden"
                name="sales_person"
                value={selectedPerson}
              />
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Select Month
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
              href={
                selectedPerson === "All"
                  ? "/"
                  : `/?sales_person=${encodeURIComponent(selectedPerson)}`
              }
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium flex items-center justify-center hover:bg-accent transition-colors"
            >
              Current Month
            </a>
          </form>
        </div>

        <DashboardContent sales={sales} settings={settings} />
      </main>
    </div>
  );
}
