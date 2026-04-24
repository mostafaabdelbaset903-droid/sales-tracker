"use client";

import { useState } from "react";
import type { Settings, SaleWithModel, CategoryStats } from "@/lib/types";
import {
  calculateDashboardData,
  formatCurrency,
  formatPercentage,
  calculateRemaining,
  getBonusTier,
} from "@/lib/calculations";
import {
  WashingMachine,
  UtensilsCrossed,
  Wind,
  TrendingUp,
  Gift,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DashboardContentProps {
  sales: SaleWithModel[];
  settings: Settings;
}

export function DashboardContent({ sales, settings }: DashboardContentProps) {
  const data = calculateDashboardData(sales, settings);
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{currentMonth} Performance</p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CategoryCard
          stats={data.washing}
          icon={WashingMachine}
          color="bg-blue-500"
        />
        <CategoryCard
          stats={data.kitchen}
          icon={UtensilsCrossed}
          color="bg-emerald-500"
        />
        <CategoryCard
          stats={data.ac}
          icon={Wind}
          color="bg-cyan-500"
        />
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Washing Bonus"
          value={formatCurrency(data.washing.bonusEarned)}
          subtitle={`${getBonusTier(data.washing.achievement)} of ${formatCurrency(data.washing.bonus)}`}
          icon={Award}
          color="text-blue-500"
        />
        <SummaryCard
          title="Kitchen Bonus"
          value={formatCurrency(data.kitchen.bonusEarned)}
          subtitle={`${getBonusTier(data.kitchen.achievement)} of ${formatCurrency(data.kitchen.bonus)}`}
          icon={Award}
          color="text-emerald-500"
        />
        <SummaryCard
          title="Extra Incentives"
          value={formatCurrency(data.totalExtraIncentive)}
          subtitle="From all categories"
          icon={Gift}
          color="text-amber-500"
        />
      </div>

      {/* Grand Total */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Total Earnings</h2>
            <p className="text-sm text-muted-foreground">
              Bonuses + Extra Incentives
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(data.grandTotal)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(data.totalBonus)} bonus + {formatCurrency(data.totalExtraIncentive)} incentives
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Earnings Breakdown</h2>
        <div className="space-y-3">
          <BreakdownRow
            label="Washing Bonus"
            value={data.washing.bonusEarned}
            tier={getBonusTier(data.washing.achievement)}
          />
          <BreakdownRow
            label="Kitchen Bonus"
            value={data.kitchen.bonusEarned}
            tier={getBonusTier(data.kitchen.achievement)}
          />
          <BreakdownRow
            label="Washing Incentives"
            value={data.washing.extraIncentive}
          />
          <BreakdownRow
            label="Kitchen Incentives"
            value={data.kitchen.extraIncentive}
          />
          <BreakdownRow
            label="AC Incentives"
            value={data.ac.extraIncentive}
          />
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Grand Total</span>
              <span className="font-bold text-primary text-lg">
                {formatCurrency(data.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  stats: CategoryStats;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function CategoryCard({ stats, icon: Icon, color }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const remaining80 = calculateRemaining(stats.total, stats.target, 80);
  const remaining90 = calculateRemaining(stats.total, stats.target, 90);
  const remaining100 = calculateRemaining(stats.total, stats.target, 100);

  const progressPercent = Math.min((stats.total / stats.target) * 100, 100);
  const progressColor =
    stats.achievement >= 100
      ? "bg-emerald-500"
      : stats.achievement >= 90
      ? "bg-blue-500"
      : stats.achievement >= 80
      ? "bg-amber-500"
      : "bg-red-400";

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{stats.label}</h3>
            <p className="text-xs text-muted-foreground">
              {stats.isValueBased ? "Value Target" : "Unit Target"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-accent rounded-md transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Main Stats */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.isValueBased
                ? formatCurrency(stats.total)
                : `${stats.total} units`}
            </p>
            <p className="text-sm text-muted-foreground">
              of {stats.isValueBased
                ? formatCurrency(stats.target)
                : `${stats.target} units`}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${
              stats.achievement >= 100
                ? "text-emerald-500"
                : stats.achievement >= 80
                ? "text-amber-500"
                : "text-red-500"
            }`}>
              {formatPercentage(stats.achievement)}
            </p>
            <p className="text-xs text-muted-foreground">Achievement</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span className="text-amber-500">80%</span>
            <span className="text-blue-500">90%</span>
            <span className="text-emerald-500">100%</span>
          </div>
        </div>

        {/* Bonus Earned */}
        {stats.isValueBased && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Bonus Earned</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(stats.bonusEarned)}
              <span className="text-xs text-muted-foreground ml-1">
                ({getBonusTier(stats.achievement)})
              </span>
            </span>
          </div>
        )}

        {/* Expanded Section - Remaining Amounts */}
        {expanded && stats.isValueBased && (
          <div className="pt-3 border-t border-border space-y-2 text-sm">
            <p className="font-medium text-foreground mb-2">Remaining to reach:</p>
            {stats.achievement < 80 && (
              <RemainingRow
                percent="80%"
                amount={remaining80}
                bonus="60%"
                color="text-amber-500"
              />
            )}
            {stats.achievement < 90 && (
              <RemainingRow
                percent="90%"
                amount={remaining90}
                bonus="70%"
                color="text-blue-500"
              />
            )}
            {stats.achievement < 100 && (
              <RemainingRow
                percent="100%"
                amount={remaining100}
                bonus="100%"
                color="text-emerald-500"
              />
            )}
            {stats.achievement >= 100 && (
              <p className="text-emerald-500 font-medium">Target achieved! Full bonus earned.</p>
            )}
          </div>
        )}

        {/* Extra Incentive */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Extra Incentive</span>
          <span className="font-semibold text-amber-600">
            {formatCurrency(stats.extraIncentive)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RemainingRowProps {
  percent: string;
  amount: number;
  bonus: string;
  color: string;
}

function RemainingRow({ percent, amount, bonus, color }: RemainingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${color} font-medium`}>{percent}</span>
      <span className="text-muted-foreground">
        {formatCurrency(amount)} more
        <span className="text-xs ml-1">({bonus} bonus)</span>
      </span>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function SummaryCard({ title, value, subtitle, icon: Icon, color }: SummaryCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

interface BreakdownRowProps {
  label: string;
  value: number;
  tier?: string;
}

function BreakdownRow({ label, value, tier }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="font-medium text-foreground">{formatCurrency(value)}</span>
        {tier && <span className="text-xs text-muted-foreground ml-1">({tier})</span>}
      </div>
    </div>
  );
}
