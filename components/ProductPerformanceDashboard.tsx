"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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
    ["tv", "television", "oled", "qned", "nano", "uhd", "av", "soundbar"].includes(
      normalizedSubCategory
    )
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
        .select("id, model_name, category, sub_category")

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

          return {
            id: sale.id,
            sale_date: sale.sale_date || sale.date || "",
            sales_person: sale.sales_person || "Unknown",
            quantity: Number(sale.quantity) || 0,
            selling_value: Number(sale.selling_value) || 0,
            extra_incentive: Number(sale.extra_incentive) || 0,
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

  if (loading) {
    return (
      <div className="p-6 text-foreground">
        Loading product performance...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 text-foreground md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Product Performance</h1>
        <p className="text-sm text-muted-foreground">
          Track sell-out by model, category, value, quantity, and last sold date.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-5">
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setSelectedSubCategory("All")
            }}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
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
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
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
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
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
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-medium">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Value" value={formatCurrency(totalValue)} />
        <SummaryCard title="Total Quantity" value={String(totalQuantity)} />
        <SummaryCard
          title="Models Sold"
          value={String(productPerformance.length)}
        />
        <SummaryCard
          title="Extra Incentive"
          value={formatCurrency(totalExtraIncentive)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Top 3 by Value</h2>
          <ProductTable items={topThreeByValue} />
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Top 3 by Quantity</h2>
          <ProductTable items={topThreeByQuantity} />
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Bottom 3 by Value</h2>
          <ProductTable items={bottomThreeByValue} />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">All Product Performance</h2>
        <ProductTable items={productPerformance} />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">Slow Moving Items</h2>

        {slowMoving.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No slow moving items found for the selected filters.
          </p>
        ) : (
          <ProductTable items={slowMoving} />
        )}
      </div>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
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
                    {item.status}
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
    <div className="rounded-lg border bg-background p-3">
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
          {item.status}
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
