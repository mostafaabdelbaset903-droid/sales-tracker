"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Gift,
  History,
  LayoutDashboard,
  Package,
  PackageSearch,
  PieChart,
  Plus,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react"

type SaleRow = {
  id: string
  date: string | null
  sale_date: string | null
  sales_person: string | null
  quantity: number | null
  selling_value: number | null
  extra_incentive: number | null
  model_id: string | null
}

type ModelRow = {
  id: string
  model_name: string | null
  category: string | null
  sub_category: string | null
  extra_incentive: number | null
}

type JoinedSale = {
  id: string
  sale_date: string
  sales_person: string
  quantity: number
  selling_value: number
  extra_incentive: number
  model_id: string
  model_name: string
  category: string
  sub_category: string
}

type ProductPerformance = {
  model_id: string
  model_name: string
  category: string
  sub_category: string
  total_quantity: number
  total_value: number
  total_extra_incentive: number
  percentage_of_category: number
  last_sold_date: string
  days_without_sale: number
  status: "Fast" | "Normal" | "Slow"
}

type ChartItem = {
  label: string
  value: number
  displayValue: string
  secondaryText?: string
}

type DonutItem = {
  label: string
  value: number
  percentage: number
  displayValue: string
  secondaryText?: string
  color: string
}

type ChartVariant = "value" | "quantity" | "contribution"
type SummaryVariant = "value" | "quantity" | "models" | "incentive"

const DONUT_COLORS = [
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value)
}

function getDaysWithoutSale(lastSoldDate: string) {
  const today = new Date()
  const lastDate = new Date(lastSoldDate)

  if (Number.isNaN(lastDate.getTime())) return 0

  const diffTime = today.getTime() - lastDate.getTime()
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
}

function getProductStatus(totalQuantity: number, daysWithoutSale: number) {
  if (totalQuantity >= 5 && daysWithoutSale <= 14) return "Fast"
  if (daysWithoutSale >= 30) return "Slow"
  return "Normal"
}

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
}

function inferCategory(
  category: string | null | undefined,
  subCategory: string | null | undefined
) {
  const normalizedCategory = normalizeText(category)

  if (
    normalizedCategory &&
    normalizedCategory !== "unknown" &&
    normalizedCategory !== "null"
  ) {
    return category || "Unknown"
  }

  const normalizedSubCategory = normalizeText(subCategory)

  if (
    [
      "refrigerator",
      "fridge",
      "microwave",
      "dishwasher",
      "built_in",
      "builtin",
      "built_in_oven",
      "oven",
    ].includes(normalizedSubCategory)
  ) {
    return "Kitchen"
  }

  if (
    [
      "washing_machine",
      "washing",
      "washer",
      "dryer",
      "vacuum",
      "vacuum_cleaner",
    ].includes(normalizedSubCategory)
  ) {
    return "Washing"
  }

  if (
    [
      "tv",
      "television",
      "oled",
      "qned",
      "nano",
      "uhd",
      "av",
      "soundbar",
    ].includes(normalizedSubCategory)
  ) {
    return "Entertainment"
  }

  if (
    ["air_conditioning", "air_conditioner", "ac", "split_ac"].includes(
      normalizedSubCategory
    )
  ) {
    return "Air Conditioning"
  }

  if (["air_purifier", "purifier"].includes(normalizedSubCategory)) {
    return "Air Purifier"
  }

  return "Unknown"
}

function getStatusClass(status: ProductPerformance["status"]) {
  if (status === "Fast") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
  }

  if (status === "Slow") {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
  }

  return "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
}

function getStatusLabel(status: ProductPerformance["status"]) {
  if (status === "Fast") return "Fast Moving"
  if (status === "Slow") return "Slow Moving"
  return "Normal Moving"
}

function getStatusDescription(status: ProductPerformance["status"]) {
  if (status === "Fast") {
    return "Good sell-out movement. Sold in good quantity and recently."
  }

  if (status === "Slow") {
    return "No recent sell-out. Last sale was 30 days ago or more."
  }

  return "Average sell-out movement. Needs normal follow-up."
}

function getSummaryCardStyle(variant: SummaryVariant) {
  if (variant === "value") {
    return {
      card: "border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100 dark:border-cyan-900/60 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-blue-950/40",
      icon: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    }
  }

  if (variant === "quantity") {
    return {
      card: "border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 dark:border-blue-900/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/40",
      icon: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    }
  }

  if (variant === "models") {
    return {
      card: "border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 dark:border-violet-900/60 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/40",
      icon: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    }
  }

  return {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-green-950/40",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  }
}

function getChartAccent(variant: ChartVariant) {
  if (variant === "quantity") {
    return {
      bar: "bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400",
      badge:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
      glow: "from-indigo-500/10 via-blue-500/5 to-transparent",
    }
  }

  if (variant === "contribution") {
    return {
      bar: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400",
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      glow: "from-emerald-500/10 via-teal-500/5 to-transparent",
    }
  }

  return {
    bar: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500",
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    glow: "from-cyan-500/10 via-sky-500/5 to-transparent",
  }
}

function buildDonutItems(
  rows: { label: string; value: number; secondaryText?: string }[],
  total: number
): DonutItem[] {
  return rows
    .filter((row) => row.value > 0)
    .map((row, index) => ({
      label: row.label,
      value: row.value,
      percentage: total > 0 ? (row.value / total) * 100 : 0,
      displayValue: formatCurrency(row.value),
      secondaryText: row.secondaryText,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
    }))
}

export default function ProductPerformanceDashboard() {
  const [sales, setSales] = useState<JoinedSale[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedSubCategory, setSelectedSubCategory] = useState("All")
  const [selectedSalesPerson, setSelectedSalesPerson] = useState("All")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const supabase = createClient()

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(
          "id, date, sale_date, sales_person, quantity, selling_value, extra_incentive, model_id"
        )
        .order("sale_date", { ascending: false })

      if (salesError) {
        console.error("Error loading sales:", salesError)
        setSales([])
        setLoading(false)
        return
      }

      const { data: modelsData, error: modelsError } = await supabase
        .from("models")
        .select("id, model_name, category, sub_category, extra_incentive")

      if (modelsError) {
        console.error("Error loading models:", modelsError)
        setSales([])
        setLoading(false)
        return
      }

      const modelsMap = new Map<string, ModelRow>()

      ;((modelsData as ModelRow[]) || []).forEach((model) => {
        modelsMap.set(model.id, model)
      })

      const joinedSales: JoinedSale[] = ((salesData as SaleRow[]) || []).map(
        (sale) => {
          const model = sale.model_id ? modelsMap.get(sale.model_id) : null

          const quantity = Number(sale.quantity) || 0
          const unitSellingValue = Number(sale.selling_value) || 0
          const totalSellingValue = unitSellingValue * quantity

          const unitModelExtraIncentive = Number(model?.extra_incentive) || 0
          const totalExtraIncentive = unitModelExtraIncentive * quantity

          return {
            id: sale.id,
            sale_date: sale.sale_date || sale.date || "",
            sales_person: sale.sales_person || "Unknown",
            quantity,
            selling_value: totalSellingValue,
            extra_incentive: totalExtraIncentive,
            model_id: sale.model_id || "unknown",
            model_name: model?.model_name || "Unknown Model",
            category: inferCategory(model?.category, model?.sub_category),
            sub_category: model?.sub_category || "Unknown",
          }
        }
      )

      setSales(joinedSales)
      setLoading(false)
    }

    fetchData()
  }, [])

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(sales.map((sale) => sale.category))).sort(),
    ]
  }, [sales])

  const subCategories = useMemo(() => {
    const filtered =
      selectedCategory === "All"
        ? sales
        : sales.filter((sale) => sale.category === selectedCategory)

    return [
      "All",
      ...Array.from(new Set(filtered.map((sale) => sale.sub_category))).sort(),
    ]
  }, [sales, selectedCategory])

  const salesPeople = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(sales.map((sale) => sale.sales_person))).sort(),
    ]
  }, [sales])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.sale_date)

      const matchCategory =
        selectedCategory === "All" || sale.category === selectedCategory

      const matchSubCategory =
        selectedSubCategory === "All" ||
        sale.sub_category === selectedSubCategory

      const matchSalesPerson =
        selectedSalesPerson === "All" ||
        sale.sales_person === selectedSalesPerson

      const matchFromDate = !fromDate || saleDate >= new Date(fromDate)

      const matchToDate = !toDate || saleDate <= new Date(toDate)

      return (
        matchCategory &&
        matchSubCategory &&
        matchSalesPerson &&
        matchFromDate &&
        matchToDate
      )
    })
  }, [
    sales,
    selectedCategory,
    selectedSubCategory,
    selectedSalesPerson,
    fromDate,
    toDate,
  ])

  const productPerformance = useMemo<ProductPerformance[]>(() => {
    const grouped = new Map<string, ProductPerformance>()
    const categoryTotals = new Map<string, number>()

    filteredSales.forEach((sale) => {
      categoryTotals.set(
        sale.category,
        (categoryTotals.get(sale.category) || 0) + sale.selling_value
      )
    })

    filteredSales.forEach((sale) => {
      const key = sale.model_id
      const existing = grouped.get(key)

      if (!existing) {
        const daysWithoutSale = getDaysWithoutSale(sale.sale_date)

        grouped.set(key, {
          model_id: sale.model_id,
          model_name: sale.model_name,
          category: sale.category,
          sub_category: sale.sub_category,
          total_quantity: sale.quantity,
          total_value: sale.selling_value,
          total_extra_incentive: sale.extra_incentive,
          percentage_of_category: 0,
          last_sold_date: sale.sale_date,
          days_without_sale: daysWithoutSale,
          status: getProductStatus(sale.quantity, daysWithoutSale),
        })
      } else {
        existing.total_quantity += sale.quantity
        existing.total_value += sale.selling_value
        existing.total_extra_incentive += sale.extra_incentive

        if (new Date(sale.sale_date) > new Date(existing.last_sold_date)) {
          existing.last_sold_date = sale.sale_date
          existing.days_without_sale = getDaysWithoutSale(sale.sale_date)
        }

        existing.status = getProductStatus(
          existing.total_quantity,
          existing.days_without_sale
        )
      }
    })

    return Array.from(grouped.values())
      .map((item) => {
        const categoryTotal = categoryTotals.get(item.category) || 0

        return {
          ...item,
          percentage_of_category:
            categoryTotal > 0 ? (item.total_value / categoryTotal) * 100 : 0,
        }
      })
      .sort((a, b) => b.total_value - a.total_value)
  }, [filteredSales])

  const topThreeByValue = productPerformance.slice(0, 3)

  const topThreeByQuantity = [...productPerformance]
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 3)

  const bottomThreeByValue = [...productPerformance]
    .filter((item) => item.total_value > 0)
    .sort((a, b) => a.total_value - b.total_value)
    .slice(0, 3)

  const slowMoving = [...productPerformance]
    .filter((item) => item.status === "Slow")
    .sort((a, b) => b.days_without_sale - a.days_without_sale)

  const totalValue = productPerformance.reduce(
    (sum, item) => sum + item.total_value,
    0
  )

  const totalQuantity = productPerformance.reduce(
    (sum, item) => sum + item.total_quantity,
    0
  )

  const totalExtraIncentive = productPerformance.reduce(
    (sum, item) => sum + item.total_extra_incentive,
    0
  )

  const topFiveValueChart: ChartItem[] = productPerformance
    .slice(0, 5)
    .map((item) => ({
      label: item.model_name,
      value: item.total_value,
      displayValue: formatCurrency(item.total_value),
      secondaryText: `${item.category} / ${item.sub_category}`,
    }))

  const topFiveQuantityChart: ChartItem[] = [...productPerformance]
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 5)
    .map((item) => ({
      label: item.model_name,
      value: item.total_quantity,
      displayValue: `${item.total_quantity} units`,
      secondaryText: `${item.category} / ${item.sub_category}`,
    }))

  const subCategoryChart: ChartItem[] = Array.from(
    productPerformance.reduce((map, item) => {
      const existing = map.get(item.sub_category) || {
        value: 0,
        quantity: 0,
      }

      map.set(item.sub_category, {
        value: existing.value + item.total_value,
        quantity: existing.quantity + item.total_quantity,
      })

      return map
    }, new Map<string, { value: number; quantity: number }>())
  )
    .map(([subCategory, data]) => ({
      label: subCategory,
      value: data.value,
      displayValue:
        totalValue > 0
          ? `${((data.value / totalValue) * 100).toFixed(1)}%`
          : "0%",
      secondaryText: `${formatCurrency(data.value)} • ${data.quantity} units`,
    }))
    .sort((a, b) => b.value - a.value)

  const categoryDonutItems = buildDonutItems(
    Array.from(
      productPerformance.reduce((map, item) => {
        const existing = map.get(item.category) || { value: 0, quantity: 0 }

        map.set(item.category, {
          value: existing.value + item.total_value,
          quantity: existing.quantity + item.total_quantity,
        })

        return map
      }, new Map<string, { value: number; quantity: number }>())
    )
      .map(([category, data]) => ({
        label: category,
        value: data.value,
        secondaryText: `${data.quantity} units`,
      }))
      .sort((a, b) => b.value - a.value),
    totalValue
  )

  const subCategoryDonutItems = buildDonutItems(
    subCategoryChart.slice(0, 6).map((item) => ({
      label: item.label,
      value: item.value,
      secondaryText: item.secondaryText,
    })),
    totalValue
  )

  const revenueLeader = productPerformance[0]
  const unitDriver = topThreeByQuantity[0]

  const pushOpportunity =
    [...productPerformance]
      .filter((item) => item.status === "Normal")
      .filter((item) => item.model_id !== revenueLeader?.model_id)
      .filter((item) => item.model_id !== unitDriver?.model_id)
      .sort((a, b) => b.total_value - a.total_value)[0] ||
    [...productPerformance]
      .filter((item) => item.model_id !== revenueLeader?.model_id)
      .filter((item) => item.model_id !== unitDriver?.model_id)
      .sort((a, b) => b.total_value - a.total_value)[0] ||
    productPerformance[1] ||
    productPerformance[0]

  const needsAttention = slowMoving[0] || bottomThreeByValue[0]

  const directionScope =
    selectedCategory === "All" ? "all categories" : selectedCategory

  const showMainCategoryChart = selectedCategory === "All"

  if (loading) {
    return (
      <div className="p-6 text-foreground">
        Loading product performance...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 text-foreground md:p-6">
      <div className="rounded-2xl border bg-gradient-to-br from-card via-card to-muted/40 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Sell-Out Analytics
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Product Performance
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track sell-out by model, category, value, quantity, and last sold
              date.
            </p>
          </div>

          <div className="rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            Live data from Supabase
          </div>
        </div>
      </div>

      <QuickNavigation />

      <div className="grid gap-4 rounded-2xl border bg-card/90 p-4 shadow-sm md:grid-cols-5">
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setSelectedSubCategory("All")
            }}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Sub Category</label>
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground"
          >
            {subCategories.map((subCategory) => (
              <option key={subCategory} value={subCategory}>
                {subCategory}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Sales Person</label>
          <select
            value={selectedSalesPerson}
            onChange={(e) => setSelectedSalesPerson(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground"
          >
            {salesPeople.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-medium">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Total Value"
          value={formatCurrency(totalValue)}
          subtitle="Sales value in selected filters"
          variant="value"
          icon={<Wallet className="h-5 w-5" />}
        />
        <SummaryCard
          title="Total Quantity"
          value={String(totalQuantity)}
          subtitle="Total units sold"
          variant="quantity"
          icon={<Boxes className="h-5 w-5" />}
        />
        <SummaryCard
          title="Models Sold"
          value={String(productPerformance.length)}
          subtitle="Active models in this view"
          variant="models"
          icon={<PackageSearch className="h-5 w-5" />}
        />
        <SummaryCard
          title="Extra Incentive"
          value={formatCurrency(totalExtraIncentive)}
          subtitle="Extra incentive from sales"
          variant="incentive"
          icon={<Gift className="h-5 w-5" />}
        />
      </div>

      <SectionHeader
        title="Sell-Out Direction"
        description={`Smart action hints based on value, quantity, and movement in ${directionScope}.`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActionDirectionCard
          title="Revenue Leader"
          value={revenueLeader?.model_name || "No data"}
          metric={
            revenueLeader
              ? formatCurrency(revenueLeader.total_value)
              : "No sales found"
          }
          action="Highest value contributor. Keep availability and display strong."
          icon={<Trophy className="h-5 w-5" />}
          tone="success"
        />

        <ActionDirectionCard
          title="Unit Driver"
          value={unitDriver?.model_name || "No data"}
          metric={
            unitDriver ? `${unitDriver.total_quantity} units sold` : "No sales found"
          }
          action="Highest quantity mover. Good item for volume and traffic."
          icon={<Target className="h-5 w-5" />}
          tone="info"
        />

        <ActionDirectionCard
          title="Push Opportunity"
          value={pushOpportunity?.model_name || "No data"}
          metric={
            pushOpportunity
              ? `${formatCurrency(pushOpportunity.total_value)} • ${pushOpportunity.status}`
              : "No opportunity found"
          }
          action="Already moving. More focus may increase total sales value."
          icon={<PackageSearch className="h-5 w-5" />}
          tone="warning"
        />

        <ActionDirectionCard
          title="Needs Attention"
          value={needsAttention?.model_name || "No data"}
          metric={
            needsAttention
              ? slowMoving.length > 0
                ? `${needsAttention.days_without_sale} days without sale`
                : `${formatCurrency(needsAttention.total_value)} low value`
              : "No issue found"
          }
          action={
            slowMoving.length > 0
              ? "Slow movement. Review display, pricing, or availability."
              : "Lowest value contributor. Check if it needs promotion or follow-up."
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <SectionHeader
        title="Visual Insights"
        description="Charts that show contribution, mix, and product ranking."
      />

      <div
        className={`grid gap-4 ${
          showMainCategoryChart ? "lg:grid-cols-2" : "lg:grid-cols-1"
        }`}
      >
        {showMainCategoryChart && (
          <DonutChartCard
            title="Main Category Contribution"
            description="Shows which main category contributes most to total sell-out value."
            items={categoryDonutItems}
            totalDisplay={formatCurrency(totalValue)}
          />
        )}

        <DonutChartCard
          title={
            selectedCategory === "All"
              ? "Sub Category Mix"
              : `${selectedCategory} Mix`
          }
          description={
            selectedCategory === "All"
              ? "Top sub-categories by sell-out value."
              : `Value split inside ${selectedCategory}.`
          }
          items={subCategoryDonutItems}
          totalDisplay={formatCurrency(totalValue)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Top 5 Models by Value"
          description="Highest selling models by EGP value."
          variant="value"
        >
          <SimpleBarChart items={topFiveValueChart} variant="value" />
        </ChartCard>

        <ChartCard
          title="Top 5 Models by Quantity"
          description="Highest selling models by units sold."
          variant="quantity"
        >
          <SimpleBarChart items={topFiveQuantityChart} variant="quantity" />
        </ChartCard>

        <ChartCard
          title="Sub Category Ranking"
          description="Ranked by value contribution."
          variant="contribution"
        >
          <SimpleBarChart items={subCategoryChart} variant="contribution" />
        </ChartCard>
      </div>

      <div className="rounded-2xl border bg-card/90 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Status Guide</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StatusGuideItem status="Fast" />
          <StatusGuideItem status="Normal" />
          <StatusGuideItem status="Slow" />
        </div>
      </div>

      <SectionHeader
        title="Top & Bottom Products"
        description="Focused tables for fastest and weakest selling models."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <DataPanel title="Top 3 by Value">
          <ProductTable items={topThreeByValue} />
        </DataPanel>

        <DataPanel title="Top 3 by Quantity">
          <ProductTable items={topThreeByQuantity} />
        </DataPanel>

        <DataPanel title="Bottom 3 by Value">
          <ProductTable items={bottomThreeByValue} />
        </DataPanel>
      </div>

      <DataPanel title="All Product Performance">
        <ProductTable items={productPerformance} />
      </DataPanel>

      <DataPanel title="Slow Moving Items">
        {slowMoving.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No slow moving items found for the selected filters.
          </p>
        ) : (
          <ProductTable items={slowMoving} />
        )}
      </DataPanel>
    </div>
  )
}

function QuickNavigation() {
  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/product-performance", label: "Analysis", icon: PieChart },
    { href: "/add-sale", label: "Add Sale", icon: Plus },
    { href: "/history", label: "History", icon: History },
    { href: "/models", label: "Models", icon: Package },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="rounded-2xl border bg-card/90 p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold">Quick Navigation</div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {links.map((item) => {
          const Icon = item.icon
          const active = item.href === "/product-performance"

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  variant,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  variant: SummaryVariant
  icon: ReactNode
}) {
  const style = getSummaryCardStyle(variant)

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${style.card}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>

        <div className={`rounded-2xl p-2 ${style.icon}`}>{icon}</div>
      </div>

      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function ActionDirectionCard({
  title,
  value,
  metric,
  action,
  icon,
  tone,
}: {
  title: string
  value: string
  metric: string
  action: string
  icon: ReactNode
  tone: "success" | "warning" | "info" | "danger"
}) {
  const styles = {
    success:
      "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning:
      "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    info: "border-sky-200 bg-sky-50/80 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
    danger:
      "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold opacity-80">{title}</p>
        <div className="rounded-xl bg-background/70 p-2">{icon}</div>
      </div>

      <p className="truncate text-xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{metric}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {action}
      </p>
    </div>
  )
}

function DonutChartCard({
  title,
  description,
  items,
  totalDisplay,
}: {
  title: string
  description: string
  items: DonutItem[]
  totalDisplay: string
}) {
  let start = 0
  const segments = items.map((item) => {
    const end = start + item.percentage
    const segment = `${item.color} ${start}% ${end}%`
    start = end
    return segment
  })

  const background =
    items.length > 0 ? `conic-gradient(${segments.join(", ")})` : undefined

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-2 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
          <PieChart className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No donut chart data found for the selected filters.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-[190px_1fr] md:items-center">
          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full p-4 shadow-inner">
            <div
              className="flex h-full w-full items-center justify-center rounded-full"
              style={{ background }}
            >
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card text-center shadow-sm">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">
                  {totalDisplay}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background/70 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.label}
                    </p>
                    {item.secondaryText && (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.secondaryText}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {item.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.displayValue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChartCard({
  title,
  description,
  variant,
  children,
}: {
  title: string
  description: string
  variant: ChartVariant
  children: ReactNode
}) {
  const accent = getChartAccent(variant)

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${accent.glow}`}
      />

      <div className="relative">
        <div className="mb-4 flex items-start gap-3">
          <div className={`rounded-2xl border p-2 ${accent.badge}`}>
            <BarChart3 className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

function SimpleBarChart({
  items,
  variant,
}: {
  items: ChartItem[]
  variant: ChartVariant
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0)
  const accent = getChartAccent(variant)

  if (items.length === 0 || maxValue === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No chart data found for the selected filters.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const widthPercent =
          maxValue > 0 ? Math.max((item.value / maxValue) * 100, 3) : 0

        return (
          <div key={`${item.label}-${index}`} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <span
                  className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${accent.badge}`}
                >
                  #{index + 1}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  {item.secondaryText && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.secondaryText}
                    </p>
                  )}
                </div>
              </div>

              <p className="shrink-0 text-sm font-bold text-foreground">
                {item.displayValue}
              </p>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${accent.bar}`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatusGuideItem({
  status,
}: {
  status: ProductPerformance["status"]
}) {
  return (
    <div className="rounded-xl border bg-background/70 p-3">
      <span
        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
          status
        )}`}
      >
        {getStatusLabel(status)}
      </span>

      <p className="mt-2 text-sm text-muted-foreground">
        {getStatusDescription(status)}
      </p>
    </div>
  )
}

function DataPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function ProductTable({ items }: { items: ProductPerformance[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No data found for the selected filters.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <ProductMobileCard key={item.model_id} item={item} />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4">Model</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Sub Category</th>
              <th className="py-2 pr-4">Qty</th>
              <th className="py-2 pr-4">Value</th>
              <th className="py-2 pr-4">Share %</th>
              <th className="py-2 pr-4">Last Sold</th>
              <th className="py-2 pr-4">Days</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.model_id} className="border-b last:border-b-0">
                <td className="py-2 pr-4 font-medium">{item.model_name}</td>
                <td className="py-2 pr-4">{item.category}</td>
                <td className="py-2 pr-4">{item.sub_category}</td>
                <td className="py-2 pr-4">{item.total_quantity}</td>
                <td className="py-2 pr-4">
                  {formatCurrency(item.total_value)}
                </td>
                <td className="py-2 pr-4">
                  {item.percentage_of_category.toFixed(1)}%
                </td>
                <td className="py-2 pr-4">{item.last_sold_date}</td>
                <td className="py-2 pr-4">{item.days_without_sale}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ProductMobileCard({ item }: { item: ProductPerformance }) {
  return (
    <div className="rounded-xl border bg-background/80 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{item.model_name}</p>
          <p className="text-xs text-muted-foreground">
            {item.category} / {item.sub_category}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
            item.status
          )}`}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <MobileMetric label="Qty" value={String(item.total_quantity)} />
        <MobileMetric label="Value" value={formatCurrency(item.total_value)} />
        <MobileMetric
          label="Share"
          value={`${item.percentage_of_category.toFixed(1)}%`}
        />
        <MobileMetric label="Days" value={String(item.days_without_sale)} />
        <MobileMetric label="Last Sold" value={item.last_sold_date} />
        <MobileMetric
          label="Extra Incentive"
          value={formatCurrency(item.total_extra_incentive)}
        />
      </div>
    </div>
  )
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}
