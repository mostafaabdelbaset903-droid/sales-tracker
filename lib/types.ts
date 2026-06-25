// Sub-category types
export type SubCategory =
  | 'washing_machine'
  | 'dryer'
  | 'vacuum'
  | 'refrigerator'
  | 'built_in'
  | 'microwave'
  | 'dishwasher'
  | 'air_conditioner'
  | 'air_purifier'
  | 'tv'
  | 'av';
// Main category types
export type MainCategory = 'washing' | 'kitchen' | 'ac' | 'entertainment';
// Map sub-categories to main categories
export const SUB_CATEGORY_TO_MAIN: Record<SubCategory, MainCategory> = {
  washing_machine: 'washing',
  dryer: 'washing',
  vacuum: 'washing',
  refrigerator: 'kitchen',
  built_in: 'kitchen',
  microwave: 'kitchen',
  dishwasher: 'kitchen',
  air_conditioner: 'ac',
  air_purifier: 'ac',
  tv: 'entertainment',
  av: 'entertainment',
};
// Sub-category display names
export const SUB_CATEGORY_LABELS: Record<SubCategory, string> = {
  washing_machine: 'Washing Machine',
  dryer: 'Dryer',
  vacuum: 'Vacuum',
  refrigerator: 'Refrigerator',
  built_in: 'Built-in',
  microwave: 'Microwave',
  dishwasher: 'Dishwasher',
  air_conditioner: 'Air Conditioner',
  air_purifier: 'Air Purifier',
  tv: 'TV',
  av: 'AV',
};
// Main category display names
export const MAIN_CATEGORY_LABELS: Record<MainCategory, string> = {
  washing: 'Washing',
  kitchen: 'Kitchen',
  ac: 'Air Conditioning',
  entertainment: 'Entertainment',
};
// Sub-categories grouped by main category
export const SUB_CATEGORIES_BY_MAIN: Record<MainCategory, SubCategory[]> = {
  washing: ['washing_machine', 'dryer', 'vacuum'],
  kitchen: ['refrigerator', 'built_in', 'microwave', 'dishwasher'],
  ac: ['air_conditioner', 'air_purifier'],
  entertainment: ['tv', 'av'],
};
// All sub-categories list
export const ALL_SUB_CATEGORIES: SubCategory[] = [
  'washing_machine',
  'dryer',
  'vacuum',
  'refrigerator',
  'built_in',
  'microwave',
  'dishwasher',
  'air_conditioner',
  'air_purifier',
  'tv',
  'av',
];
// Settings interface
export interface Settings {
  id: number;
  washing_target: number;
  washing_bonus: number;
  kitchen_target: number;
  kitchen_bonus: number;
  ac_target: number;
  entertainment_target: number;
  entertainment_bonus: number;
  created_at: string;
  updated_at: string;
}
// Model interface
export interface Model {
  id: string;
  model_name: string;
  sub_category: SubCategory;
  default_price: number;
  extra_incentive: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // --- Inventory tracking (added) ---
  // current_stock is the branch's share of company-wide stock
  // (reported total ÷ number of branches), auto-decremented by a DB
  // trigger every time a sale is inserted. It is NOT a live company-wide
  // figure — it's only as fresh as the last manual update below.
  current_stock: number;
  // Timestamp of the last time someone re-entered the total stock figure.
  // Null if it has never been set yet.
  last_stock_update: string | null;
}
// Sale interface
export interface Sale {
  id: string;
  sale_date: string;
  sales_person?: string;
  model_id: string;
  quantity: number;
  selling_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
// Sale with model details (for display)
export interface SaleWithModel extends Sale {
  model: Model;
}
// Category stats interface
export interface CategoryStats {
  category: MainCategory;
  label: string;
  total: number;
  target: number;
  achievement: number;
  bonus: number;
  bonusEarned: number;
  extraIncentive: number;
  isValueBased: boolean;
}
// Dashboard data interface
export interface DashboardData {
  washing: CategoryStats;
  kitchen: CategoryStats;
  ac: CategoryStats;
  entertainment: CategoryStats;
  totalBonus: number;
  totalExtraIncentive: number;
  grandTotal: number;
}

// ----------------------------------------------------------------
// Inventory tracking (added)
// ----------------------------------------------------------------

// One row in a model's stock-update history. Created every time someone
// re-enters the total stock figure (after dividing the company-wide count
// by the number of branches).
export interface InventoryAdjustment {
  id: string;
  model_id: string;
  previous_stock: number;
  new_stock: number;
  branch_count: number;
  reported_total: number | null;
  adjusted_by: string | null;
  adjusted_at: string;
}

// Rules-engine output for a single model — deterministic calculations
// only, no AI/LLM involved. See lib/inventory.ts for the logic that
// produces this shape.
export interface ModelInventoryInsight {
  model: Model;
  mainCategory: MainCategory;
  // Units sold in the lookback window used for the rate calculation.
  unitsSoldInWindow: number;
  // Average units sold per day over that window (0 if no sales).
  dailySalesRate: number;
  // Estimated days until current_stock reaches 0 at the current rate.
  // Null when the rate is 0 (can't divide) or stock is already <= 0.
  estimatedDaysUntilOutOfStock: number | null;
  // True once current_stock <= 0.
  isOutOfStock: boolean;
  // True when the model has had zero sales in the lookback window
  // despite having stock on hand — a "stagnant" model.
  isStagnant: boolean;
  // True when the model is a meaningful bonus contributor (has sales
  // and a non-zero extra_incentive or is in a tier-bearing category)
  // AND is out of stock — i.e. actively costing you money right now.
  isHighPriorityRestock: boolean;
}
