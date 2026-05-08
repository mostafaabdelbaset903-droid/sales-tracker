"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";
import {
  WashingMachine,
  UtensilsCrossed,
  Wind,
  Save,
  Loader2,
  Check,
  Info,
  Tv,
} from "lucide-react";

interface SettingsManagerProps {
  settings: Settings;
  salesPerson: string;
  targetMonth: string;
}

export function SettingsManager({
  settings,
  salesPerson,
  targetMonth,
}: SettingsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    washing_target: settings.washing_target?.toString() || "0",
    washing_bonus: settings.washing_bonus?.toString() || "0",
    kitchen_target: settings.kitchen_target?.toString() || "0",
    kitchen_bonus: settings.kitchen_bonus?.toString() || "0",
    ac_target: settings.ac_target?.toString() || "0",
    entertainment_target: settings.entertainment_target?.toString() || "0",
    entertainment_bonus: settings.entertainment_bonus?.toString() || "0",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const supabase = createClient();

      const settingsId = `${salesPerson}-${targetMonth}`;

      const { error: updateError } = await supabase.from("settings").upsert(
        {
          id: settingsId,
          sales_person: salesPerson,
          target_month: targetMonth,

          washing_target: Number(formData.washing_target) || 0,
          washing_bonus: Number(formData.washing_bonus) || 0,

          kitchen_target: Number(formData.kitchen_target) || 0,
          kitchen_bonus: Number(formData.kitchen_bonus) || 0,

          ac_target: Number(formData.ac_target) || 0,

          entertainment_target: Number(formData.entertainment_target) || 0,
          entertainment_bonus: Number(formData.entertainment_bonus) || 0,

          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "sales_person,target_month",
        }
      );

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center gap-2 text-sm">
          <Check className="w-4 h-4" />
          Settings saved successfully for {salesPerson} - {targetMonth}!
        </div>
      )}

      <div className="bg-primary/10 rounded-xl border border-primary/20 p-4">
        <p className="text-sm text-foreground">
          You are editing settings for:{" "}
          <span className="font-bold text-primary">{salesPerson}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Target month:{" "}
          <span className="font-semibold text-foreground">{targetMonth}</span>
        </p>
      </div>

      {/* Bonus Rules Info */}
      <div className="bg-accent/50 rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-2">
              Bonus Calculation Rules
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                Achievement &ge; 100%:{" "}
                <span className="text-emerald-600 font-medium">
                  100% of bonus
                </span>
              </li>
              <li>
                Achievement &ge; 90%:{" "}
                <span className="text-blue-600 font-medium">70% of bonus</span>
              </li>
              <li>
                Achievement &ge; 80%:{" "}
                <span className="text-amber-600 font-medium">60% of bonus</span>
              </li>
              <li>
                Achievement &lt; 80%:{" "}
                <span className="text-red-500 font-medium">No bonus</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              This rule applies to Washing, Kitchen, and Entertainment
              categories.
            </p>
          </div>
        </div>
      </div>

      {/* Washing Category */}
      <div className="bg-card rounded-xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <WashingMachine className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Washing Category
              </h2>
              <p className="text-xs text-muted-foreground">
                Washing Machine, Dryer, Vacuum
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Monthly Target (EGP)
            </label>
            <input
              type="number"
              min="0"
              value={formData.washing_target}
              onChange={(e) =>
                setFormData({ ...formData, washing_target: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Full Bonus (EGP)
            </label>
            <input
              type="number"
              min="0"
              value={formData.washing_bonus}
              onChange={(e) =>
                setFormData({ ...formData, washing_bonus: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Kitchen Category */}
      <div className="bg-card rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Kitchen Category
              </h2>
              <p className="text-xs text-muted-foreground">
                Refrigerator, Built-in, Microwave
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Monthly Target (EGP)
            </label>
            <input
              type="number"
              min="0"
              value={formData.kitchen_target}
              onChange={(e) =>
                setFormData({ ...formData, kitchen_target: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Full Bonus (EGP)
            </label>
            <input
              type="number"
              min="0"
              value={formData.kitchen_bonus}
              onChange={(e) =>
                setFormData({ ...formData, kitchen_bonus: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Entertainment Category */}
      <div className="bg-card rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <Tv className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Entertainment Category
              </h2>
              <p className="text-xs text-muted-foreground">TV, AV</p>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Monthly Target (EGP)
            </label>
            <input
              type="number"
              min="0"
              value={formData.entertainment_target}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entertainment_target: e.target.value,
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Full Bonus (EGP)
            </label>
            <input
              type="number"
              min="0"
              value={formData.entertainment_bonus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entertainment_bonus: e.target.value,
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Air Conditioning Category */}
      <div className="bg-card rounded-xl border border-cyan-200 shadow-sm overflow-hidden">
        <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
              <Wind className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Air Conditioning Category
              </h2>
              <p className="text-xs text-muted-foreground">
                Air Conditioner tracked by units. Air Purifier incentive is
                counted separately.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Monthly Target (Units)
            </label>
            <input
              type="number"
              min="0"
              value={formData.ac_target}
              onChange={(e) =>
                setFormData({ ...formData, ac_target: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              AC bonus uses tiered quantity achievement. Air Purifier does not
              increase AC units target.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Settings for {salesPerson} - {targetMonth}
          </>
        )}
      </button>
    </form>
  );
}
