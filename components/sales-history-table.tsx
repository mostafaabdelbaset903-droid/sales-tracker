"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Model, SaleWithModel } from "@/lib/types";
import { SUB_CATEGORY_TO_MAIN, SUB_CATEGORY_LABELS, MAIN_CATEGORY_LABELS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { Pencil, Trash2, Search, Loader2, X } from "lucide-react";

interface SalesHistoryTableProps {
  sales: SaleWithModel[];
  models: Model[];
  defaultFromDate: string;
  defaultToDate: string;
}

export function SalesHistoryTable({
  sales,
  models,
  defaultFromDate,
  defaultToDate,
}: SalesHistoryTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [editingSale, setEditingSale] = useState<SaleWithModel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleFilter = () => {
    startTransition(() => {
      router.push(`/history?from=${fromDate}&to=${toDate}`);
    });
  };

  const handleEdit = async (saleData: Partial<SaleWithModel>) => {
    if (!editingSale) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("sales")
      .update({
        sale_date: saleData.sale_date,
        model_id: saleData.model_id,
        quantity: saleData.quantity,
        selling_value: saleData.selling_value,
        notes: saleData.notes,
      })
      .eq("id", editingSale.id);

    if (!error) {
      setEditingSale(null);
      router.refresh();
    }
  };

  const handleDelete = async (saleId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("sales").delete().eq("id", saleId);

    if (!error) {
      setDeleteConfirm(null);
      router.refresh();
    }
  };

  // Calculate totals by category
  const totalsByCategory = sales.reduce((acc, sale) => {
    const mainCat = SUB_CATEGORY_TO_MAIN[sale.model.sub_category];
    if (!acc[mainCat]) {
      acc[mainCat] = { value: 0, units: 0, incentive: 0 };
    }
    acc[mainCat].value += Number(sale.selling_value);
    acc[mainCat].units += sale.quantity;
    acc[mainCat].incentive += Number(sale.model.extra_incentive) * sale.quantity;
    return acc;
  }, {} as Record<string, { value: number; units: number; incentive: number }>);

  const totalValue = sales.reduce((sum, sale) => sum + Number(sale.selling_value), 0);
  const totalIncentive = sales.reduce(
    (sum, sale) => sum + (Number(sale.model.extra_incentive) * sale.quantity),
    0
  );

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button
            onClick={handleFilter}
            disabled={isPending}
            className="h-9 self-end px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Filter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Sales Value</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Transactions</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {sales.length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Units</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {sales.reduce((sum, s) => sum + s.quantity, 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Incentives</p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalIncentive)}
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Model
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Category
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                  Qty
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                  Value
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                  Incentive
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No sales found for this period
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const mainCat = SUB_CATEGORY_TO_MAIN[sale.model.sub_category];
                  const isAC = mainCat === "ac";
                  return (
                    <tr key={sale.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">
                          {sale.model.model_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {SUB_CATEGORY_LABELS[sale.model.sub_category]}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          mainCat === 'washing' 
                            ? 'bg-blue-100 text-blue-700' 
                            : mainCat === 'kitchen' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {MAIN_CATEGORY_LABELS[mainCat]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground text-right">
                        {sale.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground text-right">
                        {isAC ? "-" : formatCurrency(Number(sale.selling_value))}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-600 text-right">
                        {formatCurrency(Number(sale.model.extra_incentive) * sale.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingSale(sale)}
                            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(sale.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          models={models}
          onSave={handleEdit}
          onClose={() => setEditingSale(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Delete Sale?
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. Are you sure you want to delete this
              sale?
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

interface EditSaleModalProps {
  sale: SaleWithModel;
  models: Model[];
  onSave: (data: Partial<SaleWithModel>) => void;
  onClose: () => void;
}

function EditSaleModal({ sale, models, onSave, onClose }: EditSaleModalProps) {
  const [formData, setFormData] = useState({
    sale_date: sale.sale_date,
    model_id: sale.model_id,
    quantity: sale.quantity,
    selling_value: sale.selling_value.toString(),
    notes: sale.notes || "",
  });

  const selectedModel = models.find((m) => m.id === formData.model_id);
  const mainCategory = selectedModel ? SUB_CATEGORY_TO_MAIN[selectedModel.sub_category] : null;
  const isAC = mainCategory === "ac";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      sale_date: formData.sale_date,
      model_id: formData.model_id,
      quantity: formData.quantity,
      selling_value: isAC ? 0 : Number(formData.selling_value),
      notes: formData.notes || null,
    });
  };

  // Group models by main category
  const groupedModels = models.reduce((acc, model) => {
    const main = SUB_CATEGORY_TO_MAIN[model.sub_category];
    if (!acc[main]) acc[main] = [];
    acc[main].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Edit Sale</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Date
              </label>
              <input
                type="date"
                value={formData.sale_date}
                onChange={(e) =>
                  setFormData({ ...formData, sale_date: e.target.value })
                }
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Model
            </label>
            <select
              value={formData.model_id}
              onChange={(e) =>
                setFormData({ ...formData, model_id: e.target.value })
              }
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(groupedModels).map(([category, categoryModels]) => (
                <optgroup key={category} label={MAIN_CATEGORY_LABELS[category as keyof typeof MAIN_CATEGORY_LABELS]}>
                  {categoryModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.model_name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {!isAC && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Selling Value (EGP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_value}
                onChange={(e) =>
                  setFormData({ ...formData, selling_value: e.target.value })
                }
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
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
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
