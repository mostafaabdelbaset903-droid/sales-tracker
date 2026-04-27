// Sub-category types
export type SubCategory = 
  | 'washing_machine' 
  | 'dryer' 
  | 'vacuum'
  | 'refrigerator' 
  | 'built_in' 
  | 'microwave'
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
  kitchen: ['refrigerator', 'built_in', 'microwave'],
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
