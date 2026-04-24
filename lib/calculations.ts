import type { MainCategory, Settings, SaleWithModel, CategoryStats, DashboardData } from './types';
import { SUB_CATEGORY_TO_MAIN, MAIN_CATEGORY_LABELS } from './types';

/**
 * Calculate bonus based on achievement percentage
 * Rules (for Washing and Kitchen categories):
 * - >= 100%: 100% of bonus
 * - >= 90% and < 100%: 70% of bonus
 * - >= 80% and < 90%: 60% of bonus
 * - < 80%: 0
 */
export function calculateBonusMultiplier(achievement: number): number {
  if (achievement >= 100) return 1.0;
  if (achievement >= 90) return 0.7;
  if (achievement >= 80) return 0.6;
  return 0;
}

/**
 * Get the bonus tier label based on achievement
 */
export function getBonusTier(achievement: number): string {
  if (achievement >= 100) return '100%';
  if (achievement >= 90) return '70%';
  if (achievement >= 80) return '60%';
  return '0%';
}

/**
 * Calculate remaining amount to reach a target percentage
 */
export function calculateRemaining(current: number, target: number, targetPercentage: number): number {
  const needed = (target * targetPercentage) / 100;
  return Math.max(0, needed - current);
}

/**
 * Format currency in EGP
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' EGP';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

/**
 * Calculate category statistics from sales data
 */
export function calculateCategoryStats(
  category: MainCategory,
  sales: SaleWithModel[],
  settings: Settings
): CategoryStats {
  const isValueBased = category !== 'ac';
  
  // Filter sales for this category
  const categorySales = sales.filter(
    sale => SUB_CATEGORY_TO_MAIN[sale.model.sub_category] === category
  );
  
  // Calculate total (value for washing/kitchen, quantity for AC)
  let total: number;
  if (isValueBased) {
    total = categorySales.reduce((sum, sale) => sum + Number(sale.selling_value), 0);
  } else {
    total = categorySales.reduce((sum, sale) => sum + sale.quantity, 0);
  }
  
  // Get target and bonus based on category
  let target: number;
  let bonus: number;
  
  switch (category) {
    case 'washing':
      target = Number(settings.washing_target);
      bonus = Number(settings.washing_bonus);
      break;
    case 'kitchen':
      target = Number(settings.kitchen_target);
      bonus = Number(settings.kitchen_bonus);
      break;
    case 'ac':
      target = Number(settings.ac_target);
      bonus = 0; // AC incentive system to be configured later
      break;
  }
  
  // Calculate achievement percentage
  const achievement = target > 0 ? (total / target) * 100 : 0;
  
  // Calculate bonus earned (only for value-based categories)
  let bonusEarned = 0;
  if (isValueBased) {
    const multiplier = calculateBonusMultiplier(achievement);
    bonusEarned = bonus * multiplier;
  }
  
  // Calculate extra incentive
  const extraIncentive = categorySales.reduce(
    (sum, sale) => sum + (Number(sale.model.extra_incentive) * sale.quantity),
    0
  );
  
  return {
    category,
    label: MAIN_CATEGORY_LABELS[category],
    total,
    target,
    achievement,
    bonus,
    bonusEarned,
    extraIncentive,
    isValueBased,
  };
}

/**
 * Calculate full dashboard data
 */
export function calculateDashboardData(
  sales: SaleWithModel[],
  settings: Settings
): DashboardData {
  const washing = calculateCategoryStats('washing', sales, settings);
  const kitchen = calculateCategoryStats('kitchen', sales, settings);
  const ac = calculateCategoryStats('ac', sales, settings);
  
  const totalBonus = washing.bonusEarned + kitchen.bonusEarned + ac.bonusEarned;
  const totalExtraIncentive = washing.extraIncentive + kitchen.extraIncentive + ac.extraIncentive;
  const grandTotal = totalBonus + totalExtraIncentive;
  
  return {
    washing,
    kitchen,
    ac,
    totalBonus,
    totalExtraIncentive,
    grandTotal,
  };
}

/**
 * Get month date range for filtering sales
 */
export function getMonthDateRange(date: Date = new Date()): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
