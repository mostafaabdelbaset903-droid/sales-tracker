"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Model } from "@/lib/types";
import { SUB_CATEGORY_TO_MAIN, SUB_CATEGORY_LABELS, MAIN_CATEGORY_LABELS } from "@/lib/types";
import { Check, Loader2, Info } from "lucide-react";

interface AddSaleFormProps {
  models: Model[];
}

export function AddSaleForm({ models }: AddSaleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    sale_date: today,
    model_id: "",
    quantity: 1,
    selling_value: "",
    notes: "",
  });

  // Get selected model info
  const selectedModel = models.find((m) => m.id === formData.model_id);
  const mainCategory = selectedModel ? SUB_CATEGORY_TO_MAIN[selectedModel.sub_category] : null;
  const isAC = mainCategory === "ac";

  // When model changes, auto-fill default price if available
  const handleModelChange = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    setFormData({
      ...formData,
      model_id: modelId,
      selling_value: model?.default_price ? model.default_price.toString() : "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.model_id) {
      setError("Please select a model");
      return;
    }

    // For non-AC categories, selling value is required
    if (!isAC && (!formData.selling_value || Number(formData.selling_value) <= 0)) {
      setError("Please enter a valid selling value");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      const { error: insertError } = await supabase.from("sales").insert({
        sale_date: formData.sale_date,
        model_id: formData.model_id,
        quantity: formData.quantity,
        selling_value: isAC ? 0 : Number(formData.selling_value),
        notes: formData.notes || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setSuccess(true);
      // Reset form
      setFormData({
        sale_date: today,
        model_id: "",
        quantity: 1,
        selling_value: "",
        notes: "",
      });

      // Refresh the page data
      router.refresh();

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  // Group models by main category for better organization
  const groupedModels = models.reduce((acc, model) => {
    const main = SUB_CATEGORY_TO_MAIN[model.sub_category];
    if (!acc[main]) acc[main] = [];
    acc[main].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center gap-2 text-sm">
          <Check className="w-4 h-4" />
          Sale added successfully!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Date */}
        <div className="space-y-2">
          <label
            htmlFor="sale_date"
            className="block text-sm font-medium text-foreground"
          >
            Date
          </label>
          <input
            type="date"
            id="sale_date"
            value={formData.sale_date}
            onChange={(e) =>
              setFormData({ ...formData, sale_date: e.target.value })
            }
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-foreground"
          >
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
            }
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label
          htmlFor="model_id"
          className="block text-sm font-medium text-foreground"
        >
          Model
        </label>
        <select
          id="model_id"
          value={formData.model_id}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a model...</option>
          {Object.entries(groupedModels).map(([category, categoryModels]) => (
            <optgroup key={category} label={MAIN_CATEGORY_LABELS[category as keyof typeof MAIN_CATEGORY_LABELS]}>
              {categoryModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.model_name} ({SUB_CATEGORY_LABELS[model.sub_category]})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {models.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No active models found. Please add models first.
          </p>
        )}
      </div>

      {/* Category Info */}
      {selectedModel && (
        <div className="p-3 rounded-lg bg-accent/50 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {MAIN_CATEGORY_LABELS[mainCategory!]} Category
            </p>
            <p className="text-muted-foreground">
              {isAC
                ? "This category tracks units sold only."
                : "This category tracks sales value (EGP)."}
              {selectedModel.extra_incentive > 0 && (
                <span className="block text-amber-600">
                  Extra incentive: {selectedModel.extra_incentive} EGP per unit
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Selling Value - Only show for non-AC categories */}
      {!isAC && (
        <div className="space-y-2">
          <label
            htmlFor="selling_value"
            className="block text-sm font-medium text-foreground"
          >
            Selling Value (EGP)
          </label>
          <input
            type="number"
            id="selling_value"
            step="0.01"
            min="0"
            value={formData.selling_value}
            onChange={(e) =>
              setFormData({ ...formData, selling_value: e.target.value })
            }
            placeholder="0.00"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-foreground"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          placeholder="Add any notes about this sale..."
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding Sale...
          </>
        ) : (
          "Add Sale"
        )}
      </button>
    </form>
  );
}
