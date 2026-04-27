import type { MainCategory, Settings, SaleWithModel, CategoryStats, DashboardData } from './types';
import { SUB_CATEGORY_TO_MAIN, MAIN_CATEGORY_LABELS } from './types';

/**
 * Calculate bonus based on achievement percentage
 * Rules for Washing, Kitchen, and Entertainment:
 * - >= 100%: 100% of bonus
 * - >= 90%: 70% of bonus
 * - >= 80%: 60% of bonus
 * - < 80%: 0
 */
export function calculateBonusMultiplier(achievement: number): number {
  if (achievement >= 100) return 1.0;
  if (achievement >= 90) return 0.7;
  if (achievement >= 80) return 0.6;
  return 0;
}

/**
 * AC bonus system
 * Based on Air Conditioner quantity achievement percentage only
 */
export function calculateACBonus(achievement: number): number {
  if (achievement >= 131) return 14500;
  if (achievement >= 121) return 13000;
  if (achievement >= 116) return 11500;
  if (achievement >= 111) return 10000;
  if (achievement >= 106) return 8500;
  if (achievement >= 100) return 7000;
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
 * Get AC bonus tier label
 */
export function getACBonusTier(achievement: number): string {
  if (achievement >= 131) return '131% Tier';
  if (achievement >= 121) return '121% Tier';
  if (achievement >= 116) return '116% Tier';
  if (achievement >= 111) return '111% Tier';
  if (achievement >= 106) return '106% Tier';
  if (achievement >= 100) return '100% Tier';
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

  const categorySales = sales.filter(
    sale => SUB_CATEGORY_TO_MAIN[sale.model.sub_category] === category
  );

  let total: number;

  if (isValueBased) {
    // Washing, Kitchen, and Entertainment are value-based.
    // selling_value is the unit selling value, so multiply by quantity.
    total = categorySales.reduce(
      (sum, sale) => sum + (Number(sale.selling_value) * Number(sale.quantity)),
      0
    );
  } else {
    // AC target is quantity-based, but ONLY Air Conditioner units count toward AC target.
    // Air Purifier belongs to the AC section for extra incentive display,
    // but it does NOT count toward AC target quantity.
    total = categorySales.reduce((sum, sale) => {
      if (sale.model.sub_category === 'air_conditioner') {
        return sum + Number(sale.quantity);
      }
      return sum;
    }, 0);
  }

  let target = 0;
  let bonus = 0;

  switch (category) {
    case 'washing':
      target = Number(settings.washing_target);
      bonus = Number(settings.washing_bonus);
      break;

    case 'kitchen':
      target = Number(settings.kitchen_target);
      bonus = Number(settings.kitchen_bonus);
      break;

    case 'entertainment':
      target = Number(settings.entertainment_target);
      bonus = Number(settings.entertainment_bonus);
      break;

    case 'ac':
      target = Number(settings.ac_target);
      break;
  }

  const achievement = target > 0 ? (total / target) * 100 : 0;

  let bonusEarned = 0;

  if (category === 'ac') {
    bonusEarned = calculateACBonus(achievement);
    bonus = bonusEarned;
  } else {
    const multiplier = calculateBonusMultiplier(achievement);
    bonusEarned = bonus * multiplier;
  }

  // Extra incentive is calculated for all sales inside the category.
  // For AC section, this includes both Air Conditioner and Air Purifier.
  const extraIncentive = categorySales.reduce(
    (sum, sale) => sum + (Number(sale.model.extra_incentive) * Number(sale.quantity)),
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
  const entertainment = calculateCategoryStats('entertainment', sales, settings);

  const totalBonus =
    washing.bonusEarned +
    kitchen.bonusEarned +
    ac.bonusEarned +
    entertainment.bonusEarned;

  const totalExtraIncentive =
    washing.extraIncentive +
    kitchen.extraIncentive +
    ac.extraIncentive +
    entertainment.extraIncentive;

  const grandTotal = totalBonus + totalExtraIncentive;

  return {
    washing,
    kitchen,
    ac,
    entertainment,
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
