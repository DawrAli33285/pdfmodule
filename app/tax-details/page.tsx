"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert } from "@/components/ui/alert"
import {
  Download,
  Search,
  RefreshCw,
  Building2,
  Upload,
  Crown,
  ArrowLeft,
  Info,
  CheckCircle,
  AlertTriangle,
  Shield,
  ExternalLink,
  Calendar,
  TrendingDown,
  Receipt,
  Brain,
  Edit3,
  ChevronRight,
  BookOpen,
  Users,
  Phone,
  Star,
  Zap,
  Target,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import {
  TransactionUtils,
  type Transaction,
  type DashboardStats,
  type CategoryBreakdown,
} from "@/lib/transaction-utils"

interface TaxSummary {
  totalDeductions: number
  potentialSavings: number
  taxableIncome: number
  estimatedTax: number
  medicareLevy: number
  lmitoOffset: number
  effectiveTaxRate: number
  marginalTaxRate: number
  netTaxPayable: number
  totalIncome: number
}

interface TaxInsight {
  type: "success" | "warning" | "info" | "compliance"
  title: string
  description: string
  action?: string
  atoReference?: string
}

interface ATOTaxBracket {
  min: number
  max: number | null
  rate: number
  description: string
}

// ATO Tax Brackets for 2024-25 Financial Year
const ATO_TAX_BRACKETS_2024_25: ATOTaxBracket[] = [
  { min: 0, max: 18200, rate: 0, description: "Tax-free threshold" },
  { min: 18201, max: 45000, rate: 0.19, description: "19% tax bracket" },
  { min: 45001, max: 120000, rate: 0.325, description: "32.5% tax bracket" },
  { min: 120001, max: 180000, rate: 0.37, description: "37% tax bracket" },
  { min: 180001, max: null, rate: 0.45, description: "45% tax bracket" },
]

// ATO-Compliant Deduction Categories
const ATO_DEDUCTION_CATEGORIES = {
  "Car and travel expenses": {
    description: "Vehicle expenses, fuel, parking, tolls, public transport",
    atoGuide:
      "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/vehicle-and-travel-expenses",
  },
  "Clothing, laundry and dry-cleaning": {
    description: "Uniforms, protective clothing, occupation-specific clothing",
    atoGuide:
      "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/clothing-laundry-and-dry-cleaning-expenses",
  },
  "Self-education expenses": {
    description: "Courses, conferences, seminars, textbooks, professional development",
    atoGuide:
      "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/self-education-education-expenses",
  },
  "Home office expenses": {
    description: "Phone, internet, electricity, office equipment, stationery",
    atoGuide: "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/home-office-expenses",
  },
  "Tools and equipment": {
    description: "Work tools, equipment, software, protective items",
    atoGuide:
      "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/tools-and-equipment-expenses",
  },
  "Other work-related expenses": {
    description: "Union fees, professional memberships, subscriptions, work-related insurance",
    atoGuide:
      "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/other-work-related-deductions",
  },
  "Investment expenses": {
    description: "Investment property expenses, interest on investment loans",
    atoGuide:
      "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/investment-income-expenses",
  },
  "Gifts and donations": {
    description: "Deductible gifts to registered charities and organisations",
    atoGuide: "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/gifts-and-donations",
  },
}

export default function TaxAnalysisPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [taxInsights, setTaxInsights] = useState<TaxInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("")
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [planType, setPlanType] = useState<"ai" | "cpa" | null>(null)
  const [showTooltips, setShowTooltips] = useState(false)
  const [premiumCheckComplete, setPremiumCheckComplete] = useState(false)
  const [reviewComplete, setReviewComplete] = useState(false)

  useEffect(() => {
    checkPremiumStatus()
    checkReviewStatus()

    // Listen for sidebar state changes
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  useEffect(() => {
    if (premiumCheckComplete) {
      loadTaxDataCached()
    }
  }, [premiumCheckComplete])

  useEffect(() => {
    if (selectedFinancialYear && allTransactions.length > 0) {
      filterTransactionsByFinancialYear()
    }
  }, [selectedFinancialYear, allTransactions])

  useEffect(() => {
    if (transactions.length > 0) {
      calculateAllData()
    }
  }, [transactions, searchTerm, selectedCategory, selectedSource])

  useEffect(() => {
    if (taxSummary && taxSummary.totalDeductions > 0) {
      generateATOCompliantInsights()
    }
  }, [taxSummary, categoryBreakdown])

  const getCurrentFinancialYear = (): string => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    if (currentMonth >= 7) {
      return `FY${currentYear + 1}`
    } else {
      return `FY${currentYear}`
    }
  }

  const getFinancialYearFromDate = (dateString: string): string => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if (month >= 7) {
      return `FY${year + 1}`
    } else {
      return `FY${year}`
    }
  }

  const getAvailableFinancialYears = (transactions: Transaction[]): string[] => {
    const years = new Set<string>()

    transactions.forEach((transaction) => {
      if (transaction.date) {
        const fy = getFinancialYearFromDate(transaction.date)
        years.add(fy)
      }
    })

    return Array.from(years).sort((a, b) => {
      const yearA = Number.parseInt(a.replace("FY", ""))
      const yearB = Number.parseInt(b.replace("FY", ""))
      return yearB - yearA
    })
  }

  const filterTransactionsByFinancialYear = () => {
    if (!selectedFinancialYear || selectedFinancialYear === "all") {
      setTransactions(allTransactions)
      return
    }

    const filtered = allTransactions.filter((transaction) => {
      if (!transaction.date) return false
      const transactionFY = getFinancialYearFromDate(transaction.date)
      return transactionFY === selectedFinancialYear
    })

    setTransactions(filtered)
  }

  const checkPremiumStatus = async () => {
    try {
      const upgradeStatus = localStorage.getItem("upgrade_status")
      const plan = localStorage.getItem("plan_type") as "ai" | "cpa" | null

      if (upgradeStatus === "completed") {
        setIsPremium(true)
        setPlanType(plan)
        setPremiumCheckComplete(true)
        return
      }

      const response = await fetch("/api/auth/me", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        if (data.user?.subscription?.plan === "premium") {
          setIsPremium(true)
          setPlanType(data.user.subscription.planType || "ai")
          localStorage.setItem("upgrade_status", "completed")
          localStorage.setItem("plan_type", data.user.subscription.planType || "ai")
        } else {
          setIsPremium(false)
        }
      } else {
        setIsPremium(false)
      }
    } catch (error) {
      console.error("Error checking premium status:", error)
      setIsPremium(false)
    } finally {
      setPremiumCheckComplete(true)
    }
  }

  const checkReviewStatus = () => {
    try {
      const reviewStatus = localStorage.getItem("transaction_review_status")
      setReviewComplete(reviewStatus === "complete")
    } catch (error) {
      console.error("Error checking review status:", error)
      setReviewComplete(false)
    }
  }

  const loadTaxDataCached = async () => {
    try {
      setLoading(true)
      setDataLoading(true)
      console.log("🔄 Loading tax data with caching...")

      // Check for cached data first
      const cacheKey = "tax_analysis_cache"
      const cached = localStorage.getItem(cacheKey)

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

          if (timestamp > fiveMinutesAgo) {
            console.log("💾 Using cached tax analysis data")
            setAllTransactions(data.allTransactions)
            setAvailableFinancialYears(data.availableFinancialYears)
            setSelectedFinancialYear(data.selectedFinancialYear)
            setTaxSummary(data.taxSummary)
            setCategoryBreakdown(data.categoryBreakdown)
            setDataLoading(false)
            setLoading(false)
            return
          }
        } catch (error) {
          console.warn("⚠️ Invalid cache data, loading fresh")
        }
      }

      // Load fresh data
      const processedTransactions = await TransactionUtils.loadAllTransactions()
      setAllTransactions(processedTransactions)

      const years = getAvailableFinancialYears(processedTransactions)
      setAvailableFinancialYears(years)

      const currentFY = getCurrentFinancialYear()
      const defaultFY = years.includes(currentFY) ? currentFY : years[0] || currentFY
      setSelectedFinancialYear(defaultFY)

      // Calculate initial data for caching
      const stats = await TransactionUtils.calculateDashboardStats(processedTransactions)
      const summary = await calculateATOCompliantTaxSummary(processedTransactions, stats.totalIncome)
      const breakdown = TransactionUtils.calculateCategoryBreakdown(processedTransactions)

      setTaxSummary(summary)
      setCategoryBreakdown(breakdown)

      // Cache the data
      const cacheData = {
        allTransactions: processedTransactions,
        availableFinancialYears: years,
        selectedFinancialYear: defaultFY,
        taxSummary: summary,
        categoryBreakdown: breakdown,
      }

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: cacheData,
          timestamp: Date.now(),
        }),
      )

      console.log("✅ Tax data loaded and cached successfully")
    } catch (error) {
      console.error("❌ Error loading tax data:", error)
    } finally {
      setDataLoading(false)
      setLoading(false)
    }
  }

  const calculateAllData = async () => {
    try {
      const stats = await TransactionUtils.calculateDashboardStats(transactions)
      setDashboardStats(stats)

      const summary = await calculateATOCompliantTaxSummary(transactions, stats.totalIncome)
      setTaxSummary(summary)

      const breakdown = TransactionUtils.calculateCategoryBreakdown(transactions)
      setCategoryBreakdown(breakdown)

      filterTransactionsForDisplay()
    } catch (error) {
      console.error("Error calculating data:", error)
    }
  }

  const calculateATOTax = (taxableIncome: number): number => {
    let tax = 0
    let remainingIncome = taxableIncome

    for (const bracket of ATO_TAX_BRACKETS_2024_25) {
      if (remainingIncome <= 0) break

      const bracketMin = bracket.min
      const bracketMax = bracket.max || Number.POSITIVE_INFINITY
      const taxableInThisBracket = Math.min(remainingIncome, bracketMax - bracketMin + 1)

      if (taxableInThisBracket > 0 && remainingIncome > bracketMin) {
        const actualTaxableAmount = Math.min(
          taxableInThisBracket,
          remainingIncome - Math.max(0, bracketMin - (taxableIncome - remainingIncome)),
        )
        tax += actualTaxableAmount * bracket.rate
      }

      remainingIncome -= taxableInThisBracket
    }

    return Math.max(0, tax)
  }

  const calculateMedicareLevy = (taxableIncome: number): number => {
    const medicareThreshold = 29207
    const medicareRate = 0.02

    if (taxableIncome <= medicareThreshold) {
      return 0
    }

    const shadingThreshold = 36509
    if (taxableIncome <= shadingThreshold) {
      return Math.max(0, (taxableIncome - medicareThreshold) * 0.1)
    }

    return taxableIncome * medicareRate
  }

  const calculateLMITO = (taxableIncome: number): number => {
    if (taxableIncome <= 37000) {
      return Math.min(700, taxableIncome * 0.19)
    }

    if (taxableIncome <= 48000) {
      return 700
    }

    if (taxableIncome <= 90000) {
      return Math.max(0, 700 - (taxableIncome - 48000) * 0.05)
    }

    return 0
  }

  const calculateATOCompliantTaxSummary = async (
    processedTransactions: Transaction[],
    totalIncome: number,
  ): Promise<TaxSummary> => {
    const totalDeductions = TransactionUtils.getTotalDeductions(processedTransactions)
    const taxableIncome = Math.max(0, totalIncome - totalDeductions)

    const estimatedTax = calculateATOTax(taxableIncome)
    const medicareLevy = calculateMedicareLevy(taxableIncome)
    const lmitoOffset = calculateLMITO(taxableIncome)
    const netTaxPayable = Math.max(0, estimatedTax + medicareLevy - lmitoOffset)

    const marginalTaxRate = await TransactionUtils.getUserTaxRate()
    const potentialSavings = totalDeductions * (marginalTaxRate / 100)
    const effectiveTaxRate = totalIncome > 0 ? (netTaxPayable / totalIncome) * 100 : 0

    return {
      totalDeductions,
      potentialSavings,
      taxableIncome,
      estimatedTax,
      medicareLevy,
      lmitoOffset,
      effectiveTaxRate,
      marginalTaxRate,
      netTaxPayable,
      totalIncome,
    }
  }

  const mapToATOCategory = (category: string): string => {
    const categoryLower = category.toLowerCase()

    if (
      categoryLower.includes("car") ||
      categoryLower.includes("fuel") ||
      categoryLower.includes("travel") ||
      categoryLower.includes("transport")
    ) {
      return "Car and travel expenses"
    }
    if (categoryLower.includes("clothing") || categoryLower.includes("uniform") || categoryLower.includes("laundry")) {
      return "Clothing, laundry and dry-cleaning"
    }
    if (
      categoryLower.includes("education") ||
      categoryLower.includes("training") ||
      categoryLower.includes("course") ||
      categoryLower.includes("conference")
    ) {
      return "Self-education expenses"
    }
    if (
      categoryLower.includes("home") ||
      categoryLower.includes("office") ||
      categoryLower.includes("internet") ||
      categoryLower.includes("phone")
    ) {
      return "Home office expenses"
    }
    if (categoryLower.includes("tool") || categoryLower.includes("equipment") || categoryLower.includes("software")) {
      return "Tools and equipment"
    }
    if (categoryLower.includes("gift") || categoryLower.includes("donation") || categoryLower.includes("charity")) {
      return "Gifts and donations"
    }
    if (
      categoryLower.includes("investment") ||
      categoryLower.includes("property") ||
      categoryLower.includes("interest")
    ) {
      return "Investment expenses"
    }

    return "Other work-related expenses"
  }

  const generateATOCompliantInsights = () => {
    if (!taxSummary) return

    const insights: TaxInsight[] = []

    insights.push({
      type: "compliance",
      title: "Tax Estimate Only",
      description:
        "These calculations are estimates based on current ATO rates. Always get professional advice for your tax return.",
      atoReference: "https://www.ato.gov.au/rates/individual-income-tax-rates/",
    })

    if (taxSummary.totalDeductions > 300) {
      insights.push({
        type: "info",
        title: "Keep Your Receipts",
        description: "Save all receipts and invoices for 5 years. The ATO may ask to see them if you're audited.",
        atoReference: "https://www.ato.gov.au/individuals/income-and-deductions/records-you-need-to-keep/",
      })
    }

    if (taxSummary.totalDeductions > 5000) {
      insights.push({
        type: "warning",
        title: "Large Deduction Amount",
        description: "Higher deduction amounts may get extra attention from the ATO. Make sure you have good records.",
        action: "Review Your Claims",
      })
    }

    if (taxSummary.medicareLevy > 0) {
      insights.push({
        type: "info",
        title: "Medicare Levy",
        description: `You'll pay ${formatCurrency(taxSummary.medicareLevy)} Medicare levy (2% of your income above $29,207).`,
        atoReference: "https://www.ato.gov.au/individuals/medicare-and-private-health-insurance/medicare-levy/",
      })
    }

    if (taxSummary.lmitoOffset > 0) {
      insights.push({
        type: "success",
        title: "Tax Offset Available",
        description: `Good news! You're eligible for ${formatCurrency(taxSummary.lmitoOffset)} tax offset, reducing your tax bill.`,
        atoReference:
          "https://www.ato.gov.au/individuals/income-and-deductions/offsets-and-rebates/low-and-middle-income-tax-offset/",
      })
    }

    const workRelatedTotal = categoryBreakdown
      .filter((cat) => cat.category !== "Investment expenses" && cat.category !== "Gifts and donations")
      .reduce((sum, cat) => sum + cat.amount, 0)

    if (workRelatedTotal > 3000) {
      insights.push({
        type: "warning",
        title: "High Work Expenses",
        description:
          "Work expenses over $3,000 may get reviewed by the ATO. Double-check all your claims are legitimate.",
        atoReference: "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/",
      })
    }

    setTaxInsights(insights)
  }

  const filterTransactionsForDisplay = () => {
    let filtered = transactions.filter((transaction) => transaction.isBusinessExpense)

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((transaction) => transaction.category === selectedCategory)
    }

    if (selectedSource !== "all") {
      filtered = filtered.filter((transaction) => transaction.source === selectedSource)
    }

    setFilteredTransactions(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getUniqueCategories = () => {
    const categories = new Set(transactions.filter((t) => t.isBusinessExpense).map((t) => t.category || "Other"))
    return Array.from(categories).sort()
  }

  const getFinancialYearLabel = (fy: string): string => {
    if (fy === "all") return "All Years"
    const year = Number.parseInt(fy.replace("FY", ""))
    return `${year - 1}-${year.toString().slice(-2)}`
  }

  const exportATOCompliantSummary = () => {
    if (!taxSummary) return

    const fyLabel = selectedFinancialYear === "all" ? "All Years" : getFinancialYearLabel(selectedFinancialYear)

    const csvContent = [
      ["Tax Analysis Report"],
      ["Financial Year", fyLabel],
      ["Generated on", new Date().toLocaleDateString("en-AU")],
      [""],
      ["IMPORTANT DISCLAIMER"],
      ["This is an estimate only. Consult a registered tax agent for professional advice."],
      ["Keep all receipts and records for 5 years as required by ATO."],
      [""],
      ["Tax Summary"],
      ["Total Income (from transactions)", formatCurrency(taxSummary.totalIncome)],
      ["Total Deductions", formatCurrency(taxSummary.totalDeductions)],
      ["Taxable Income (after deductions)", formatCurrency(taxSummary.taxableIncome)],
      ["Income Tax", formatCurrency(taxSummary.estimatedTax)],
      ["Medicare Levy (2%)", formatCurrency(taxSummary.medicareLevy)],
      ["LMITO Offset", formatCurrency(-taxSummary.lmitoOffset)],
      ["Net Tax Payable", formatCurrency(taxSummary.netTaxPayable)],
      ["Effective Tax Rate", `${taxSummary.effectiveTaxRate.toFixed(2)}%`],
      ["Marginal Tax Rate", `${taxSummary.marginalTaxRate}%`],
      [""],
      ["ATO Category Breakdown"],
      ["Category", "Amount", "Count", "Percentage"],
      ...categoryBreakdown.map((cat) => [
        mapToATOCategory(cat.category),
        formatCurrency(cat.amount),
        cat.count.toString(),
        `${cat.percentage.toFixed(1)}%`,
      ]),
      [""],
      ["ATO References"],
      ["Individual Income Tax Rates", "https://www.ato.gov.au/rates/individual-income-tax-rates/"],
      [
        "Deductions You Can Claim",
        "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/",
      ],
      ["Record Keeping", "https://www.ato.gov.au/individuals/income-and-deductions/records-you-need-to-keep/"],
    ]

    const csvString = csvContent.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tax-analysis-${selectedFinancialYear.toLowerCase()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!premiumCheckComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <DashboardSidebar />
        <div
          className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"} flex items-center justify-center`}
        >
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-3xl flex items-center justify-center mx-auto">
                <RefreshCw className="w-10 h-10 animate-spin text-[#BEF397]" />
              </div>
            </div>
            <p className="text-white text-xl font-medium mb-2">Setting things up...</p>
            <p className="text-zinc-400">This will just take a moment</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <DashboardSidebar />
        <div
          className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"} flex items-center justify-center`}
        >
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-3xl flex items-center justify-center mx-auto">
                <Brain className="w-10 h-10 text-[#BEF397]" />
                <div className="absolute inset-0 rounded-3xl border-2 border-[#BEF397]/30 animate-pulse" />
              </div>
            </div>
            <p className="text-white text-xl font-medium mb-2">Analyzing your expenses...</p>
            <p className="text-zinc-400">
              Finding tax deductions for {selectedFinancialYear || getCurrentFinancialYear()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <div className="p-4 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header with Title and Filters */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => window.history.back()}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Badge className="border-emerald-400/30 text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-full text-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    ATO Approved
                  </Badge>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-[#BEF397] to-[#7DD3FC] bg-clip-text text-transparent">
                  Your Tax Deductions
                </h1>
                <p className="text-xl text-zinc-300 max-w-2xl leading-relaxed">
                  We found potential tax savings in your expenses. Let's review what you can claim.
                </p>
              </div>

              {/* Filters on the right */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-zinc-900/50 rounded-2xl px-6 py-3 border border-zinc-800/50">
                  <Calendar className="w-5 h-5 text-[#BEF397]" />
                  <span className="text-zinc-300 font-medium">Tax Year:</span>
                  <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                    <SelectTrigger className="w-32 bg-transparent border-none text-white font-semibold focus:ring-0 p-0 h-auto">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all">All Years</SelectItem>
                      {availableFinancialYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {getFinancialYearLabel(year)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-zinc-400">
                  {transactions.filter((t) => t.isBusinessExpense).length} deductions found
                </div>
              </div>
            </div>

            {/* AI Review Alert - Only show if review is not complete */}
            {!reviewComplete && (
              <Alert className="border-orange-400/30 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-orange-200">Quick Review Needed</h3>
                      <Badge className="bg-orange-500/20 text-orange-300 px-3 py-1 text-xs rounded-full">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Found
                      </Badge>
                    </div>
                    <p className="text-orange-100/90 mb-4 leading-relaxed">
                      Our AI automatically found these potential deductions in your expenses.
                      <strong className="text-orange-200"> Please review each one</strong> to make sure they're correct
                      before claiming them on your tax return.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        onClick={() => (window.location.href = "/transactions")}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-xl transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Review Now
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-orange-300 hover:text-orange-200 text-sm font-medium"
                        onClick={() =>
                          window.open(
                            "https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/",
                            "_blank",
                          )
                        }
                      >
                        <HelpCircle className="w-4 h-4 mr-1" />
                        What can I claim?
                      </Button>
                    </div>
                  </div>
                </div>
              </Alert>
            )}

            {/* Key Metrics - More Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="group bg-gradient-to-br from-[#BEF397]/15 via-[#BEF397]/8 to-transparent border border-[#BEF397]/30 hover:border-[#BEF397]/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#BEF397]/30 to-[#BEF397]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Receipt className="w-7 h-7 text-[#BEF397]" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400 font-medium">Total Found</div>
                      <div className="text-xs text-[#BEF397]">
                        {transactions.filter((t) => t.isBusinessExpense).length} items
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-zinc-400 text-sm font-medium">Deductions Found</h3>
                    {dataLoading || !taxSummary ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#BEF397]" />
                        <span className="text-lg text-zinc-400">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-white">{formatCurrency(taxSummary.totalDeductions)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-[#7DD3FC]/15 via-[#7DD3FC]/8 to-transparent border border-[#7DD3FC]/30 hover:border-[#7DD3FC]/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#7DD3FC]/30 to-[#7DD3FC]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-7 h-7 text-[#7DD3FC]" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400 font-medium">Tax Rate</div>
                      <div className="text-xs text-[#7DD3FC]">{taxSummary?.marginalTaxRate || 0}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-zinc-400 text-sm font-medium">Potential Refund</h3>
                    {dataLoading || !taxSummary ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#7DD3FC]" />
                        <span className="text-lg text-zinc-400">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-white">{formatCurrency(taxSummary.potentialSavings)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="group bg-gradient-to-br from-purple-500/15 via-purple-500/8 to-transparent border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500/30 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-7 h-7 text-purple-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400 font-medium">After Deductions</div>
                      <div className="text-xs text-purple-400">Effective Rate</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-zinc-400 text-sm font-medium">Your Tax Rate</h3>
                    {dataLoading || !taxSummary ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                        <span className="text-lg text-zinc-400">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-white">{taxSummary.effectiveTaxRate.toFixed(1)}%</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs - Simplified */}
            <Tabs defaultValue="categories" className="space-y-8">
              <div className="flex items-center justify-center">
                <TabsList className="bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-sm p-2 rounded-2xl">
                  <TabsTrigger
                    value="categories"
                    className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Tax Categories
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    All Items
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="categories" className="space-y-8">
                {/* ATO Category Breakdown - More Visual */}
                <div className="relative">
                  {!isPremium && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                      <div className="text-center p-8 max-w-md">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <Crown className="w-10 h-10 text-black" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Unlock Category Breakdown</h3>
                        <p className="text-zinc-300 text-base mb-6 leading-relaxed">
                          See your deductions organized by official ATO categories with detailed analysis
                        </p>
                        <Button
                          onClick={() => (window.location.href = "/upgrade")}
                          className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-[#BEF397]/25 transition-all duration-200"
                        >
                          <Crown className="w-5 h-5 mr-2" />
                          Upgrade Now
                        </Button>
                      </div>
                    </div>
                  )}

                  <Card
                    className={cn(
                      "bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-800/50 backdrop-blur-sm rounded-2xl overflow-hidden",
                      !isPremium && "blur-sm",
                    )}
                  >
                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#BEF397]/20 to-[#BEF397]/10 rounded-2xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-[#BEF397]" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">Tax Categories</h2>
                            <p className="text-zinc-400">Official ATO deduction categories</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-zinc-800/50 text-zinc-300 px-4 py-2 rounded-xl">
                            {categoryBreakdown.length} categories
                          </Badge>
                          <Button
                            onClick={exportATOCompliantSummary}
                            variant="outline"
                            size="sm"
                            className="ml-3 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 rounded-xl bg-transparent"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {categoryBreakdown.length > 0 ? (
                        <div className="space-y-6">
                          {categoryBreakdown.map((category, index) => {
                            const atoCategory = mapToATOCategory(category.category)
                            return (
                              <div key={category.category} className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-4 flex-1">
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-full mt-1 flex-shrink-0",
                                        index === 0 && "bg-[#BEF397]",
                                        index === 1 && "bg-[#7DD3FC]",
                                        index === 2 && "bg-purple-400",
                                        index === 3 && "bg-orange-400",
                                        index === 4 && "bg-pink-400",
                                        index >= 5 && "bg-zinc-500",
                                      )}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className="text-white font-semibold">{atoCategory}</span>
                                        <Badge className="bg-zinc-800/50 text-zinc-300 px-2 py-1 text-xs">
                                          {category.count} items
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-zinc-400 mb-2 leading-relaxed">
                                        {ATO_DEDUCTION_CATEGORIES[atoCategory as keyof typeof ATO_DEDUCTION_CATEGORIES]
                                          ?.description || "Work-related expenses"}
                                      </p>
                                      {ATO_DEDUCTION_CATEGORIES[
                                        atoCategory as keyof typeof ATO_DEDUCTION_CATEGORIES
                                      ] && (
                                        <Button
                                          variant="link"
                                          className="p-0 h-auto text-[#7DD3FC] hover:text-[#7DD3FC]/80 text-sm font-medium"
                                          onClick={() =>
                                            window.open(
                                              ATO_DEDUCTION_CATEGORIES[
                                                atoCategory as keyof typeof ATO_DEDUCTION_CATEGORIES
                                              ].atoGuide,
                                              "_blank",
                                            )
                                          }
                                        >
                                          View ATO Guide <ExternalLink className="w-3 h-3 ml-1" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right ml-6 flex-shrink-0">
                                    <span className="text-white font-bold text-lg">
                                      {formatCurrency(category.amount)}
                                    </span>
                                    <span className="text-zinc-400 text-sm ml-2">
                                      ({category.percentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Progress value={category.percentage} className="h-2 rounded-full" />
                                  <div className="flex justify-between text-sm text-zinc-500">
                                    <span>
                                      Tax saving:{" "}
                                      {formatCurrency(category.amount * ((taxSummary?.marginalTaxRate || 0) / 100))}
                                    </span>
                                    <span>Avg: {formatCurrency(category.amount / category.count)}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-zinc-500" />
                          </div>
                          <p className="text-zinc-400 text-lg mb-2">No categories found</p>
                          <p className="text-sm text-zinc-500 mb-4 max-w-md mx-auto">
                            Upload statements to see ATO-compliant category breakdown
                          </p>
                          <Button
                            onClick={() => (window.location.href = "/upload-statements")}
                            className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-medium"
                          >
                            Upload Statements
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Next Steps - More Prominent */}
                <div className="max-w-4xl mx-auto">
                  <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 border border-zinc-800/50 backdrop-blur-sm rounded-3xl overflow-hidden">
                    <CardHeader className="pb-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-3xl flex items-center justify-center mx-auto">
                          <Zap className="w-8 h-8 text-[#BEF397]" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white mb-2">What's Next?</h2>
                          <p className="text-zinc-400 text-lg">Complete these steps to maximize your tax return</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Primary Action - Review Deductions - Only show if not complete */}
                        {!reviewComplete && (
                          <div className="lg:col-span-2">
                            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/30 transition-all duration-300 group">
                              <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                  <Edit3 className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">Review AI Suggestions</h3>
                                    <Badge className="bg-orange-500/20 text-orange-300 px-3 py-1 text-sm rounded-full">
                                      Priority
                                    </Badge>
                                  </div>
                                  <p className="text-zinc-300 mb-4 leading-relaxed">
                                    Our AI found {transactions.filter((t) => t.isBusinessExpense).length} potential
                                    deductions. Review each one to ensure accuracy before claiming on your tax return.
                                  </p>
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <Button
                                      onClick={() => (window.location.href = "/transactions")}
                                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                      Start Review
                                      <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                      <CheckCircle className="w-4 h-4 text-[#BEF397]" />
                                      <span>Takes 5-10 minutes</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Review Complete Message */}
                        {reviewComplete && (
                          <div className="lg:col-span-2">
                            <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/30 transition-all duration-300 group">
                              <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                  <CheckCircle className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">Review Complete! 🎉</h3>
                                    <Badge className="bg-green-500/20 text-green-300 px-3 py-1 text-sm rounded-full">
                                      Complete
                                    </Badge>
                                  </div>
                                  <p className="text-zinc-300 mb-4 leading-relaxed">
                                    Great job! You've reviewed all your transactions. Your deductions are ready for your
                                    tax return.
                                  </p>
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <Button
                                      onClick={() => (window.location.href = "/reports")}
                                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      Generate Report
                                      <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                      <CheckCircle className="w-4 h-4 text-[#BEF397]" />
                                      <span>Ready for tax return</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Secondary Actions */}
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-[#BEF397]/10 to-[#BEF397]/5 rounded-2xl p-6 border border-[#BEF397]/20 hover:border-[#BEF397]/30 transition-all duration-300 group">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#BEF397]/30 to-[#BEF397]/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Upload className="w-6 h-6 text-[#BEF397]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-white mb-2">Upload More Statements</h4>
                                <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                                  Add more bank statements or receipts to find additional deductions
                                </p>
                                <Button
                                  onClick={() => (window.location.href = "/upload-statements")}
                                  variant="outline"
                                  size="sm"
                                  className="border-[#BEF397]/30 text-[#BEF397] hover:bg-[#BEF397]/10 hover:border-[#BEF397]/50 rounded-lg"
                                >
                                  Upload Files
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-[#7DD3FC]/10 to-[#7DD3FC]/5 rounded-2xl p-6 border border-[#7DD3FC]/20 hover:border-[#7DD3FC]/30 transition-all duration-300 group">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#7DD3FC]/30 to-[#7DD3FC]/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="w-6 h-6 text-[#7DD3FC]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-white mb-2">Connect Your Bank</h4>
                                <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                                  Automatically sync transactions for real-time deduction tracking
                                </p>
                                <Button
                                  onClick={() => (window.location.href = "/connect-bank")}
                                  variant="outline"
                                  size="sm"
                                  className="border-[#7DD3FC]/30 text-[#7DD3FC] hover:bg-[#7DD3FC]/10 hover:border-[#7DD3FC]/50 rounded-lg"
                                >
                                  Connect Bank
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Help */}
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 group">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-6 h-6 text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-white mb-2">Get Professional Help</h4>
                                <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                                  Find a registered tax agent for personalized advice and lodgment
                                </p>
                                <Button
                                  onClick={() => window.open("https://www.ato.gov.au/tax-professionals/", "_blank")}
                                  variant="outline"
                                  size="sm"
                                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 rounded-lg"
                                >
                                  Find Tax Agent
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 group">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Phone className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-white mb-2">Contact ATO</h4>
                                <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                                  Get official guidance directly from the Australian Taxation Office
                                </p>
                                <Button
                                  onClick={() => window.open("tel:132861", "_blank")}
                                  variant="outline"
                                  size="sm"
                                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 rounded-lg"
                                >
                                  Call 13 28 61
                                  <Phone className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="mt-8 pt-6 border-t border-zinc-800/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white">Your Progress</h4>
                          <span className="text-sm text-zinc-400">
                            {reviewComplete ? "3 of 3 steps completed" : "1 of 3 steps completed"}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-[#BEF397]" />
                            <span className="text-zinc-300">AI analysis completed</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {reviewComplete ? (
                              <CheckCircle className="w-5 h-5 text-[#BEF397]" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                              </div>
                            )}
                            <span className={reviewComplete ? "text-zinc-300" : "text-zinc-300"}>
                              Review deductions {reviewComplete ? "(completed)" : "(recommended)"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-zinc-600" />
                            <span className="text-zinc-500">File tax return</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-zinc-800/30 rounded-xl">
                          <div className="text-2xl font-bold text-[#BEF397] mb-1">
                            {taxSummary ? formatCurrency(taxSummary.totalDeductions) : "$0"}
                          </div>
                          <div className="text-xs text-zinc-400">Total Deductions</div>
                        </div>
                        <div className="text-center p-4 bg-zinc-800/30 rounded-xl">
                          <div className="text-2xl font-bold text-[#7DD3FC] mb-1">
                            {taxSummary ? formatCurrency(taxSummary.potentialSavings) : "$0"}
                          </div>
                          <div className="text-xs text-zinc-400">Potential Refund</div>
                        </div>
                        <div className="text-center p-4 bg-zinc-800/30 rounded-xl">
                          <div className="text-2xl font-bold text-purple-400 mb-1">
                            {transactions.filter((t) => t.isBusinessExpense).length}
                          </div>
                          <div className="text-xs text-zinc-400">Items Found</div>
                        </div>
                        <div className="text-center p-4 bg-zinc-800/30 rounded-xl">
                          <div className="text-2xl font-bold text-emerald-400 mb-1">
                            {taxSummary ? taxSummary.effectiveTaxRate.toFixed(1) : "0.0"}%
                          </div>
                          <div className="text-xs text-zinc-400">Tax Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-8">
                {/* Simplified Filters */}
                <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-800/50 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <Input
                          placeholder="Search your deductions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-[#BEF397]/50 rounded-xl h-12"
                        />
                      </div>

                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 text-white focus:border-[#BEF397]/50 rounded-xl h-12">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 rounded-xl">
                          <SelectItem value="all">All categories</SelectItem>
                          {getUniqueCategories().map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedSource} onValueChange={setSelectedSource}>
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 text-white focus:border-[#BEF397]/50 rounded-xl h-12">
                          <SelectValue placeholder="All sources" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 rounded-xl">
                          <SelectItem value="all">All sources</SelectItem>
                          <SelectItem value="pdf-upload">PDF Upload</SelectItem>
                          <SelectItem value="bank-connection">Bank Connection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Transactions List - More Visual */}
                <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-800/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#7DD3FC]/20 to-[#7DD3FC]/10 rounded-2xl flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-[#7DD3FC]" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">
                            Your Deductions ({filteredTransactions.length})
                          </h2>
                          <p className="text-zinc-400">AI-detected tax deductible expenses</p>
                        </div>
                      </div>
                      <Badge className="bg-zinc-800/50 text-zinc-300 px-4 py-2 rounded-xl text-lg">
                        {formatCurrency(
                          filteredTransactions.reduce(
                            (sum, t) => sum + Math.abs(Number.parseFloat(t.amount.toString())),
                            0,
                          ),
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {filteredTransactions.length > 0 ? (
                      <div className="space-y-4">
                        {filteredTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="group flex items-center justify-between p-6 bg-gradient-to-r from-zinc-800/40 to-zinc-700/20 rounded-2xl border border-zinc-700/30 hover:border-zinc-600/50 hover:from-zinc-800/60 hover:to-zinc-700/30 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                {transaction.source === "pdf-upload" ? (
                                  <Upload className="w-6 h-6 text-[#7DD3FC]" />
                                ) : (
                                  <Building2 className="w-6 h-6 text-[#BEF397]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate mb-2 text-lg">
                                  {transaction.description}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-2 text-zinc-400">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">{formatDate(transaction.date)}</span>
                                  </div>
                                  {transaction.category && (
                                    <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 px-3 py-1 text-sm rounded-full">
                                      {mapToATOCategory(transaction.category)}
                                    </Badge>
                                  )}
                                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-3 py-1 text-sm rounded-full">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI Found
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-6">
                              <p className="text-2xl font-bold text-white mb-2">
                                {formatCurrency(Math.abs(Number.parseFloat(transaction.amount.toString())))}
                              </p>
                              <div className="flex items-center gap-2 text-[#BEF397]">
                                <TrendingDown className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {formatCurrency(
                                    Math.abs(Number.parseFloat(transaction.amount.toString())) *
                                      ((taxSummary?.marginalTaxRate || 0) / 100),
                                  )}{" "}
                                  refund
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <Receipt className="w-10 h-10 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-400 mb-3">No deductions found</h3>
                        <p className="text-zinc-500 mb-6 max-w-md mx-auto leading-relaxed">
                          Try adjusting your filters or upload more bank statements to find tax deductions
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            onClick={() => {
                              setSearchTerm("")
                              setSelectedCategory("all")
                              setSelectedSource("all")
                            }}
                            variant="outline"
                            className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 px-6 py-3 rounded-xl"
                          >
                            Clear Filters
                          </Button>
                          <Button
                            onClick={() => (window.location.href = "/upload-statements")}
                            className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-medium px-6 py-3 rounded-xl"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload More
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Important Reminders - More Friendly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {taxInsights.map((insight, index) => (
                <Alert
                  key={index}
                  className={cn(
                    "rounded-2xl border backdrop-blur-sm",
                    insight.type === "success" &&
                      "border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent",
                    insight.type === "warning" &&
                      "border-orange-400/30 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent",
                    insight.type === "info" &&
                      "border-blue-400/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent",
                    insight.type === "compliance" &&
                      "border-purple-400/30 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                        insight.type === "success" && "bg-emerald-500/20",
                        insight.type === "warning" && "bg-orange-500/20",
                        insight.type === "info" && "bg-blue-500/20",
                        insight.type === "compliance" && "bg-purple-500/20",
                      )}
                    >
                      {insight.type === "success" && <CheckCircle className="w-6 h-6 text-emerald-400" />}
                      {insight.type === "warning" && <AlertTriangle className="w-6 h-6 text-orange-400" />}
                      {insight.type === "info" && <Info className="w-6 h-6 text-blue-400" />}
                      {insight.type === "compliance" && <Shield className="w-6 h-6 text-purple-400" />}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "font-semibold mb-2 text-lg",
                          insight.type === "success" && "text-emerald-200",
                          insight.type === "warning" && "text-orange-200",
                          insight.type === "info" && "text-blue-200",
                          insight.type === "compliance" && "text-purple-200",
                        )}
                      >
                        {insight.title}
                      </h3>
                      <p
                        className={cn(
                          "mb-4 leading-relaxed",
                          insight.type === "success" && "text-emerald-100/90",
                          insight.type === "warning" && "text-orange-100/90",
                          insight.type === "info" && "text-blue-100/90",
                          insight.type === "compliance" && "text-purple-100/90",
                        )}
                      >
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {insight.action && (
                          <Button
                            size="sm"
                            className={cn(
                              "font-medium px-4 py-2 rounded-xl transition-colors duration-200",
                              insight.type === "success" && "bg-emerald-500 hover:bg-emerald-600 text-white",
                              insight.type === "warning" && "bg-orange-500 hover:bg-orange-600 text-white",
                              insight.type === "info" && "bg-blue-500 hover:bg-blue-600 text-white",
                              insight.type === "compliance" && "bg-purple-500 hover:bg-purple-600 text-white",
                            )}
                          >
                            {insight.action}
                          </Button>
                        )}
                        {insight.atoReference && (
                          <Button
                            variant="link"
                            size="sm"
                            className={cn(
                              "p-0 h-auto text-sm font-medium",
                              insight.type === "success" && "text-emerald-300 hover:text-emerald-200",
                              insight.type === "warning" && "text-orange-300 hover:text-orange-200",
                              insight.type === "info" && "text-blue-300 hover:text-blue-200",
                              insight.type === "compliance" && "text-purple-300 hover:text-purple-200",
                            )}
                            onClick={() => window.open(insight.atoReference, "_blank")}
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            ATO Guide
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>

            {/* Footer CTA */}
            <div className="text-center py-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>Trusted by thousands of Australians</span>
                  <Star className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Ready to file your tax return? Review your deductions and consult with a tax professional for the best
                  results.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Button
                    onClick={() => (window.location.href = "/transactions")}
                    className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-[#BEF397]/25 transition-all duration-200"
                  >
                    <Edit3 className="w-5 h-5 mr-2" />
                    Review Deductions
                  </Button>
                  <Button
                    onClick={() => window.open("https://www.ato.gov.au/tax-professionals/", "_blank")}
                    variant="outline"
                    className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 px-8 py-4 rounded-xl transition-all duration-200"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Find Tax Agent
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
