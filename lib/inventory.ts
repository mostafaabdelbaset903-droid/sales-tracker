import type {
  Model,
  SaleWithModel,
  ModelInventoryInsight,
  MainCategory,
} from "./types";
import { SUB_CATEGORY_TO_MAIN } from "./types";

/**
 * Lookback window, in days, used to compute each model's recent daily
 * sales rate. 14 days is long enough to smooth out a single slow/busy
 * day, short enough to still reflect current demand rather than the
 * whole sales history.
 */
const SALES_RATE_WINDOW_DAYS = 14;

/**
 * A model counts as "stagnant" only once it's been live for at least
 * this many days — otherwise a brand-new model would be flagged as
 * stagnant on day one simply because it hasn't sold yet.
 */
const STAGNANT_MIN_AGE_DAYS = 14;

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

/**
 * Computes a deterministic inventory insight for one model from sales
 * already fetched for the dashboard/history. Every number here is a
 * plain arithmetic result — there is no AI/LLM call in this file, by
 * design (see project discussion: rules engine, not a model, so the
 * numbers behind a restock decision are always reproducible).
 */
export function calculateModelInsight(
  model: Model,
  allSales: SaleWithModel[],
  now: Date = new Date()
): ModelInventoryInsight {
  const mainCategory: MainCategory = SUB_CATEGORY_TO_MAIN[model.sub_category];

  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - SALES_RATE_WINDOW_DAYS);

  const salesInWindow = allSales.filter(
    (sale) =>
      sale.model_id === model.id && new Date(sale.sale_date) >= windowStart
  );

  const unitsSoldInWindow = salesInWindow.reduce(
    (sum, sale) => sum + Number(sale.quantity),
    0
  );

  const dailySalesRate = unitsSoldInWindow / SALES_RATE_WINDOW_DAYS;

  const isOutOfStock = model.current_stock <= 0;

  const estimatedDaysUntilOutOfStock =
    !isOutOfStock && dailySalesRate > 0
      ? model.current_stock / dailySalesRate
      : null;

  const modelAgeDays = daysBetween(new Date(model.created_at), now);
  const isStagnant =
    modelAgeDays >= STAGNANT_MIN_AGE_DAYS &&
    unitsSoldInWindow === 0 &&
    model.current_stock > 0;

  // A restock matters most when the model both sells (so running out
  // actually costs bonus/incentive) and is currently unavailable.
  const isHighPriorityRestock = isOutOfStock && unitsSoldInWindow > 0;

  return {
    model,
    mainCategory,
    unitsSoldInWindow,
    dailySalesRate,
    estimatedDaysUntilOutOfStock,
    isOutOfStock,
    isStagnant,
    isHighPriorityRestock,
  };
}

/**
 * Runs calculateModelInsight across every model and returns the results
 * sorted with the most actionable items first: out-of-stock-and-selling
 * models, then low-runway models, then everything else.
 */
export function calculateAllInsights(
  models: Model[],
  allSales: SaleWithModel[],
  now: Date = new Date()
): ModelInventoryInsight[] {
  const insights = models.map((model) =>
    calculateModelInsight(model, allSales, now)
  );

  return insights.sort((a, b) => {
    if (a.isHighPriorityRestock !== b.isHighPriorityRestock) {
      return a.isHighPriorityRestock ? -1 : 1;
    }
    if (a.isOutOfStock !== b.isOutOfStock) {
      return a.isOutOfStock ? -1 : 1;
    }
    const aDays = a.estimatedDaysUntilOutOfStock ?? Infinity;
    const bDays = b.estimatedDaysUntilOutOfStock ?? Infinity;
    return aDays - bDays;
  });
}

/**
 * The branch-share calculation: takes the company-wide reported total
 * and the number of branches, and returns this branch's share, rounded
 * down to a whole unit (you can't stock half a washing machine).
 */
export function calculateBranchShare(
  reportedTotal: number,
  branchCount: number
): number {
  if (branchCount <= 0) return 0;
  return Math.floor(reportedTotal / branchCount);
}
