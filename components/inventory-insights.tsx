import type { Model, SaleWithModel } from "@/lib/types";
import { calculateAllInsights } from "@/lib/inventory";
import { formatCurrency } from "@/lib/calculations";
import { AlertTriangle, TrendingDown, PackageX, Gauge } from "lucide-react";

interface InventoryInsightsProps {
  models: Model[];
  sales: SaleWithModel[];
}

/**
 * Server-renderable insights panel. All numbers come from
 * calculateAllInsights (lib/inventory.ts) — deterministic arithmetic
 * over the models/sales already fetched for the page, not an AI call.
 */
export function InventoryInsights({ models, sales }: InventoryInsightsProps) {
  const insights = calculateAllInsights(models, sales);

  const activeInsights = insights.filter((i) => i.model.is_active);

  const urgent = activeInsights.filter((i) => i.isHighPriorityRestock);
  const outOfStockOnly = activeInsights.filter(
    (i) => i.isOutOfStock && !i.isHighPriorityRestock
  );
  const lowRunway = activeInsights.filter(
    (i) =>
      !i.isOutOfStock &&
      i.estimatedDaysUntilOutOfStock !== null &&
      i.estimatedDaysUntilOutOfStock <= 7
  );
  const stagnant = activeInsights.filter((i) => i.isStagnant);

  const hasAnyAlerts =
    urgent.length > 0 ||
    outOfStockOnly.length > 0 ||
    lowRunway.length > 0 ||
    stagnant.length > 0;

  if (!hasAnyAlerts) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Inventory Health
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          No urgent restock or stagnant-stock alerts right now, based on your
          last stock update and recent sales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {urgent.length > 0 && (
        <AlertGroup
          icon={AlertTriangle}
          iconColor="text-destructive"
          title="Restock now — these are selling and out of stock"
          items={urgent.map((i) => ({
            key: i.model.id,
            label: i.model.model_name,
            detail: `${i.unitsSoldInWindow} sold in the last 14 days · 0 left`,
            extra:
              i.model.extra_incentive > 0
                ? `Missing ${formatCurrency(
                    i.model.extra_incentive
                  )} incentive per unit while unavailable`
                : undefined,
          }))}
        />
      )}

      {outOfStockOnly.length > 0 && (
        <AlertGroup
          icon={PackageX}
          iconColor="text-muted-foreground"
          title="Out of stock"
          items={outOfStockOnly.map((i) => ({
            key: i.model.id,
            label: i.model.model_name,
            detail: "No recent sales, but currently shows 0 in stock",
          }))}
        />
      )}

      {lowRunway.length > 0 && (
        <AlertGroup
          icon={TrendingDown}
          iconColor="text-amber-600"
          title="Selling fast — likely to run out within a week"
          items={lowRunway.map((i) => ({
            key: i.model.id,
            label: i.model.model_name,
            detail: `~${Math.round(
              i.estimatedDaysUntilOutOfStock ?? 0
            )} days left at the current pace (${i.model.current_stock} units, ${i.dailySalesRate.toFixed(
              1
            )}/day)`,
          }))}
        />
      )}

      {stagnant.length > 0 && (
        <AlertGroup
          icon={Gauge}
          iconColor="text-blue-500"
          title="Sitting idle — no sales in the last 14 days"
          items={stagnant.map((i) => ({
            key: i.model.id,
            label: i.model.model_name,
            detail: `${i.model.current_stock} units on hand, untouched recently`,
          }))}
        />
      )}
    </div>
  );
}

interface AlertItem {
  key: string;
  label: string;
  detail: string;
  extra?: string;
}

interface AlertGroupProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  items: AlertItem[];
}

function AlertGroup({ icon: Icon, iconColor, title, items }: AlertGroupProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col gap-0.5 py-2 border-b border-border last:border-0"
          >
            <span className="text-sm font-medium text-foreground">
              {item.label}
            </span>
            <span className="text-xs text-muted-foreground">{item.detail}</span>
            {item.extra && (
              <span className="text-xs text-amber-600">{item.extra}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
