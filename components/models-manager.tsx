"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Model, SubCategory, MainCategory, InventoryAdjustment } from "@/lib/types";
import {
  SUB_CATEGORY_TO_MAIN,
  SUB_CATEGORY_LABELS,
  MAIN_CATEGORY_LABELS,
  ALL_SUB_CATEGORIES,
} from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { calculateBranchShare } from "@/lib/inventory";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Package,
  AlertTriangle,
  History,
  Boxes,
} from "lucide-react";

interface ModelsManagerProps {
  models: Model[];
}

export function ModelsManager({ models }: ModelsManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [stockModel, setStockModel] = useState<Model | null>(null);
  const [historyModel, setHistoryModel] = useState<Model | null>(null);

  // Group models by main category
  const modelsByCategory = models.reduce((acc, model) => {
    const main = SUB_CATEGORY_TO_MAIN[model.sub_category];

    if (!acc[main]) {
      acc[main] = [];
    }

    acc[main]!.push(model);
    return acc;
  }, {} as Partial<Record<MainCategory, Model[]>>);

  const handleDelete = async (modelId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("models").delete().eq("id", modelId);

    if (!error) {
      setDeleteConfirm(null);
      router.refresh();
    }
  };

  const categoryColors: Record<
    MainCategory,
    { bg: string; border: string; badge: string }
  > = {
    washing: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-500",
    },
    kitchen: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      badge: "bg-emerald-500",
    },
    ac: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      badge: "bg-cyan-500",
    },
    entertainment: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      badge: "bg-purple-500",
    },
  };

  return (
    <div className="space-y-6">
      {/* Add Model Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      {/* Models by Category */}
      {Object.entries(modelsByCategory).length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No models yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first model to start tracking sales
          </p>
        </div>
      ) : (
        Object.entries(MAIN_CATEGORY_LABELS).map(([category, label]) => {
          const mainCategory = category as MainCategory;
          const categoryModels = modelsByCategory[mainCategory] || [];

          if (categoryModels.length === 0) return null;

          const colors = categoryColors[mainCategory];

          return (
            <div
              key={category}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${colors.badge}`} />
                <h2 className="font-semibold text-foreground">{label}</h2>
                <span className="text-xs text-muted-foreground">
                  ({categoryModels.length} models)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryModels.map((model) => {
                  const outOfStock = model.current_stock <= 0;

                  return (
                    <div
                      key={model.id}
                      className={`bg-card rounded-lg border border-border p-4 shadow-sm ${
                        !model.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-foreground truncate">
                              {model.model_name}
                            </h3>

                            {!model.is_active && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                                Inactive
                              </span>
                            )}

                            {outOfStock && (
                              <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Out of stock
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            {SUB_CATEGORY_LABELS[model.sub_category]}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => setHistoryModel(model)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="View stock history"
                            title="Stock history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setEditingModel(model)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Edit model"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirm(model.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Delete model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Default Price
                          </p>
                          <p className="font-medium text-foreground">
                            {Number(model.default_price) > 0
                              ? formatCurrency(Number(model.default_price))
                              : "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Extra Incentive
                          </p>
                          <p className="font-medium text-amber-600">
                            {formatCurrency(Number(model.extra_incentive))}
                          </p>
                        </div>
                      </div>

                      {/* Stock section */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Your branch stock
                            </p>
                            <p
                              className={`font-semibold ${
                                outOfStock ? "text-destructive" : "text-foreground"
                              }`}
                            >
                              {model.current_stock} units
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {model.last_stock_update
                                ? `Updated ${new Date(
                                    model.last_stock_update
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })}`
                                : "Never updated"}
                            </p>
                          </div>

                          <button
                            onClick={() => setStockModel(model)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingModel) && (
        <ModelModal
          model={editingModel}
          onClose={() => {
            setShowAddModal(false);
            setEditingModel(null);
          }}
        />
      )}

      {/* Stock Update Modal */}
      {stockModel && (
        <StockUpdateModal model={stockModel} onClose={() => setStockModel(null)} />
      )}

      {/* Stock History Modal */}
      {historyModel && (
        <StockHistoryModal
          model={historyModel}
          onClose={() => setHistoryModel(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Delete Model?
            </h3>

            <p className="text-sm text-muted-foreground mt-2">
              This will permanently delete this model. Sales records linked to
              this model will not be affected.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 h-10 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ModelModalProps {
  model: Model | null;
  onClose: () => void;
}

function ModelModal({ model, onClose }: ModelModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    model_name: model?.model_name || "",
    sub_category: model?.sub_category || ("washing_machine" as SubCategory),
    default_price: model?.default_price?.toString() || "",
    extra_incentive: model?.extra_incentive?.toString() || "0",
    is_active: model?.is_active ?? true,
  });

  // Group sub-categories by main category for the dropdown
  const subCategoriesByMain: Record<MainCategory, SubCategory[]> = {
    washing: ALL_SUB_CATEGORIES.filter(
      (subCategory) => SUB_CATEGORY_TO_MAIN[subCategory] === "washing"
    ),
    kitchen: ALL_SUB_CATEGORIES.filter(
      (subCategory) => SUB_CATEGORY_TO_MAIN[subCategory] === "kitchen"
    ),
    ac: ALL_SUB_CATEGORIES.filter(
      (subCategory) => SUB_CATEGORY_TO_MAIN[subCategory] === "ac"
    ),
    entertainment: ALL_SUB_CATEGORIES.filter(
      (subCategory) => SUB_CATEGORY_TO_MAIN[subCategory] === "entertainment"
    ),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.model_name.trim()) {
      setError("Model name is required");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      const data = {
        model_name: formData.model_name.trim(),
        sub_category: formData.sub_category,
        default_price: Number(formData.default_price) || 0,
        extra_incentive: Number(formData.extra_incentive) || 0,
        is_active: formData.is_active,
      };

      let result;

      if (model) {
        result = await supabase.from("models").update(data).eq("id", model.id);
      } else {
        result = await supabase.from("models").insert(data);
      }

      if (result.error) {
        setError(result.error.message);
        return;
      }

      onClose();
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {model ? "Edit Model" : "Add New Model"}
          </h3>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Model Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Model Name
            </label>

            <input
              type="text"
              value={formData.model_name}
              onChange={(e) =>
                setFormData({ ...formData, model_name: e.target.value })
              }
              placeholder="e.g., GC-X257CQEW"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Sub-category */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Sub-category
            </label>

            <select
              value={formData.sub_category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sub_category: e.target.value as SubCategory,
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(subCategoriesByMain).map(([main, subCategories]) => (
                <optgroup
                  key={main}
                  label={MAIN_CATEGORY_LABELS[main as MainCategory]}
                >
                  {subCategories.map((subCategory) => (
                    <option key={subCategory} value={subCategory}>
                      {SUB_CATEGORY_LABELS[subCategory]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Price and Incentive */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Default Price (EGP)
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.default_price}
                onChange={(e) =>
                  setFormData({ ...formData, default_price: e.target.value })
                }
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Extra Incentive (EGP)
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.extra_incentive}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extra_incentive: e.target.value,
                  })
                }
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, is_active: !formData.is_active })
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${
                formData.is_active ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  formData.is_active ? "left-7" : "left-1"
                }`}
              />
            </button>

            <span className="text-sm text-foreground">
              {formData.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : model ? (
                "Save Changes"
              ) : (
                "Add Model"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface StockUpdateModalProps {
  model: Model;
  onClose: () => void;
}

/**
 * Lets you enter the company-wide total you were told about (e.g. over
 * WhatsApp) and the number of branches it's split across. It computes
 * your branch's share (floor division — you can't stock half a unit),
 * writes the new current_stock onto the model, and logs the change in
 * inventory_adjustments so you can see the trend over time.
 */
function StockUpdateModal({ model, onClose }: StockUpdateModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [reportedTotal, setReportedTotal] = useState("");
  const [branchCount, setBranchCount] = useState("5");
  const [adjustedBy, setAdjustedBy] = useState("Mostafa");

  const parsedTotal = Number(reportedTotal) || 0;
  const parsedBranches = Number(branchCount) || 0;
  const computedShare = calculateBranchShare(parsedTotal, parsedBranches);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reportedTotal || parsedTotal < 0) {
      setError("Enter the company-wide total stock figure");
      return;
    }

    if (!branchCount || parsedBranches <= 0) {
      setError("Enter a valid number of branches");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const previousStock = model.current_stock;
      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("models")
        .update({
          current_stock: computedShare,
          last_stock_update: nowIso,
        })
        .eq("id", model.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      const { error: historyError } = await supabase
        .from("inventory_adjustments")
        .insert({
          model_id: model.id,
          previous_stock: previousStock,
          new_stock: computedShare,
          branch_count: parsedBranches,
          reported_total: parsedTotal,
          adjusted_by: adjustedBy,
          adjusted_at: nowIso,
        });

      if (historyError) {
        // The stock figure itself already saved successfully; surface the
        // history-logging failure without implying the update failed.
        setError(
          `Stock updated, but history could not be logged: ${historyError.message}`
        );
        return;
      }

      onClose();
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Update Stock — {model.model_name}
          </h3>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Current branch stock:{" "}
          <span className="font-medium text-foreground">
            {model.current_stock} units
          </span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Company-wide total
              </label>
              <input
                type="number"
                min="0"
                value={reportedTotal}
                onChange={(e) => setReportedTotal(e.target.value)}
                placeholder="e.g., 40"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Number of branches
              </label>
              <input
                type="number"
                min="1"
                value={branchCount}
                onChange={(e) => setBranchCount(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-accent/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Your branch share
            </span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {computedShare} units
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Updated by
            </label>
            <select
              value={adjustedBy}
              onChange={(e) => setAdjustedBy(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Mostafa">Mostafa</option>
              <option value="Amin">Amin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Stock Update"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface StockHistoryModalProps {
  model: Model;
  onClose: () => void;
}

function StockHistoryModal({ model, onClose }: StockHistoryModalProps) {
  const [history, setHistory] = useState<InventoryAdjustment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("inventory_adjustments")
        .select("*")
        .eq("model_id", model.id)
        .order("adjusted_at", { ascending: false });

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setHistory(data || []);
    }

    load();

    return () => {
      active = false;
    };
  }, [model.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border p-6 max-w-lg w-full shadow-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Stock History — {model.model_name}
          </h3>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {history === null ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No stock updates recorded yet for this model.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const diff = entry.new_stock - entry.previous_stock;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {entry.previous_stock} → {entry.new_stock} units
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.adjusted_at).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                        {entry.adjusted_by ? ` · ${entry.adjusted_by}` : ""}
                        {entry.reported_total != null
                          ? ` · ${entry.reported_total} ÷ ${entry.branch_count} branches`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        diff >= 0 ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {diff >= 0 ? "+" : ""}
                      {diff}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
