"use client";

import { useEffect, useRef, useState } from "react";
import type { Settings, SaleWithModel, CategoryStats } from "@/lib/types";
import {
  calculateDashboardData,
  formatCurrency,
  formatPercentage,
  calculateRemaining,
  getBonusTier,
} from "@/lib/calculations";
import { useCountUp } from "@/lib/use-count-up";
import { useSound, type SoundName } from "@/lib/use-sound";
import {
  WashingMachine,
  UtensilsCrossed,
  Wind,
  Tv,
  Gift,
  Award,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";

interface DashboardContentProps {
  sales: SaleWithModel[];
  settings: Settings;
}

const VALUE_BASED_BONUS_TIERS = [
  { percent: 80, bonus: "62.5%", tier: "low" as const },
  { percent: 90, bonus: "81.25%", tier: "mid" as const },
  { percent: 100, bonus: "100%", tier: "good" as const },
  { percent: 106, bonus: "118.75%", tier: "best" as const },
  { percent: 111, bonus: "137.5%", tier: "best" as const },
  { percent: 116, bonus: "156.25%", tier: "best" as const },
  { percent: 121, bonus: "175%", tier: "best" as const },
  { percent: 131, bonus: "193.75%", tier: "best" as const },
];

type CategoryKey = "washing" | "kitchen" | "entertainment" | "ac";

const CATEGORY_META: Record<
  CategoryKey,
  {
    icon: React.ComponentType<{ className?: string }>;
    var: string;
  }
> = {
  washing: { icon: WashingMachine, var: "washing" },
  kitchen: { icon: UtensilsCrossed, var: "kitchen" },
  entertainment: { icon: Tv, var: "entertainment" },
  ac: { icon: Wind, var: "ac" },
};

function tierColorVar(achievement: number): string {
  if (achievement >= 100) return "var(--tier-best)";
  if (achievement >= 90) return "var(--tier-good)";
  if (achievement >= 80) return "var(--tier-mid)";
  return "var(--tier-low)";
}

export function DashboardContent({ sales, settings }: DashboardContentProps) {
  const data = calculateDashboardData(sales, settings);
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const grandTotalDisplay = useCountUp(data.grandTotal);
  const { play, muted, toggleMuted } = useSound();

  return (
    <div className="relative space-y-6">
      {/* Ambient background field — slow, quiet, never competes with data */}
      <AmbientField />

      <div className="relative flex items-start justify-between animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <Sparkles className="w-5 h-5 text-primary/70" />
          </div>
          <p className="text-muted-foreground mt-1">{currentMonth} Performance</p>
        </div>

        <button
          type="button"
          onClick={() => {
            const wasMuted = muted;
            toggleMuted();
            if (wasMuted) play("click");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl glass-surface glass-edge text-muted-foreground hover:text-foreground transition-colors"
          aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
          title={muted ? "Sound off" : "Sound on"}
        >
          {muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-4">
        <CategoryCard
          categoryKey="washing"
          stats={data.washing}
          delayClass="stagger-1"
          play={play}
        />
        <CategoryCard
          categoryKey="kitchen"
          stats={data.kitchen}
          delayClass="stagger-2"
          play={play}
        />
        <CategoryCard
          categoryKey="entertainment"
          stats={data.entertainment}
          delayClass="stagger-3"
          play={play}
        />
        <CategoryCard
          categoryKey="ac"
          stats={data.ac}
          delayClass="stagger-4"
          play={play}
        />
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Washing Bonus"
          value={data.washing.bonusEarned}
          subtitle={`${getBonusTier(data.washing.achievement)} of ${formatCurrency(
            data.washing.bonus
          )}`}
          icon={Award}
          categoryKey="washing"
          delayClass="stagger-1"
          play={play}
        />
        <SummaryCard
          title="Kitchen Bonus"
          value={data.kitchen.bonusEarned}
          subtitle={`${getBonusTier(data.kitchen.achievement)} of ${formatCurrency(
            data.kitchen.bonus
          )}`}
          icon={Award}
          categoryKey="kitchen"
          delayClass="stagger-2"
          play={play}
        />
        <SummaryCard
          title="Entertainment Bonus"
          value={data.entertainment.bonusEarned}
          subtitle={`${getBonusTier(
            data.entertainment.achievement
          )} of ${formatCurrency(data.entertainment.bonus)}`}
          icon={Award}
          categoryKey="entertainment"
          delayClass="stagger-3"
          play={play}
        />
        <SummaryCard
          title="Extra Incentives"
          value={data.totalExtraIncentive}
          subtitle="From all categories"
          icon={Gift}
          categoryKey="ac"
          delayClass="stagger-4"
          play={play}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl glass-surface glass-edge p-6 animate-fade-up stagger-5 card-lift">
        <div
          className="absolute inset-0 opacity-[0.09] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 85% 20%, var(--primary), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Total Earnings
              </h2>
              <p className="text-sm text-muted-foreground">
                Bonuses + Extra Incentives
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold tracking-tight text-primary tabular-nums">
              {formatCurrency(Math.round(grandTotalDisplay))}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(data.totalBonus)} bonus +{" "}
              {formatCurrency(data.totalExtraIncentive)} incentives
            </div>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl glass-surface glass-edge p-6 animate-fade-up stagger-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Earnings Breakdown
        </h2>
        <div className="space-y-1">
          <BreakdownRow
            label="Washing Bonus"
            value={data.washing.bonusEarned}
            tier={getBonusTier(data.washing.achievement)}
            categoryKey="washing"
          />
          <BreakdownRow
            label="Kitchen Bonus"
            value={data.kitchen.bonusEarned}
            tier={getBonusTier(data.kitchen.achievement)}
            categoryKey="kitchen"
          />
          <BreakdownRow
            label="Entertainment Bonus"
            value={data.entertainment.bonusEarned}
            tier={getBonusTier(data.entertainment.achievement)}
            categoryKey="entertainment"
          />
          <BreakdownRow
            label="Washing Incentives"
            value={data.washing.extraIncentive}
            categoryKey="washing"
          />
          <BreakdownRow
            label="Kitchen Incentives"
            value={data.kitchen.extraIncentive}
            categoryKey="kitchen"
          />
          <BreakdownRow
            label="Entertainment Incentives"
            value={data.entertainment.extraIncentive}
            categoryKey="entertainment"
          />
          <BreakdownRow
            label="AC Incentives"
            value={data.ac.extraIncentive}
            categoryKey="ac"
          />

          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Grand Total</span>
              <span className="font-bold text-primary text-lg tabular-nums">
                {formatCurrency(data.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quiet animated backdrop: two large, very low-opacity glows that drift
 * slowly. Purely decorative, sits behind everything, never intercepts
 * clicks, and respects prefers-reduced-motion via the CSS animation rules.
 */
function AmbientField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full blur-3xl animate-drift-glow"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -left-32 h-[380px] w-[380px] rounded-full blur-3xl animate-drift-glow"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--cat-entertainment) 16%, transparent), transparent 70%)",
          animationDelay: "3s",
        }}
      />
    </div>
  );
}

/**
 * One-shot confetti burst, purely CSS-driven. Renders a fixed small set of
 * pieces with randomized (but deterministic per category) drift/color so it
 * never re-randomizes on re-render and never loops.
 */
function ConfettiBurst({ colorVar }: { colorVar: string }) {
  const pieces = [-26, -14, -4, 6, 16, 28];

  return (
    <div
      aria-hidden="true"
      className="absolute left-0 right-0 top-0 h-0 overflow-visible pointer-events-none"
    >
      {pieces.map((drift, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              "--drift": `${drift}px`,
              "--piece-color": colorVar,
              animationDelay: `${i * 70}ms`,
              left: `${50 + drift * 0.6}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

interface CategoryCardProps {
  categoryKey: CategoryKey;
  stats: CategoryStats;
  delayClass: string;
  play: (name: SoundName) => void;
}

function CategoryCard({ categoryKey, stats, delayClass, play }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[categoryKey];
  const Icon = meta.icon;

  const progressPercent =
    stats.target > 0 ? Math.min((stats.total / stats.target) * 100, 100) : 0;
  const progressDisplay = useCountUp(progressPercent, 1100);

  const totalDisplay = useCountUp(stats.total, 900);

  const achievementColor = tierColorVar(stats.achievement);
  const isMaxed = stats.achievement >= 131;
  const hasAchieved = stats.achievement >= 100;

  // Fire the celebratory chime once per mount/transition into achieved
  // territory — purely a presentation reaction to already-computed stats,
  // never recalculates or alters stats.achievement itself.
  const previouslyAchieved = useRef(hasAchieved);
  useEffect(() => {
    if (hasAchieved && !previouslyAchieved.current) {
      play("achievement");
    }
    previouslyAchieved.current = hasAchieved;
  }, [hasAchieved, play]);

  const remainingTiers = VALUE_BASED_BONUS_TIERS.filter(
    (tier) => stats.achievement < tier.percent
  );

  const catColorVar = `var(--cat-${meta.var})`;
  const catFgVar = `var(--cat-${meta.var}-foreground)`;

  return (
    <div
      onMouseEnter={() => play("hover")}
      className={`group relative overflow-hidden rounded-2xl glass-surface glass-edge p-5 card-lift animate-fade-up ${delayClass} ${
        hasAchieved ? "achievement-glow" : ""
      }`}
      style={hasAchieved ? ({ "--glow-color": catColorVar } as React.CSSProperties) : undefined}
    >
      {hasAchieved && <ConfettiBurst colorVar={catColorVar} />}

      {isMaxed && (
        <div
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl animate-float-soft"
          style={{ background: catColorVar }}
        />
      )}

      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ring-1 ring-white/10"
            style={{
              backgroundColor: catColorVar,
              color: catFgVar,
              boxShadow: `0 4px 14px -2px color-mix(in oklch, ${catColorVar} 55%, transparent)`,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight text-foreground">
              {stats.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {stats.isValueBased ? "Value Target" : "Unit Target"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            play(next ? "expand" : "collapse");
          }}
          className="p-1 rounded-md transition-colors hover:bg-accent"
          aria-label={expanded ? "Collapse details" : "Expand details"}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div className="relative space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.isValueBased
                ? formatCurrency(Math.round(totalDisplay))
                : `${Math.round(totalDisplay)} units`}
            </p>
            <p className="text-sm text-muted-foreground">
              of{" "}
              {stats.isValueBased
                ? formatCurrency(stats.target)
                : `${stats.target} units`}
            </p>
          </div>

          <div className="text-right">
            <p
              className="text-xl font-bold tabular-nums"
              style={{ color: achievementColor }}
            >
              {formatPercentage(stats.achievement)}
            </p>
            <p className="text-xs text-muted-foreground">Achievement</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="relative h-full rounded-full transition-[width] duration-700 ease-out overflow-hidden"
              style={{
                width: `${progressDisplay}%`,
                backgroundColor: achievementColor,
                boxShadow: `0 0 10px 0 color-mix(in oklch, ${achievementColor} 60%, transparent)`,
              }}
            >
              <span className="progress-beam" />
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span style={{ color: "var(--tier-mid)" }}>80%</span>
            <span style={{ color: "var(--tier-good)" }}>90%</span>
            <span style={{ color: "var(--tier-best)" }}>100%</span>
          </div>
        </div>

        {stats.isValueBased && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Bonus Earned</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(stats.bonusEarned)}
              <span className="text-xs text-muted-foreground ml-1">
                ({getBonusTier(stats.achievement)})
              </span>
            </span>
          </div>
        )}

        <div
          className={`grid transition-all duration-300 ease-out ${
            expanded && stats.isValueBased
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-3 border-t border-border space-y-2 text-sm">
              <p className="font-medium text-foreground mb-2">
                Remaining to reach:
              </p>

              {remainingTiers.length > 0 ? (
                remainingTiers.map((tier) => (
                  <RemainingRow
                    key={tier.percent}
                    percent={`${tier.percent}%`}
                    amount={calculateRemaining(
                      stats.total,
                      stats.target,
                      tier.percent
                    )}
                    bonus={tier.bonus}
                    colorVar={`var(--tier-${tier.tier})`}
                  />
                ))
              ) : (
                <p
                  className="font-medium flex items-center gap-1.5"
                  style={{ color: "var(--tier-best)" }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Highest tier achieved! Maximum bonus earned.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Extra Incentive</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: "var(--tier-mid)" }}
          >
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
  colorVar: string;
}

function RemainingRow({ percent, amount, bonus, colorVar }: RemainingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium" style={{ color: colorVar }}>
        {percent}
      </span>
      <span className="text-muted-foreground">
        {formatCurrency(amount)} more
        <span className="text-xs ml-1">({bonus} bonus)</span>
      </span>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  categoryKey: CategoryKey;
  delayClass: string;
  play: (name: SoundName) => void;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  categoryKey,
  delayClass,
  play,
}: SummaryCardProps) {
  const meta = CATEGORY_META[categoryKey];
  const display = useCountUp(value, 900);
  const catColorVar = `var(--cat-${meta.var})`;

  return (
    <div
      onMouseEnter={() => play("hover")}
      className={`group relative rounded-2xl glass-surface glass-edge p-5 card-lift animate-fade-up ${delayClass}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ring-1 ring-white/10"
          style={{
            backgroundColor: "color-mix(in oklch, " + catColorVar + " 16%, transparent)",
            color: catColorVar,
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {formatCurrency(Math.round(display))}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

interface BreakdownRowProps {
  label: string;
  value: number;
  tier?: string;
  categoryKey: CategoryKey;
}

function BreakdownRow({ label, value, tier, categoryKey }: BreakdownRowProps) {
  const meta = CATEGORY_META[categoryKey];
  const catColorVar = `var(--cat-${meta.var})`;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 group">
      <div className="flex items-center gap-2.5">
        <span
          className="h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-125"
          style={{
            backgroundColor: catColorVar,
            boxShadow: `0 0 6px 0 color-mix(in oklch, ${catColorVar} 70%, transparent)`,
          }}
        />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <span className="font-medium text-foreground tabular-nums">
          {formatCurrency(value)}
        </span>
        {tier && (
          <span className="text-xs text-muted-foreground ml-1">({tier})</span>
        )}
      </div>
    </div>
  );
}
