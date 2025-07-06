"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  RefreshCw,
  Building2,
  Upload,
  Crown,
  CheckCircle,
  AlertTriangle,
  Shield,
  Calendar,
  Receipt,
  Brain,
  Edit3,
  ChevronRight,
  Star,
  Zap,
  Sparkles,
  TrendingUp,
  Loader2,
  Calculator,
  FileText,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Wallet,
  Car,
  Shirt,
  Home,
  GraduationCap,
  Coffee,
  Heart,
  Gift,
  Clock,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  TransactionUtils,
  type Transaction,
  type DashboardStats,
  type CategoryBreakdown,
  type MonthlyTrend,
  type DeductionToggleState,
} from "@/lib/transaction-utils"

// ATO Category mapping and definitions
const atoCategories = [
  {
    code: "D1",
    title: "Work-related Car Expenses",
    limit: 5000,
    description: "Vehicle expenses, fuel, parking, tolls",
    icon: Car,
    deductionTypes: ["Vehicles, Travel & Transport"],
    color: "bg-gradient-to-br from-blue-500/30 to-blue-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/your-tax-return/instructions-to-complete-your-tax-return/paper-tax-return-instructions/2024/tax-return/deduction-questions-d1-d10/d1-work-related-car-expenses-2024",
  },
  {
    code: "D2",
    title: "Work-related Travel",
    limit: null,
    description: "Accommodation, meals while traveling for work",
    icon: Coffee,
    deductionTypes: ["Meals & Entertainment (Work-Related)"],
    color: "bg-gradient-to-br from-yellow-500/30 to-yellow-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/your-tax-return/instructions-to-complete-your-tax-return/paper-tax-return-instructions/2023/tax-return/deduction-questions-d1-d10/d2-work-related-travel-expenses-2023",
  },
  {
    code: "D3",
    title: "Clothing & Laundry",
    limit: 300,
    description: "Uniforms, protective clothing, laundry",
    icon: Shirt,
    deductionTypes: ["Work Clothing & Uniforms"],
    color: "bg-gradient-to-br from-green-500/30 to-green-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/your-tax-return/instructions-to-complete-your-tax-return/paper-tax-return-instructions/2023/tax-return/deduction-questions-d1-d10/d3-work-related-clothing-laundry-and-dry-cleaning-expenses-2023",
  },
  {
    code: "D4",
    title: "Self-education",
    limit: null,
    description: "Courses, conferences, training directly related to work",
    icon: GraduationCap,
    deductionTypes: ["Education & Training"],
    color: "bg-gradient-to-br from-indigo-500/30 to-indigo-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/your-tax-return/instructions-to-complete-your-tax-return/paper-tax-return-instructions/2023/tax-return/deduction-questions-d1-d10/d4-work-related-self-education-expenses-2023",
  },
  {
    code: "D5",
    title: "Other Work-related",
    limit: 300,
    description: "Tools, equipment, professional memberships",
    icon: Calculator,
    deductionTypes: [
      "Work Tools, Equipment & Technology",
      "Professional Memberships & Fees",
      "Tax & Accounting Expenses",
    ],
    color: "bg-gradient-to-br from-purple-500/30 to-purple-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/your-tax-return/instructions-to-complete-your-tax-return/paper-tax-return-instructions/2023/tax-return/deduction-questions-d1-d10/d5-other-work-related-expenses-2023",
  },
  {
    code: "D6",
    title: "Home Office",
    limit: null,
    description: "Home office expenses",
    icon: Home,
    deductionTypes: ["Home Office Expenses"],
    color: "bg-gradient-to-br from-orange-500/30 to-orange-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/working-from-home-expenses",
  },
  {
    code: "D7",
    title: "Personal Services",
    limit: null,
    description: "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/personal-grooming-health-and-fitness/personal-appearance-and-grooming",
    icon: Heart,
    deductionTypes: ["Personal Grooming & Wellbeing"],
    color: "bg-gradient-to-br from-pink-500/30 to-pink-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/other-work-related-expenses",
  },
  {
    code: "D8",
    title: "Gifts & Donations",
    limit: null,
    description: "Deductible gifts and charitable donations",
    icon: Gift,
    deductionTypes: ["Gifts & Donations"],
    color: "bg-gradient-to-br from-violet-500/30 to-violet-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/your-tax-return/instructions-to-complete-your-tax-return/paper-tax-return-instructions/2023/tax-return/deduction-questions-d1-d10/d9-gifts-or-donations-2023",
  },
  {
    code: "D9",
    title: "Investment & Insurance",
    limit: null,
    description: "Investment management fees, insurance premiums",
    icon: Shield,
    deductionTypes: ["Investments, Insurance & Superannuation"],
    color: "bg-gradient-to-br from-slate-500/30 to-slate-500/20",
    atoUrl:
      "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/investments-insurance-and-super/interest-dividend-and-other-investment-income-deductions",
  },
]

// Helper functions for ATO categories
const mapToATOCategory = (category: string): string => {
  const categoryLower = category.toLowerCase()

  if (
    categoryLower.includes("car") ||
    categoryLower.includes("fuel") ||
    categoryLower.includes("travel") ||
    categoryLower.includes("transport") ||
    categoryLower.includes("vehicle")
  ) {
    return "Work-related Car Expenses"
  }
  if (categoryLower.includes("clothing") || categoryLower.includes("uniform") || categoryLower.includes("laundry")) {
    return "Clothing & Laundry"
  }
  if (
    categoryLower.includes("education") ||
    categoryLower.includes("training") ||
    categoryLower.includes("course") ||
    categoryLower.includes("conference")
  ) {
    return "Self-education"
  }
  if (
    categoryLower.includes("home") ||
    categoryLower.includes("office") ||
    categoryLower.includes("internet") ||
    categoryLower.includes("phone")
  ) {
    return "Home Office"
  }
  if (categoryLower.includes("tool") || categoryLower.includes("equipment") || categoryLower.includes("software")) {
    return "Other Work-related"
  }
  if (categoryLower.includes("gift") || categoryLower.includes("donation") || categoryLower.includes("charity")) {
    return "Gifts & Donations"
  }
  if (
    categoryLower.includes("investment") ||
    categoryLower.includes("property") ||
    categoryLower.includes("interest") ||
    categoryLower.includes("insurance")
  ) {
    return "Investment & Insurance"
  }
  if (categoryLower.includes("meal") || categoryLower.includes("entertainment") || categoryLower.includes("dining")) {
    return "Work-related Travel"
  }

  return "Other Work-related"
}

const getATOCategoryInfo = (atoTitle: string) => {
  return atoCategories.find((cat) => cat.title === atoTitle) || atoCategories[4] // Default to "Other Work-related"
}

const getComplianceStatus = (amount: number, limit: number | null): string => {
  if (!limit) return "compliant"
  if (amount > limit) return "warning"
  if (amount > limit * 0.8) return "caution"
  return "compliant"
}

const getComplianceIcon = (status: string) => {
  switch (status) {
    case "compliant":
      return <CheckCircle className="w-4 h-4 text-green-400" />
    case "caution":
      return <Clock className="w-4 h-4 text-yellow-400" />
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-red-400" />
    default:
      return <CheckCircle className="w-4 h-4 text-green-400" />
  }
}

const getComplianceColor = (status: string) => {
  switch (status) {
    case "compliant":
      return "text-green-400"
    case "caution":
      return "text-yellow-400"
    case "warning":
      return "text-red-400"
    default:
      return "text-green-400"
  }
}

const getComplianceMessage = (status: string, limit: number | null) => {
  if (!limit) return "No ATO limit"
  switch (status) {
    case "compliant":
      return "Within ATO guidelines"
    case "caution":
      return `Approaching ${limit.toLocaleString()} limit`
    case "warning":
      return `Exceeds ${limit.toLocaleString()} limit`
    default:
      return "Within ATO guidelines"
  }
}

// Function to group categories by ATO category
const groupByATOCategory = (categoryBreakdown: CategoryBreakdown[]) => {
  const atoGrouped = new Map<
    string,
    {
      amount: number
      count: number
      originalCategories: string[]
      categoryInfo: any
    }
  >()

  categoryBreakdown.forEach((category) => {
    const atoCategory = mapToATOCategory(category.category)
    const categoryInfo = getATOCategoryInfo(atoCategory)

    const existing = atoGrouped.get(atoCategory) || {
      amount: 0,
      count: 0,
      originalCategories: [],
      categoryInfo,
    }

    existing.amount += category.amount
    existing.count += category.count
    existing.originalCategories.push(category.category)

    atoGrouped.set(atoCategory, existing)
  })

  return Array.from(atoGrouped.entries())
    .map(([atoCategory, data]) => ({
      atoCategory,
      amount: data.amount,
      count: data.count,
      originalCategories: data.originalCategories,
      categoryInfo: data.categoryInfo,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export default function DashboardPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [totalFilteredTransactions, setTotalFilteredTransactions] = useState<number>(0);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [premiumCheckComplete, setPremiumCheckComplete] = useState(false)
  const [reviewComplete, setReviewComplete] = useState(false)
  const [deductionToggles, setDeductionToggles] = useState<DeductionToggleState>({})

  const [selectedFY, setSelectedFY] = useState<string>("FY 2024-25")

  const financialYears = [
    { value: "all", label: "All Years" },
    { value: "FY 2024-25", label: "FY 2024-25 (Current)" },
    { value: "FY 2023-24", label: "FY 2023-24" },
    { value: "FY 2022-23", label: "FY 2022-23" },
  ]

  function getCurrentFinancialYear(): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1 // Jan=0

    if (month >= 7) {
      return `${year}-${year + 1}`
    } else {
      return `${year - 1}-${year}`
    }
  }

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
      // Load deduction settings first, then load dashboard data
      const toggles = loadDeductionSettings()
      loadDashboardData(selectedFY, toggles)
    }
  }, [premiumCheckComplete])



  // Debug logging for dashboard stats
  useEffect(() => {
    if (dashboardStats) {
      console.log("🔍 Dashboard Stats Debug:", {
        totalTransactions: dashboardStats.totalTransactions,
        deductionAmount: dashboardStats.deductionAmount,
        taxSavings: dashboardStats.taxSavings,
        totalIncome: dashboardStats.totalIncome,
        totalExpenses: dashboardStats.totalExpenses,
        accountsConnected: dashboardStats.accountsConnected,
      })
    }
  }, [dashboardStats])

  // Debug logging for category breakdown
  useEffect(() => {
    if (categoryBreakdown) {
      console.log("🔍 Category Breakdown Debug:", {
        categoriesFound: categoryBreakdown.length,
        totalAmount: categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0),
        sampleCategories: categoryBreakdown.slice(0, 3),
        groupedByATO: groupByATOCategory(categoryBreakdown),
      })
    }
  }, [categoryBreakdown])

  const checkPremiumStatus = async () => {
    try {
      console.log("🔍 Checking premium status...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const isPremiumUser = data.user?.subscription?.plan === "premium"

        console.log("🚀 Premium check result: ", {
          plan: data.user?.subscription?.plan,
          status: data.user?.subscription?.status,
          planType: data.user?.subscription?.planType,
          isPremiumUser,
        })

        setIsPremium(isPremiumUser)
      } else {
        console.log("❌ API call failed:", res.status)
        setIsPremium(false)
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("⏱️ Premium check timed out")
      } else {
        console.error("❌ Error checking premium status:", error)
      }
      setIsPremium(false)
    } finally {
      setPremiumCheckComplete(true)
    }
  }

  const checkReviewStatus = () => {
    try {
      const reviewStatus = localStorage.getItem("transaction_review_completed")
      setReviewComplete(reviewStatus === "true")
    } catch (error) {
      console.error("Error checking review status:", error)
      setReviewComplete(false)
    }
  }

  const loadDashboardData = async (fy: string = selectedFY, toggles?: DeductionToggleState) => {
    try {
      setLoading(true)
      setDataLoading(true)
      console.log(`🔄 Loading dashboard data for: ${fy}...`)

      const allTx = await TransactionUtils.loadAllTransactions()

      let filtered = allTx



      if (fy !== "all") {
        const match = fy.match(/FY (\d{4})-(\d{2})/)
        if (match) {
          const startYear = Number.parseInt(match[1], 10)
          const endYear = Number.parseInt(`${match[1].slice(0, 2)}${match[2]}`, 10)
          const start = new Date(`${startYear}-07-01`)
          const end = new Date(`${endYear}-06-30`)
          filtered = allTx.filter((tx) => {
            const date = new Date(tx.date)
            return date >= start && date <= end
          })
        }
      }

      setTotalFilteredTransactions(filtered.length);

      console.log(`📊 Filtered to ${filtered.length} transactions by date`)

      // Apply the EXACT same deduction filtering logic as transactions page
      const currentToggles = toggles || deductionToggles
      console.log("🔍 Dashboard applying deduction type filter:", {
        enabledTypesCount: Object.values(currentToggles).filter(Boolean).length,
        enabledTypes: Object.entries(currentToggles)
          .filter(([_, enabled]) => enabled)
          .map(([type, _]) => type),
      })

      // Filter transactions using the same logic as transactions page
      const deductionFilteredTransactions = filtered.filter((transaction) => {
        // Apply deduction settings filter - same logic as transactions page
        let matchesDeductionSettings = true
        if (transaction.isBusinessExpense && transaction.deductionType) {
          // If transaction has a deduction type, check if that type is enabled
          matchesDeductionSettings = currentToggles[transaction.deductionType] === true
        }
        // If transaction doesn't have a deduction type, always include it
        return matchesDeductionSettings
      })

      console.log(
        `📊 After deduction type filtering: ${deductionFilteredTransactions.filter((t) => t.isBusinessExpense).length} deductions remain`,
      )

      setAllTransactions(deductionFilteredTransactions)

      // Use filtered transactions for stats calculation (same as transactions page)
      const stats = await TransactionUtils.calculateDashboardStats(deductionFilteredTransactions)
      setDashboardStats(stats)

      const breakdown = TransactionUtils.calculateCategoryBreakdown(deductionFilteredTransactions)
      setCategoryBreakdown(breakdown)

      const trends = await TransactionUtils.calculateMonthlyTrends(deductionFilteredTransactions)
      setMonthlyTrends(trends)
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error)
    } finally {
      setDataLoading(false)
      setLoading(false)
    }
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

  const loadDeductionSettings = () => {
    try {
      console.log("🔄 Dashboard loading deduction toggles...")

      // Use the exact same method as transactions page
      const toggles = TransactionUtils.getDeductionToggles()
      console.log("📋 Dashboard loaded deduction toggles:", toggles)

      setDeductionToggles(toggles)
      return toggles
    } catch (error) {
      console.error("❌ Dashboard error loading deduction toggles:", error)
      const fallbackToggles: DeductionToggleState = {}
      // Default to all enabled if error
      const defaultCategories = [
        "Vehicles, Travel & Transport",
        "Work Tools, Equipment & Technology",
        "Home Office Expenses",
        "Professional Memberships & Fees",
        "Education & Training",
        "Work Clothing & Uniforms",
        "Meals & Entertainment (Work-Related)",
        "Tax & Accounting Expenses",
        "Gifts & Donations",
        "Investments, Insurance & Superannuation",
        "Personal Grooming & Wellbeing",
      ]
      defaultCategories.forEach((cat) => {
        fallbackToggles[cat] = true
      })
      setDeductionToggles(fallbackToggles)
      return fallbackToggles
    }
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
            <p className="text-white text-xl font-medium mb-2">Loading your financial overview...</p>
            <p className="text-zinc-400">Analyzing transactions and calculating savings</p>
          </div>
        </div>
      </div>
    )
  }

  // Group categories by ATO category for display
  const groupedATOCategories = groupByATOCategory(categoryBreakdown)

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <DashboardHeader />

        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Header */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-[#BEF397] to-[#7DD3FC] bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-xl text-zinc-300 leading-relaxed">Financial overview for</p>
                  <select
                    value={selectedFY}
                    onChange={(e) => {
                      setSelectedFY(e.target.value)
                      loadDashboardData(e.target.value, deductionToggles)
                    }}
                    className="bg-zinc-800 text-white px-4 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#BEF397]"
                  >
                    {financialYears.map((fy) => (
                      <option key={fy.value} value={fy.value}>
                        {fy.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3 bg-zinc-900/50 rounded-2xl px-6 py-3 border border-zinc-800/50">
                    <Activity className="w-5 h-5 text-[#BEF397]" />
                    <span className="text-zinc-300 font-medium"> {totalFilteredTransactions} transactions</span>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-900/50 rounded-2xl px-6 py-3 border border-zinc-800/50">
                    <Calendar className="w-5 h-5 text-[#7DD3FC]" />
                    <span className="text-zinc-300 font-medium">
                      {allTransactions.filter((t) => t.isBusinessExpense).length} deductions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Review Alert - Only show if review is not complete */}
            {true && (
              <Card className="border-orange-400/30 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm rounded-2xl">

              </Card>
            )}


            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Transactions */}

              {/* Deductions Found */}


              {/* Potential Refund */}


              {/* Accounts Connected */}
              <Card className="group bg-gradient-to-br from-purple-500/15 via-purple-500/8 to-transparent border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm rounded-2xl overflow-hidden">

              </Card>
            </div>

            {/* ATO Categories Analysis - Full Width Section */}
            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-zinc-800/50 backdrop-blur-sm rounded-2xl">


            </Card>

            {/* Tax Categories Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Breakdown */}


            </div>



          </div>
        </div>
      </div>
    </div>
  )
}
