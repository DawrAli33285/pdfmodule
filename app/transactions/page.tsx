"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Download,
  Upload,
  DollarSign,
  TrendingUp,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
  Settings,
  Filter,
  Car,
  Laptop,
  Shirt,
  Home,
  GraduationCap,
  Users,
  Coffee,
  Heart,
  Gift,
  Shield,
  Calculator,
  Lock,
  Crown,
  Edit3,
  Save,
  X,
  Tag,
  AlertTriangle,
  Brain,
  ArrowRight,
  PartyPopper,
  Target,
  CheckCheck,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  Minus,
  Zap,
  Star,
  Receipt,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { TransactionUtils } from "@/lib/transaction-utils"
import type { Transaction, DeductionToggleState } from "@/lib/transaction-utils"
import { toast } from "sonner"
import LoadingComponent from "./loading"

// All 11 deduction categories from onboarding step 1
const deductionOptions = [
  {
    id: "Vehicles, Travel & Transport",
    title: "Vehicles, Travel & Transport",
    description: "Car expenses, fuel, parking, public transport, flights",
    icon: Car,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
  },
  {
    id: "Work Tools, Equipment & Technology",
    title: "Work Tools, Equipment & Technology",
    description: "Computers, software, tools, machinery, subscriptions",
    icon: Laptop,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
  },
  {
    id: "Work Clothing & Uniforms",
    title: "Work Clothing & Uniforms",
    description: "Uniforms, protective clothing, safety equipment",
    icon: Shirt,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    textColor: "text-green-400",
  },
  {
    id: "Home Office Expenses",
    title: "Home Office Expenses",
    description: "Utilities, internet, phone, office supplies, rent portion",
    icon: Home,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-400",
  },
  {
    id: "Education & Training",
    title: "Education & Training",
    description: "Courses, conferences, books, professional development",
    icon: GraduationCap,
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    textColor: "text-indigo-400",
  },
  {
    id: "Professional Memberships & Fees",
    title: "Professional Memberships & Fees",
    description: "Association fees, licenses, certifications",
    icon: Users,
    color: "from-teal-500 to-green-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    textColor: "text-teal-400",
  },
  {
    id: "Meals & Entertainment (Work-Related)",
    title: "Meals & Entertainment (Work-Related)",
    description: "Client meals, business entertainment, work functions",
    icon: Coffee,
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-400",
  },
  {
    id: "Personal Grooming & Wellbeing",
    title: "Personal Grooming & Wellbeing",
    description: "Haircuts, gym memberships, health expenses",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    textColor: "text-pink-400",
  },
  {
    id: "Gifts & Donations",
    title: "Gifts & Donations",
    description: "Corporate gifts, charitable donations, sponsorships",
    icon: Gift,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    textColor: "text-violet-400",
  },
  {
    id: "Investments, Insurance & Superannuation",
    title: "Investments, Insurance & Superannuation",
    description: "Investment fees, insurance premiums, super contributions",
    icon: Shield,
    color: "from-slate-500 to-gray-500",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    textColor: "text-slate-400",
  },
  {
    id: "Tax & Accounting Expenses",
    title: "Tax & Accounting Expenses",
    description: "Accountant fees, tax preparation, bookkeeping",
    icon: Calculator,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
  },
]

// Enhanced caching utilities
const PREMIUM_CACHE_KEY = "premium_status_cache"
const STATS_CACHE_KEY = "transaction_stats_cache"
const PREMIUM_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
const STATS_CACHE_DURATION = 30 * 1000 // 30 seconds

interface PremiumCache {
  isPremium: boolean
  timestamp: number
  userId?: string
}

interface StatsCache {
  stats: any
  timestamp: number
  transactionCount: number
  deductionHash: string
}

// Optimized caching functions
const getCachedPremiumStatus = (): boolean | null => {
  try {
    const cached = localStorage.getItem(PREMIUM_CACHE_KEY)
    if (!cached) return null

    const { isPremium, timestamp }: PremiumCache = JSON.parse(cached)
    const now = Date.now()

    if (now - timestamp > PREMIUM_CACHE_DURATION) {
      localStorage.removeItem(PREMIUM_CACHE_KEY)
      return null
    }

    return isPremium
  } catch (error) {
    localStorage.removeItem(PREMIUM_CACHE_KEY)
    return null
  }
}

const setCachedPremiumStatus = (isPremium: boolean) => {
  try {
    const cache: PremiumCache = {
      isPremium,
      timestamp: Date.now(),
    }
    localStorage.setItem(PREMIUM_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn("Error caching premium status:", error)
  }
}

const getCachedStats = (transactionCount: number, deductionHash: string) => {
  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY)
    if (!cached) return null

    const {
      stats,
      timestamp,
      transactionCount: cachedCount,
      deductionHash: cachedHash,
    }: StatsCache = JSON.parse(cached)
    const now = Date.now()

    if (now - timestamp > STATS_CACHE_DURATION || cachedCount !== transactionCount || cachedHash !== deductionHash) {
      localStorage.removeItem(STATS_CACHE_KEY)
      return null
    }

    return stats
  } catch (error) {
    localStorage.removeItem(STATS_CACHE_KEY)
    return null
  }
}

const setCachedStats = (stats: any, transactionCount: number, deductionHash: string) => {
  try {
    const cache: StatsCache = {
      stats,
      timestamp: Date.now(),
      transactionCount,
      deductionHash,
    }
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn("Error caching stats:", error)
  }
}

// Helper function to create a hash of deduction toggles for cache invalidation
const createDeductionHash = (toggles: DeductionToggleState): string => {
  return Object.entries(toggles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|")
}

// Helper function to trim transaction descriptions
const trimTransactionDescription = (description: string, maxLength = 80): string => {
  if (!description) return ""
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength - 3) + "..."
}

interface DeductionSettings {
  [key: string]: boolean
}

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [premiumLoading, setPremiumLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSource, setSelectedSource] = useState("all")
  const [selectedFY, setSelectedFY] = useState("all")
  const [showOnlyDeductions, setShowOnlyDeductions] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [deductionToggles, setDeductionToggles] = useState<DeductionToggleState>({})
  const [showDeductionControls, setShowDeductionControls] = useState(false)
  const [manualOverrides, setManualOverrides] = useState<{ [key: string]: boolean }>({})
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string>("")
  const [reviewCompleted, setReviewCompleted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deductionSettings, setDeductionSettings] = useState<DeductionSettings>({})
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [sortBy, setSortBy] = useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedBank, setSelectedBank] = useState("all")
  const [deductionFilter, setDeductionFilter] = useState<"all" | "deductions" | "non-deductions">("all")
  const [showDeductionControlsFilter, setShowDeductionControlsFilter] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [marginalTaxRate, setMarginalTaxRate] = useState<number>(0.325) // Default to 32.5%
  const [statsLoading, setStatsLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [userSalary, setUserSalary] = useState<number>(80000) // Default salary

  // Financial year options
  const fyOptions = [
    { value: "all", label: "All Years" },
    { value: "FY 2024-25", label: "FY 2024-25 (Current)" },
    { value: "FY 2023-24", label: "FY 2023-24" },
    { value: "FY 2022-23", label: "FY 2022-23" },
  ]

  const DEDUCTION_TYPES = [
    "Work Tools, Equipment & Technology",
    "Vehicles, Travel & Transport",
    "Work Clothing & Uniforms",
    "Home Office Expenses",
    "Education & Training",
    "Professional Memberships & Fees",
    "Meals & Entertainment (Work-Related)",
    "Personal Grooming & Wellbeing",
    "Gifts & Donations",
    "Investments, Insurance & Superannuation",
    "Tax & Accounting Expenses",
  ]

  // Function to calculate marginal tax rate based on salary
  const calculateMarginalTaxRate = useCallback((salary: number): number => {
    if (salary > 180000) return 0.45 // 45%
    if (salary > 120000) return 0.37 // 37%
    if (salary > 45000) return 0.325 // 32.5%
    if (salary > 18200) return 0.19 // 19%
    return 0 // 0% (tax-free threshold)
  }, [])

  // Function to load user salary from database
  const loadUserSalary = useCallback(async (): Promise<number> => {
    try {
      console.log("🔄 Loading user salary from database...")

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Database response for salary:", data)

        // Check multiple possible locations for salary
        const dbSalary = data.user?.profile?.salary || data.user?.salary || data.user?.preferences?.salary

        if (dbSalary && dbSalary > 0) {
          console.log("✅ User salary retrieved from database:", dbSalary)
          setUserSalary(dbSalary)
          return dbSalary
        } else {
          console.log("No valid salary found in database, using fallback")
        }
      } else {
        console.log("Database fetch failed with status:", response.status)
      }
    } catch (error) {
      console.log("Could not fetch salary from database:", error)
    }

    // Fallback to localStorage if database fetch fails
    try {
      const step2Data = JSON.parse(localStorage.getItem("onboarding_step2") || "{}")
      const fallbackSalary = step2Data.annualIncome || 80000
      console.log("📦 Using fallback salary from localStorage:", fallbackSalary)
      setUserSalary(fallbackSalary)
      return fallbackSalary
    } catch (error) {
      console.error("Error getting salary from localStorage:", error)
      const defaultSalary = 80000
      setUserSalary(defaultSalary)
      return defaultSalary
    }
  }, [])

  // FIXED: Calculate stats from ALL transactions with proper dynamic updates for ATO Business Expenses
  const stats = useMemo(() => {
    if (allTransactions.length === 0) {
      return {
        totalTransactions: 0,
        businessExpenses: 0,
        totalDeductions: 0,
        potentialSavings: 0,
        merchantClassified: 0,
        taxRate: marginalTaxRate,
        classificationRate: 0,
      }
    }

    const deductionHash = createDeductionHash(deductionToggles)
    const cachedStats = getCachedStats(allTransactions.length, deductionHash)

    if (cachedStats) {
      console.log("📊 Using cached stats")
      return {
        ...cachedStats,
        taxRate: marginalTaxRate, // Always use current tax rate
        potentialSavings: cachedStats.totalDeductions * marginalTaxRate, // Recalculate with current rate
      }
    }

    console.log("📊 Calculating fresh stats for ALL transactions...")

    // FIXED: Count business expenses that have ENABLED ATO deduction categories
    const businessExpenses = allTransactions.filter((t) => {
      const isBusiness = t.isBusinessExpense === true
      const amount = Number.parseFloat(t.amount.toString()) || 0
      const hasATOCategory = t.deductionType && DEDUCTION_TYPES.includes(t.deductionType)
      // FIXED: Must also be enabled in deduction toggles
      const isEnabled = t.deductionType && deductionToggles[t.deductionType] === true
      return isBusiness && amount < 0 && hasATOCategory && isEnabled
    }).length

    // Only count deductions with enabled ATO categories
    const totalDeductions = allTransactions
      .filter((t) => {
        if (!t.isBusinessExpense || !t.deductionAmount || !t.deductionType) return false
        // Must have a valid ATO deduction category
        const hasValidATOCategory = DEDUCTION_TYPES.includes(t.deductionType)
        if (!hasValidATOCategory) return false
        // Must be enabled in deduction toggles
        return deductionToggles[t.deductionType] === true
      })
      .reduce((sum, t) => sum + (t.deductionAmount || 0), 0)

    const potentialSavings = totalDeductions * marginalTaxRate

    const merchantClassified = allTransactions.filter((t) => t.merchantName && t.merchantName !== "unknown").length
    const classificationRate = allTransactions.length > 0 ? (merchantClassified / allTransactions.length) * 100 : 0

    const newStats = {
      totalTransactions: allTransactions.length, // Always show total count
      businessExpenses,
      totalDeductions,
      potentialSavings,
      merchantClassified,
      taxRate: marginalTaxRate,
      classificationRate,
    }

    // Cache the calculated stats
    setCachedStats(newStats, allTransactions.length, deductionHash)

    return newStats
  }, [allTransactions, deductionToggles, marginalTaxRate])

  // Optimized premium check
  const checkPremiumStatus = useCallback(async (): Promise<boolean> => {
    const cached = getCachedPremiumStatus()
    if (cached !== null) {
      console.log("🚀 Using cached premium status:", cached)
      return cached
    }

    try {
      console.log("🔍 Checking premium status from API...")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // Reduced timeout

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const isPremiumUser = data.user?.subscription?.plan === "premium"
        setCachedPremiumStatus(isPremiumUser)
        return isPremiumUser
      }

      return false
    } catch (error) {
      console.log("❌ Premium check failed, defaulting to false")
      return false
    }
  }, [])

  // FIXED: Reset data function - preserve deduction settings
  const handleResetData = useCallback(async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true)
      return
    }

    try {
      setResetting(true)
      setShowResetConfirm(false)

      // FIXED: Save current deduction toggles before clearing localStorage
      const currentDeductionToggles = TransactionUtils.getDeductionToggles()

      // Clear all local storage data EXCEPT deduction toggles
      localStorage.removeItem("pdf_transactions")
      localStorage.removeItem("manual_overrides")
      localStorage.removeItem("category_overrides")
      // REMOVED: localStorage.removeItem("deduction_toggles") - Keep deduction settings
      localStorage.removeItem("transaction_review_completed")
      localStorage.removeItem(STATS_CACHE_KEY)
      localStorage.removeItem(PREMIUM_CACHE_KEY)

      // FIXED: Restore deduction toggles after clearing other data
      if (currentDeductionToggles && Object.keys(currentDeductionToggles).length > 0) {
        TransactionUtils.saveDeductionToggles(currentDeductionToggles)
      }

      // Call API to reload database
      const response = await fetch("/api/transactions", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        // Reload the page to refresh all data
        window.location.reload()
      } else {
        throw new Error("Failed to reload data from database")
      }
    } catch (error) {
      console.error("Error resetting data:", error)
      toast.error("Failed to reset data", {
        description: "Please try again or contact support if the issue persists.",
      })
      setResetting(false)
    }
  }, [showResetConfirm])

  // Optimized transaction refresh (not full reload)
  const refreshTransactions = useCallback(async () => {
    try {
      console.log("🔄 Refreshing transactions...")

      // Get fresh transactions without full reload
      const processedTransactions = await TransactionUtils.loadAllTransactions(true) // Use AI classification

      setAllTransactions(processedTransactions)
      setManualOverrides(TransactionUtils.getManualOverrides())

      // Clear stats cache to force recalculation
      localStorage.removeItem(STATS_CACHE_KEY)

      console.log("✅ Transactions refreshed successfully")
    } catch (error) {
      console.error("❌ Error refreshing transactions:", error)
      setError(error instanceof Error ? error.message : "Failed to refresh transactions")
    }
  }, [])

  // FIXED: Optimized transaction loading - ensure positive amounts are not deductible by default
  const loadTransactionsAsync = useCallback(async () => {
    try {
      console.log("🔄 Starting transaction load using centralized TransactionUtils...")
      setLoading(true)
      setError(null)

      // Use centralized transaction loading with AI classification
      const processedTransactions = await TransactionUtils.loadAllTransactions(true)

      // FIXED: Ensure positive amounts are not marked as deductible by default
      const correctedTransactions = processedTransactions.map((transaction) => {
        const amount = Number.parseFloat(transaction.amount.toString()) || 0

        // If amount is positive (income/refund), ensure it's not marked as deductible
        if (amount >= 0) {
          return {
            ...transaction,
            isBusinessExpense: false,
            deductionAmount: 0,
            // Keep other properties but ensure no deduction
          }
        }

        return transaction
      })

      // Set state
      setAllTransactions(correctedTransactions)
      setManualOverrides(TransactionUtils.getManualOverrides())

      console.log("✅ Transactions loaded successfully using TransactionUtils:", {
        total: correctedTransactions.length,
        businessExpenses: correctedTransactions.filter((t) => t.isBusinessExpense).length,
        withCategories: correctedTransactions.filter((t) => t.deductionType && t.deductionType !== "Other").length,
        positiveAmounts: correctedTransactions.filter((t) => Number.parseFloat(t.amount.toString()) >= 0).length,
      })
    } catch (error) {
      console.error("❌ Error loading transactions:", error)
      setError(error instanceof Error ? error.message : "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimized deduction toggles loading
  const loadDeductionTogglesAsync = useCallback(async () => {
    try {
      let toggles = TransactionUtils.getDeductionToggles()

      if (!toggles || Object.keys(toggles).length === 0) {
        console.log("🔄 Initializing deduction toggles from onboarding...")

        // Quick search for onboarding data
        const profile = JSON.parse(localStorage.getItem("user_profile") || "{}")
        const selectedTypes = profile.onboarding?.deductionTypes || []

        const initialToggles: DeductionToggleState = {}
        deductionOptions.forEach((option) => {
          initialToggles[option.id] = selectedTypes.includes(option.id)
        })

        TransactionUtils.saveDeductionToggles(initialToggles)
        toggles = initialToggles
      }

      setDeductionToggles(toggles)
    } catch (error) {
      console.warn("Error loading deduction toggles:", error)
      const fallbackToggles: DeductionToggleState = {}
      deductionOptions.forEach((option) => {
        fallbackToggles[option.id] = true // Default to enabled
      })
      setDeductionToggles(fallbackToggles)
    }
  }, [])

  // Optimized manual override toggle with immediate UI update
  const toggleManualOverride = useCallback(
    (transactionId: string, currentValue: boolean, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      const transaction = allTransactions.find((t) => t.id === transactionId)
      if (!transaction) return

      const amount = Number.parseFloat(transaction.amount.toString()) || 0

      if (amount >= 0 && !currentValue) {
        toast.error("Cannot deduct income or refunds", {
          description: "Only expenses (negative amounts) can be marked as tax deductible.",
          duration: 4000,
        })
        return
      }

      const newValue = !currentValue
      const newDeductionAmount = newValue ? Math.abs(amount) : 0

      // Immediate UI update for responsiveness
      setAllTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                isBusinessExpense: newValue,
                deductionAmount: newDeductionAmount,
              }
            : t,
        ),
      )

      // Update overrides
      const newOverrides = { ...manualOverrides, [transactionId]: newValue }
      setManualOverrides(newOverrides)

      // Async operations
      TransactionUtils.saveManualOverrides(newOverrides)

      // Clear stats cache for immediate recalculation and force update
      localStorage.removeItem(STATS_CACHE_KEY)
      setStatsLoading(true)
      setTimeout(() => setStatsLoading(false), 100)

      if (!newValue) {
        const categoryOverrides = TransactionUtils.getCategoryOverrides()
        delete categoryOverrides[transactionId]
        TransactionUtils.saveCategoryOverrides(categoryOverrides)
      }

      // Update localStorage asynchronously
      setTimeout(() => {
        try {
          const pdfTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
          const updatedPdfTransactions = pdfTransactions.map((t: any) =>
            t.id === transactionId
              ? {
                  ...t,
                  potentialDeduction: newValue,
                  isBusinessExpense: newValue,
                  deductionAmount: newDeductionAmount,
                }
              : t,
          )
          localStorage.setItem("pdf_transactions", JSON.stringify(updatedPdfTransactions))
        } catch (error) {
          console.error("Error updating PDF transactions:", error)
        }
      }, 0)

      if (newValue && !transaction?.deductionType) {
        setEditingTransaction(transactionId)
        setEditingCategory("")
      }
    },
    [allTransactions, manualOverrides],
  )

  // Handle toggle button click for positive amounts
  const handleToggleButtonClick = useCallback(
    (transactionId: string, currentValue: boolean, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const transaction = allTransactions.find((t) => t.id === transactionId)
      if (!transaction) return

      const amount = Number.parseFloat(transaction.amount.toString()) || 0

      if (amount >= 0 && !currentValue) {
        toast.error("Cannot deduct positive amounts", {
          description:
            "You can't deduct positive amounts. Only expenses (negative amounts) can be marked as tax deductible.",
          duration: 4000,
        })
        return
      }

      toggleManualOverride(transactionId, currentValue, event)
    },
    [allTransactions, toggleManualOverride],
  )

  // Handle transaction click
  const handleTransactionClick = useCallback(
    (transactionId: string) => {
      const transaction = allTransactions.find((t) => t.id === transactionId)
      if (!transaction) return

      const amount = Number.parseFloat(transaction.amount.toString()) || 0
      const isBusinessExpense = transaction.isBusinessExpense === true

      // Only allow clicking for negative amounts (expenses) or already marked business expenses
      if (amount < 0 || isBusinessExpense) {
        toggleManualOverride(transactionId, isBusinessExpense)
      }
    },
    [allTransactions, toggleManualOverride],
  )

  // Optimized deduction type toggle
  const toggleDeductionType = useCallback(
    (deductionType: string, enabled: boolean) => {
      const newToggles = { ...deductionToggles, [deductionType]: enabled }
      setDeductionToggles(newToggles)
      TransactionUtils.saveDeductionToggles(newToggles)

      // Clear stats cache for immediate recalculation
      localStorage.removeItem(STATS_CACHE_KEY)

      // Force immediate stats update by triggering a re-render
      setStatsLoading(true)
      setTimeout(() => setStatsLoading(false), 100)
    },
    [deductionToggles],
  )

  // Other callback functions remain the same but optimized...
  const selectAllDeductions = useCallback(() => {
    const allEnabledToggles: DeductionToggleState = {}
    deductionOptions.forEach((option) => {
      allEnabledToggles[option.id] = true
    })
    setDeductionToggles(allEnabledToggles)
    TransactionUtils.saveDeductionToggles(allEnabledToggles)
    localStorage.removeItem(STATS_CACHE_KEY)

    // Force immediate stats update
    setStatsLoading(true)
    setTimeout(() => setStatsLoading(false), 100)
  }, [])

  const unselectAllDeductions = useCallback(() => {
    const allDisabledToggles: DeductionToggleState = {}
    deductionOptions.forEach((option) => {
      allDisabledToggles[option.id] = false
    })
    setDeductionToggles(allDisabledToggles)
    TransactionUtils.saveDeductionToggles(allDisabledToggles)
    localStorage.removeItem(STATS_CACHE_KEY)

    // Force immediate stats update
    setStatsLoading(true)
    setTimeout(() => setStatsLoading(false), 100)
  }, [])

  const resetToOnboardingSettings = useCallback(() => {
    try {
      const refreshedToggles = TransactionUtils.refreshFromOnboarding()
      setDeductionToggles(refreshedToggles)
      localStorage.removeItem(STATS_CACHE_KEY)
      refreshTransactions() // Use refresh instead of full reload
    } catch (error) {
      console.error("Error resetting to onboarding settings:", error)
    }
  }, [refreshTransactions])

  const startEditingCategory = useCallback((transactionId: string, currentCategory: string) => {
    setEditingTransaction(transactionId)
    setEditingCategory(currentCategory)
  }, [])

  const saveTransactionCategory = useCallback(
    async (transactionId: string, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      if (!editingCategory) return

      try {
        const transaction = allTransactions.find((t) => t.id === transactionId)
        const deductionAmount = transaction ? Math.abs(transaction.amount) : 0

        // Immediate UI update
        setAllTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  deductionType: editingCategory,
                  category: editingCategory,
                  isBusinessExpense: true,
                  deductionAmount: deductionAmount,
                }
              : t,
          ),
        )

        // Clear stats cache
        localStorage.removeItem(STATS_CACHE_KEY)

        // Async operations
        TransactionUtils.saveCategoryForTransaction(transactionId, editingCategory)

        const currentOverrides = TransactionUtils.getManualOverrides()
        currentOverrides[transactionId] = true
        TransactionUtils.saveManualOverrides(currentOverrides)
        setManualOverrides((prev) => ({ ...prev, [transactionId]: true }))

        setEditingTransaction(null)
        setEditingCategory("")

        // Update localStorage asynchronously
        setTimeout(() => {
          try {
            const pdfTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
            const updatedPdfTransactions = pdfTransactions.map((t: any) =>
              t.id === transactionId
                ? {
                    ...t,
                    category: editingCategory,
                    deductionType: editingCategory,
                    potentialDeduction: true,
                    isBusinessExpense: true,
                    deductionAmount: Math.abs(Number.parseFloat(t.amount.toString())),
                  }
                : t,
            )
            localStorage.setItem("pdf_transactions", JSON.stringify(updatedPdfTransactions))
          } catch (error) {
            console.error("Error updating PDF transactions:", error)
          }
        }, 0)
      } catch (error) {
        console.error("❌ Error saving transaction category:", error)
      }
    },
    [allTransactions, editingCategory],
  )

  const cancelEditingCategory = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setEditingTransaction(null)
    setEditingCategory("")
  }, [])

  const markReviewComplete = useCallback(() => {
    setReviewCompleted(true)
    localStorage.setItem("transaction_review_completed", "true")
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }, [])

  const proceedToATODeductions = useCallback(() => {
    window.location.href = "/dashboard"
  }, [])

  // Memoized utility functions
  const formatCurrency = useCallback((amount: number | string) => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Math.abs(num))
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }, [])

  const getSourceIcon = useCallback((source?: string) => {
    switch (source) {
      case "pdf-upload":
        return <FileText className="w-3 h-3" />
      case "bank-connection":
        return <Building2 className="w-3 h-3" />
      default:
        return <DollarSign className="w-3 h-3" />
    }
  }, [])

  const getSourceLabel = useCallback((source?: string) => {
    switch (source) {
      case "pdf-upload":
        return "PDF Upload"
      case "bank-connection":
        return "Bank Connection"
      default:
        return "Unknown"
    }
  }, [])

  const getCategoryIcon = useCallback((category: string) => {
    const option = deductionOptions.find((opt) => opt.id === category)
    if (option) {
      const Icon = option.icon
      return <Icon className="w-3 h-3" />
    }
    return <Tag className="w-3 h-3" />
  }, [])

  const getOverallCategoryIcon = useCallback((category: string) => {
    const categoryIcons: { [key: string]: any } = {
      Groceries: Coffee,
      Fuel: Car,
      Transport: Car,
      Dining: Coffee,
      Retail: Gift,
      Utilities: Home,
      Banking: DollarSign,
      Healthcare: Heart,
      Entertainment: Heart,
      "Office Supplies": Calculator,
      Software: Laptop,
      Insurance: Shield,
      Government: Building2,
      Travel: Car,
      Other: Tag,
    }

    const Icon = categoryIcons[category] || Tag
    return <Icon className="w-3 h-3" />
  }, [])

  // FIXED: Memoized filtered transactions for display - PROPER deduction filtering
  const filteredTransactions = useMemo(() => {
    console.log("🔍 Filtering transactions from total:", allTransactions.length)

    const filtered = allTransactions
      .filter((transaction) => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory
        const matchesSource = selectedSource === "all" || transaction.source === selectedSource
        const matchesFY =
          selectedFY === "all" ||
          (() => {
            const transactionFY = TransactionUtils.getTransactionFinancialYear(transaction.date)
            if (selectedFY === "FY 2024-25") return transactionFY === "FY2025"
            if (selectedFY === "FY 2023-24") return transactionFY === "FY2024"
            if (selectedFY === "FY 2022-23") return transactionFY === "FY2023"
            return transactionFY === selectedFY
          })()

        // FIXED: Proper deduction filtering logic
        let matchesDeductionFilter = true
        if (deductionFilter === "deductions") {
          // Only show transactions that are marked as business expenses AND have a valid ATO deduction category
          matchesDeductionFilter =
            transaction.isBusinessExpense === true &&
            transaction.deductionType &&
            DEDUCTION_TYPES.includes(transaction.deductionType)
        } else if (deductionFilter === "non-deductions") {
          // Show transactions that are NOT business expenses OR don't have a valid ATO category
          matchesDeductionFilter =
            transaction.isBusinessExpense !== true ||
            !transaction.deductionType ||
            !DEDUCTION_TYPES.includes(transaction.deductionType)
        }

        const matchesBank = selectedBank === "all" || transaction.account === selectedBank

        // FIXED: Show only deductions filter - only show transactions with ATO categories
        const matchesOldDeductions =
          !showOnlyDeductions ||
          (transaction.isBusinessExpense === true &&
            transaction.deductionType &&
            DEDUCTION_TYPES.includes(transaction.deductionType))

        return (
          matchesSearch &&
          matchesCategory &&
          matchesSource &&
          matchesFY &&
          matchesDeductionFilter &&
          matchesBank &&
          matchesOldDeductions
        )
      })
      .sort((a, b) => {
        let comparison = 0
        if (sortBy === "date") {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        } else if (sortBy === "amount") {
          comparison =
            Math.abs(Number.parseFloat(a.amount.toString())) - Math.abs(Number.parseFloat(b.amount.toString()))
        }
        return sortOrder === "asc" ? comparison : -comparison
      })

    console.log("✅ Filtered transactions:", filtered.length, "from", allTransactions.length)
    return filtered
  }, [
    allTransactions,
    searchTerm,
    selectedCategory,
    selectedSource,
    selectedFY,
    deductionFilter,
    selectedBank,
    showOnlyDeductions,
    sortBy,
    sortOrder,
  ])

  // Memoized displayed transactions
  const displayedTransactions = useMemo(() => {
    return isPremium === true ? filteredTransactions : filteredTransactions.slice(0, 15)
  }, [isPremium, filteredTransactions])

  // Memoized derived data
  const categories = useMemo(() => {
    return Array.from(new Set(allTransactions.map((t) => t.category))).filter(Boolean)
  }, [allTransactions])

  const sources = useMemo(() => {
    return Array.from(new Set(allTransactions.map((t) => t.source))).filter(Boolean)
  }, [allTransactions])

  const banks = useMemo(() => {
    return Array.from(new Set(allTransactions.map((t) => t.account))).filter(Boolean)
  }, [allTransactions])

  const getDeductionBadgeColor = useCallback((deductionType?: string) => {
    if (!deductionType) return "bg-gray-100 text-gray-800"

    const option = deductionOptions.find((opt) => opt.id === deductionType)
    if (option) {
      return `${option.bgColor} ${option.textColor} ${option.borderColor} border`
    }

    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-yellow-100 text-yellow-800",
      "bg-red-100 text-red-800",
      "bg-teal-100 text-teal-800",
      "bg-cyan-100 text-cyan-800",
      "bg-lime-100 text-lime-800",
    ]

    const index = DEDUCTION_TYPES.indexOf(deductionType) % colors.length
    return colors[index]
  }, [])

  const exportTransactions = useCallback(() => {
    const csvContent = [
      [
        "Date",
        "Description",
        "Amount",
        "Type",
        "Category",
        "Account",
        "Source",
        "Tax Deductible",
        "Deduction Amount",
        "Deduction Type",
        "AI Suggested",
        "Financial Year",
        "Balance",
      ].join(","),
      ...filteredTransactions.map((t) =>
        [
          t.date,
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount,
          t.type,
          t.category,
          t.account,
          getSourceLabel(t.source),
          t.isBusinessExpense ? "Yes" : "No",
          t.deductionAmount,
          t.deductionType || "",
          t.autoClassified ? "Yes" : "No",
          TransactionUtils.getTransactionFinancialYear(t.date),
          t.balance || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${selectedFY !== "all" ? selectedFY.replace(/\s/g, "-") : "all"}-${
      new Date().toISOString().split("T")[0]
    }.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredTransactions, selectedFY, getSourceLabel])

  const PremiumFeature = useCallback(
    ({ children, feature }: { children: React.ReactNode; feature: string }) => {
      if (premiumLoading || isPremium === null) {
        return (
          <div className="relative">
            <div className="opacity-50 pointer-events-none">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg backdrop-blur-sm">
              <div className="w-5 h-5 border-2 border-[#BEF397] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )
      }

      if (isPremium) {
        return <>{children}</>
      }

      return (
        <div className="relative group">
          <div className="blur-sm pointer-events-none">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm transition-all duration-300 group-hover:bg-black/90">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-black" />
              </div>
              <p className="text-white font-semibold mb-1">{feature}</p>
              <p className="text-sm text-zinc-400 mb-3">Upgrade to unlock</p>
              <Button
                onClick={() => (window.location.href = "/upgrade")}
                size="sm"
                className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all transform hover:scale-105"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      )
    },
    [premiumLoading, isPremium],
  )

  // Memoized enabled deduction options
  const enabledDeductionOptions = useMemo(() => {
    return deductionOptions.filter((option) => deductionToggles[option.id] === true)
  }, [deductionToggles])

  const handleAddMoreCategories = useCallback(() => {
    setShowDeductionControls(true)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 100)
  }, [])

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (value === "add-more") {
        handleAddMoreCategories()
        return
      }
      setEditingCategory(value)
    },
    [handleAddMoreCategories],
  )

  // Memoized computed values - FIXED to only count ATO categories
  const transactionsNeedingCategories = useMemo(() => {
    return displayedTransactions.filter(
      (t) => t.isBusinessExpense && (!t.deductionType || !DEDUCTION_TYPES.includes(t.deductionType)),
    ).length
  }, [displayedTransactions])

  const enabledDeductionTypesCount = useMemo(() => {
    return Object.values(deductionToggles).filter(Boolean).length
  }, [deductionToggles])

  const autoClassifiedCount = useMemo(() => {
    return allTransactions.filter((t) => t.autoClassified).length
  }, [allTransactions])

  // Load review status
  const loadReviewStatusAsync = useCallback(async () => {
    try {
      const completed = localStorage.getItem("transaction_review_completed") === "true"
      setReviewCompleted(completed)
    } catch (error) {
      console.warn("Error loading review status:", error)
    }
  }, [])

  // Load manual overrides
  const loadManualOverridesAsync = useCallback(async () => {
    try {
      const overrides = TransactionUtils.getManualOverrides()
      setManualOverrides(overrides)
    } catch (error) {
      console.warn("Error loading manual overrides:", error)
    }
  }, [])

  // Main initialization effect
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load user salary and calculate tax rate first
        const salary = await loadUserSalary()
        const taxRate = calculateMarginalTaxRate(salary)
        setMarginalTaxRate(taxRate)
        console.log(`💰 Salary: ${salary}, Tax Rate: ${(taxRate * 100).toFixed(1)}%`)

        // Check premium status
        const premiumStatus = await checkPremiumStatus()
        setIsPremium(premiumStatus)
        setPremiumLoading(false)

        // Load other data in parallel
        await Promise.all([
          loadTransactionsAsync(),
          loadDeductionTogglesAsync(),
          loadManualOverridesAsync(),
          loadReviewStatusAsync(),
        ])
      } catch (error) {
        console.error("Error initializing data:", error)
        setIsPremium(false)
        setPremiumLoading(false)
      }
    }

    initializeData()

    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    const handleTransactionsUpdated = () => {
      console.log("🔄 Transactions updated event received, refreshing...")
      refreshTransactions() // Use refresh instead of full reload
    }

    const handleSalaryUpdated = async (event: CustomEvent) => {
      console.log("💰 Salary updated event received:", event.detail)
      const newSalary = event.detail.salary
      if (newSalary && newSalary > 0) {
        setUserSalary(newSalary)
        const newTaxRate = calculateMarginalTaxRate(newSalary)
        setMarginalTaxRate(newTaxRate)
        console.log(`💰 Updated Salary: ${newSalary}, New Tax Rate: ${(newTaxRate * 100).toFixed(1)}%`)

        // Clear stats cache to force recalculation with new tax rate
        localStorage.removeItem(STATS_CACHE_KEY)
        setStatsLoading(true)
        setTimeout(() => setStatsLoading(false), 100)
      }
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    window.addEventListener("transactionsUpdated", handleTransactionsUpdated as EventListener)
    window.addEventListener("salaryUpdated", handleSalaryUpdated as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
      window.removeEventListener("transactionsUpdated", handleTransactionsUpdated as EventListener)
      window.removeEventListener("salaryUpdated", handleSalaryUpdated as EventListener)
    }
  }, [
    checkPremiumStatus,
    loadTransactionsAsync,
    loadDeductionTogglesAsync,
    loadManualOverridesAsync,
    loadReviewStatusAsync,
    refreshTransactions,
    loadUserSalary,
    calculateMarginalTaxRate,
  ])

  if (premiumLoading || loading) {
    return <LoadingComponent />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#BEF397]/5 via-transparent to-[#7DD3FC]/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#BEF397]/10 via-transparent to-transparent pointer-events-none" />

      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"} relative z-10`}>
        <DashboardHeader />

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full shadow-lg"
                  style={{
                    backgroundColor: ["#BEF397", "#7DD3FC", "#F59E0B", "#EF4444", "#8B5CF6"][
                      Math.floor(Math.random() * 5)
                    ],
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="p-6 space-y-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                      Transaction Review
                    </h1>
                    <p className="text-zinc-400 text-lg">
                      {isPremium
                        ? `Review and categorize all ${allTransactions.length.toLocaleString()} transactions`
                        : `Showing 15 of ${filteredTransactions.length.toLocaleString()} filtered transactions (${allTransactions.length.toLocaleString()} total)`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedFY !== "all" && (
                  <Badge className="bg-gradient-to-r from-[#BEF397]/20 to-[#7DD3FC]/20 text-[#BEF397] border-[#BEF397]/30 px-4 py-2 text-sm font-medium">
                    <Star className="w-4 h-4 mr-2" />
                    {selectedFY}
                  </Badge>
                )}
                <Button
                  onClick={() => (window.location.href = "/upload-statements?manage=true")}
                  variant="outline"
                  className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-300 backdrop-blur-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Accounts
                </Button>

                <Button
                  onClick={() => setShowDeductionControls(!showDeductionControls)}
                  variant="outline"
                  className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-300 backdrop-blur-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Deduction Settings
                  <Badge className="ml-2 bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 px-2 py-0.5 text-xs">
                    {enabledDeductionTypesCount}
                  </Badge>
                </Button>
                {/* Reset Data Button */}
                <Button
                  onClick={handleResetData}
                  variant="outline"
                  disabled={resetting}
                  className={cn(
                    "border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-300 backdrop-blur-sm",
                    showResetConfirm && "border-red-500/50 text-red-400 hover:bg-red-500/10",
                  )}
                >
                  {resetting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : showResetConfirm ? (
                    <Trash2 className="w-4 h-4 mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {resetting ? "Resetting..." : showResetConfirm ? "Confirm Reset" : "Reset Data"}
                </Button>
                {showResetConfirm && (
                  <Button
                    onClick={() => setShowResetConfirm(false)}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                )}
                {isPremium ? (
                  <Badge className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black font-semibold px-4 py-2 shadow-lg">
                    <Crown className="w-4 h-4 mr-2" />
                    Premium
                  </Badge>
                ) : (
                  <Button
                    onClick={() => (window.location.href = "/upgrade")}
                    className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade for Full Access
                  </Button>
                )}
              </div>
            </div>

            {/* Reset Confirmation Warning */}
            {showResetConfirm && (
              <Card className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 border border-red-500/30 mb-8 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-red-400 font-semibold text-lg">⚠️ Warning: Reset All Data</p>
                      <p className="text-red-300 text-sm mt-1">
                        This will permanently delete all your transaction data, manual overrides, and categories. Your
                        deduction settings will be preserved. This action cannot be undone. Click "Confirm Reset" to
                        proceed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 border border-red-500/30 mb-8 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-red-400 font-semibold text-lg">Error Loading Transactions</p>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setError(null)
                          refreshTransactions()
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                      >
                        Retry
                      </Button>
                      <Button
                        onClick={() => setError(null)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Review Completion Section */}
            {allTransactions.length > 0 && (
              <Card className="bg-gradient-to-r from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 mb-8 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                          reviewCompleted
                            ? "bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] shadow-[#BEF397]/25"
                            : transactionsNeedingCategories > 0
                              ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 shadow-orange-500/25"
                              : !isPremium && filteredTransactions.length > 15
                                ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 shadow-orange-500/25 animate-pulse"
                                : "bg-zinc-700/50 shadow-zinc-700/25",
                        )}
                      >
                        {reviewCompleted ? (
                          <CheckCheck className="w-8 h-8 text-black" />
                        ) : transactionsNeedingCategories > 0 ? (
                          <AlertTriangle className="w-8 h-8 text-orange-400" />
                        ) : !isPremium && filteredTransactions.length > 15 ? (
                          <AlertCircle className="w-8 h-8 text-orange-400 animate-pulse" />
                        ) : (
                          <Target className="w-8 h-8 text-zinc-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">
                          {reviewCompleted
                            ? "Review Complete! 🎉"
                            : transactionsNeedingCategories > 0
                              ? "Review In Progress"
                              : !isPremium && filteredTransactions.length > 15
                                ? "⚠️ Incomplete Review"
                                : "Ready for Review"}
                        </h3>
                        <p className="text-zinc-400 text-base leading-relaxed max-w-2xl">
                          {reviewCompleted
                            ? "All transactions have been reviewed and categorized with ATO-compliant deduction types"
                            : transactionsNeedingCategories > 0
                              ? `${transactionsNeedingCategories} transactions need ATO categories assigned for accurate tax calculations`
                              : !isPremium && filteredTransactions.length > 15
                                ? `Only ${displayedTransactions.length} of ${filteredTransactions.length} transactions reviewed - upgrade to complete full review and maximize deductions`
                                : "All transactions are properly categorized with ATO deduction types"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!isPremium && filteredTransactions.length > 15 ? (
                        <Button
                          onClick={() => (window.location.href = "/upgrade")}
                          size="lg"
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Crown className="w-5 h-5 mr-2" />
                          Complete Review
                        </Button>
                      ) : !reviewCompleted && transactionsNeedingCategories === 0 ? (
                        <Button
                          onClick={markReviewComplete}
                          size="lg"
                          className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Mark Review Complete
                        </Button>
                      ) : null}
                      {reviewCompleted && (
                        <Button
                          onClick={proceedToATODeductions}
                          size="lg"
                          className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg group"
                        >
                          <PartyPopper className="w-5 h-5 mr-2" />
                          View ATO Deductions
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Premium Warning */}
            {!isPremium && filteredTransactions.length > 15 && (
              <Card className="bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-red-500/10 border border-orange-500/30 mb-8 overflow-hidden relative backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 animate-pulse"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center animate-bounce shadow-lg shadow-orange-500/25">
                        <AlertTriangle className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          Limited Review Mode
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse px-3 py-1">
                            {filteredTransactions.length - 15} Hidden
                          </Badge>
                        </h3>
                        <p className="text-orange-200 text-base leading-relaxed max-w-2xl">
                          You're only seeing{" "}
                          <span className="font-bold text-white">
                            {displayedTransactions.length} of {filteredTransactions.length}
                          </span>{" "}
                          transactions.
                          <br />
                          <span className="font-bold text-orange-300">
                            {filteredTransactions.length - 15} transactions are hidden
                          </span>{" "}
                          and need review to ensure AI classification accuracy and maximize your tax deductions.
                        </p>
                      </div>
                    </div>
                    <div className="text-center space-y-3">
                      <Button
                        onClick={() => (window.location.href = "/upgrade")}
                        size="lg"
                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-xl font-bold px-8 py-4"
                      >
                        <Crown className="w-6 h-6 mr-2" />
                        Upgrade to Premium
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <p className="text-xs text-zinc-400">
                        Review all transactions • Unlimited exports • Priority support
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Deduction Type Settings */}
            {showDeductionControls && (
              <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 mb-8 backdrop-blur-xl shadow-2xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-lg flex items-center justify-center">
                          <Settings className="w-5 h-5 text-black" />
                        </div>
                        ATO Deduction Categories
                      </CardTitle>
                      <p className="text-zinc-400 text-base leading-relaxed">
                        Enable/disable ATO-compliant deduction categories. This affects stats calculation, transaction
                        filtering, and tax savings estimates.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={selectAllDeductions}
                        variant="outline"
                        size="sm"
                        className="border-zinc-600/50 text-zinc-300 hover:bg-zinc-700/50 bg-transparent transition-all duration-300"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Select All
                      </Button>
                      <Button
                        onClick={unselectAllDeductions}
                        variant="outline"
                        size="sm"
                        className="border-zinc-600/50 text-zinc-300 hover:bg-zinc-700/50 bg-transparent transition-all duration-300"
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        Unselect All
                      </Button>
                      <Button
                        onClick={() => setShowDeductionControls(false)}
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deductionOptions.map((option) => {
                      const Icon = option.icon
                      const isEnabled = deductionToggles[option.id] === true
                      return (
                        <div
                          key={option.id}
                          className={cn(
                            "group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg",
                            isEnabled
                              ? `${option.bgColor} ${option.borderColor} shadow-lg`
                              : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600/50",
                          )}
                          onClick={() => toggleDeductionType(option.id, !isEnabled)}
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div
                                className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                                  isEnabled
                                    ? `bg-gradient-to-r ${option.color} shadow-lg`
                                    : "bg-zinc-700/50 group-hover:bg-zinc-600/50",
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "w-6 h-6 transition-all duration-300",
                                    isEnabled ? "text-white" : "text-zinc-400 group-hover:text-zinc-300",
                                  )}
                                />
                              </div>
                              <div className="flex items-center">
                                {isEnabled ? (
                                  <ToggleRight className="w-8 h-8 text-[#BEF397]" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-zinc-500" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h3
                                className={cn(
                                  "font-semibold text-base transition-all duration-300",
                                  isEnabled ? "text-white" : "text-zinc-300 group-hover:text-white",
                                )}
                              >
                                {option.title}
                              </h3>
                              <p
                                className={cn(
                                  "text-sm leading-relaxed transition-all duration-300",
                                  isEnabled ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400",
                                )}
                              >
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-zinc-700/50">
                    <div className="flex items-center gap-4">
                      <Badge
                        className={cn(
                          "px-4 py-2 text-sm font-medium transition-all duration-300",
                          enabledDeductionTypesCount > 0
                            ? "bg-gradient-to-r from-[#BEF397]/20 to-[#7DD3FC]/20 text-[#BEF397] border-[#BEF397]/30"
                            : "bg-zinc-700/50 text-zinc-400 border-zinc-600/50",
                        )}
                      >
                        {enabledDeductionTypesCount} of {deductionOptions.length} Categories Enabled
                      </Badge>
                    </div>
                    <Button
                      onClick={() => setShowDeductionControls(false)}
                      className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all duration-300"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Receipt className="w-6 h-6 text-blue-400" />
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3 py-1">
                      {isPremium ? "All" : "Limited"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400 font-medium">Total Transactions</p>
                    <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                      {stats.totalTransactions.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {isPremium
                        ? "All transactions loaded"
                        : `Showing ${displayedTransactions.length} of ${filteredTransactions.length}`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-xl flex items-center justify-center border border-[#BEF397]/30 group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-6 h-6 text-[#BEF397]" />
                    </div>
                    <Badge className="bg-[#BEF397]/10 text-[#BEF397] border-[#BEF397]/30 px-3 py-1">ATO</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400 font-medium">ATO Business Expenses</p>
                    <p className="text-3xl font-bold text-white group-hover:text-[#BEF397] transition-colors duration-300">
                      {statsLoading ? (
                        <div className="w-6 h-6 border-2 border-[#BEF397] border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        stats.businessExpenses.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      With enabled ATO categories ({enabledDeductionTypesCount} active)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/30 px-3 py-1">Deductions</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400 font-medium">Total Deductions</p>
                    <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">
                      {statsLoading ? (
                        <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        formatCurrency(stats.totalDeductions)
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">From enabled categories only</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 px-3 py-1">
                      Tax Savings
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400 font-medium">Potential Tax Savings</p>
                    <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
                      {statsLoading ? (
                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        formatCurrency(stats.potentialSavings)
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      At {(stats.taxRate * 100).toFixed(1)}% marginal rate (${userSalary.toLocaleString()} salary)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Search and Filters - Premium Gated */}
            <PremiumFeature feature="Advanced Search & Filters">
              <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 mb-8 backdrop-blur-xl shadow-xl">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                      <Input
                        placeholder="Search transactions by description, merchant, or amount..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-zinc-800/50 border-zinc-700/50 text-white placeholder-zinc-400 focus:border-[#BEF397]/50 focus:ring-[#BEF397]/20 transition-all duration-300 text-base"
                      />
                      {searchTerm && (
                        <Button
                          onClick={() => setSearchTerm("")}
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors duration-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => setShowFilters(!showFilters)}
                          variant="outline"
                          className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-300 backdrop-blur-sm"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filters
                          {showFilters ? (
                            <ChevronUp className="w-4 h-4 ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-2" />
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowDeductionControls(!showDeductionControls)}
                          variant="outline"
                          className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-300 backdrop-blur-sm"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Deduction Settings
                          <Badge className="ml-2 bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 px-2 py-0.5 text-xs">
                            {enabledDeductionTypesCount}
                          </Badge>
                        </Button>
                      </div>
                      <Button
                        onClick={exportTransactions}
                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-zinc-700/50">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Financial Year</label>
                          <Select value={selectedFY} onValueChange={setSelectedFY}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 text-white focus:border-[#BEF397]/50 focus:ring-[#BEF397]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              {fyOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-white">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Deduction Status</label>
                          <Select value={deductionFilter} onValueChange={setDeductionFilter}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 text-white focus:border-[#BEF397]/50 focus:ring-[#BEF397]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              <SelectItem value="all" className="text-white">
                                All Transactions
                              </SelectItem>
                              <SelectItem value="deductions" className="text-white">
                                Tax Deductible Only
                              </SelectItem>
                              <SelectItem value="non-deductions" className="text-white">
                                Non-Deductible Only
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Sort By</label>
                          <div className="flex gap-2">
                            <Select value={sortBy} onValueChange={(value: "date" | "amount") => setSortBy(value)}>
                              <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 text-white focus:border-[#BEF397]/50 focus:ring-[#BEF397]/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="date" className="text-white">
                                  Date
                                </SelectItem>
                                <SelectItem value="amount" className="text-white">
                                  Amount
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                              variant="outline"
                              size="sm"
                              className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 px-3"
                            >
                              {sortOrder === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Source</label>
                          <Select value={selectedSource} onValueChange={setSelectedSource}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 text-white focus:border-[#BEF397]/50 focus:ring-[#BEF397]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              <SelectItem value="all" className="text-white">
                                All Sources
                              </SelectItem>
                              {sources.map((source) => (
                                <SelectItem key={source} value={source} className="text-white">
                                  {getSourceLabel(source)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </PremiumFeature>

            {/* Enhanced Transaction List */}
            <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border border-zinc-700/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-lg flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-black" />
                      </div>
                      Transactions
                    </CardTitle>
                    <p className="text-zinc-400">
                      {isPremium
                        ? `Showing ${displayedTransactions.length} of ${filteredTransactions.length} transactions`
                        : `Showing ${displayedTransactions.length} of ${filteredTransactions.length} filtered transactions (Premium required for full access)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {transactionsNeedingCategories > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1 animate-pulse">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {transactionsNeedingCategories} Need Categories
                      </Badge>
                    )}
                    <Badge className="bg-zinc-700/50 text-zinc-300 border-zinc-600/50 px-3 py-1">
                      {displayedTransactions.length} Transactions
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {displayedTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-300 mb-2">No transactions found</h3>
                    <p className="text-zinc-400 mb-4">
                      {allTransactions.length === 0
                        ? "Upload PDF statements or connect your bank account to see transactions."
                        : "Try adjusting your filters to see more transactions."}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => (window.location.href = "/upload-statements")}
                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Statements
                      </Button>
                      <Button
                        onClick={() => (window.location.href = "/upload-statements?manage=true")}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Accounts
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-700/50">
                    {displayedTransactions.map((transaction, index) => {
                      const amount = Number.parseFloat(transaction.amount.toString())
                      const isExpense = amount < 0
                      const isBusinessExpense = transaction.isBusinessExpense === true
                      const hasValidATOCategory =
                        transaction.deductionType && DEDUCTION_TYPES.includes(transaction.deductionType)
                      const isDeductionEnabled =
                        transaction.deductionType && deductionToggles[transaction.deductionType]
                      const showAsDeduction = isBusinessExpense && hasValidATOCategory && isDeductionEnabled
                      const needsCategory = isBusinessExpense && !hasValidATOCategory
                      const isEditing = editingTransaction === transaction.id

                      return (
                        <div
                          key={transaction.id}
                          className={cn(
                            "group relative transition-all duration-300 hover:bg-zinc-800/30 cursor-pointer",
                            showAsDeduction && "bg-gradient-to-r from-[#BEF397]/5 to-[#7DD3FC]/5",
                            needsCategory && "bg-gradient-to-r from-orange-500/5 to-red-500/5",
                            index === 0 && "border-t-0",
                          )}
                          onClick={() => handleTransactionClick(transaction.id)}
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between">
                              {/* Left side - Transaction details */}
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Toggle button */}
                                <Button
                                  onClick={(e) => handleToggleButtonClick(transaction.id, isBusinessExpense, e)}
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "w-10 h-10 rounded-full transition-all duration-300 flex-shrink-0",
                                    showAsDeduction
                                      ? "bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-80 shadow-lg"
                                      : isBusinessExpense
                                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                                        : "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50 hover:text-white",
                                  )}
                                >
                                  {showAsDeduction ? (
                                    <Check className="w-5 h-5" />
                                  ) : isBusinessExpense ? (
                                    <AlertTriangle className="w-5 h-5" />
                                  ) : (
                                    <Plus className="w-5 h-5" />
                                  )}
                                </Button>

                                {/* Transaction info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  {/* Main description */}
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-white text-lg truncate">
                                      {trimTransactionDescription(transaction.description, 60)}
                                    </h3>
                                    {transaction.autoClassified && (
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-2 py-0.5 text-xs flex-shrink-0">
                                        <Brain className="w-3 h-3 mr-1" />
                                        AI
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Date and account info below description */}
                                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                                    <span>{formatDate(transaction.date)}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-2">
                                      {getSourceIcon(transaction.source)}
                                      <span>{transaction.account || "Unknown Account"}</span>
                                    </div>
                                    {transaction.merchantName && transaction.merchantName !== "unknown" && (
                                      <>
                                        <span>•</span>
                                        <span className="text-zinc-300">{transaction.merchantName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right side - Amount and category */}
                              <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Category section */}
                                <div className="text-right min-w-0">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <Select value={editingCategory} onValueChange={handleCategoryChange}>
                                        <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-700/50 text-white focus:border-[#BEF397]/50">
                                          <SelectValue placeholder="Select ATO category..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700 max-h-64">
                                          {enabledDeductionOptions.map((option) => {
                                            const Icon = option.icon
                                            return (
                                              <SelectItem key={option.id} value={option.id} className="text-white">
                                                <div className="flex items-center gap-2">
                                                  <Icon className="w-4 h-4" />
                                                  <span className="truncate">{option.title}</span>
                                                </div>
                                              </SelectItem>
                                            )
                                          })}
                                          <SelectItem
                                            value="add-more"
                                            className="text-[#BEF397] border-t border-zinc-700"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Plus className="w-4 h-4" />
                                              <span>Add More Categories</span>
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        onClick={(e) => saveTransactionCategory(transaction.id, e)}
                                        size="sm"
                                        disabled={!editingCategory}
                                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 disabled:opacity-50"
                                      >
                                        <Save className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        onClick={cancelEditingCategory}
                                        size="sm"
                                        variant="ghost"
                                        className="text-zinc-400 hover:text-white"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {showAsDeduction && transaction.deductionType ? (
                                        <Badge
                                          className={cn(
                                            "cursor-pointer transition-all duration-300 hover:scale-105",
                                            getDeductionBadgeColor(transaction.deductionType),
                                          )}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            startEditingCategory(transaction.id, transaction.deductionType || "")
                                          }}
                                        >
                                          <div className="flex items-center gap-1">
                                            {getCategoryIcon(transaction.deductionType)}
                                            <span className="truncate max-w-100">
                                              {transaction.deductionType.length > 20
                                                ? `${transaction.deductionType.substring(0, 20)}...`
                                                : transaction.deductionType}
                                            </span>
                                            <Edit3 className="w-3 h-3 ml-1 opacity-60" />
                                          </div>
                                        </Badge>
                                      ) : needsCategory ? (
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            startEditingCategory(transaction.id, "")
                                          }}
                                          size="sm"
                                          variant="outline"
                                          className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 transition-all duration-300"
                                        >
                                          <Tag className="w-4 h-4 mr-1" />
                                          Add ATO Category
                                        </Button>
                                      ) : transaction.category ? (
                                        <Badge className="bg-zinc-700/50 text-zinc-300 border-zinc-600/50">
                                          <div className="flex items-center gap-1">
                                            {getOverallCategoryIcon(transaction.category)}
                                            <span className=" max-w-100">{transaction.category}</span>
                                          </div>
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-zinc-700/50 text-zinc-400 border-zinc-600/50">
                                          <Tag className="w-3 h-3 mr-1" />
                                          Uncategorized
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Amount */}
                                <div className="text-right min-w-0">
                                  <p
                                    className={cn(
                                      "text-xl font-bold transition-all duration-300",
                                      showAsDeduction
                                        ? "text-[#BEF397]"
                                        : isExpense
                                          ? "text-red-400"
                                          : "text-green-400",
                                    )}
                                  >
                                    {formatCurrency(amount)}
                                  </p>
                                  {showAsDeduction && transaction.deductionAmount && (
                                    <p className="text-sm text-zinc-400">
                                      Tax saving: {formatCurrency(transaction.deductionAmount * marginalTaxRate)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Premium Upgrade CTA */}
            {!isPremium && filteredTransactions.length > 15 && (
              <Card className="bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-red-500/10 border border-orange-500/30 mt-8 overflow-hidden relative backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 animate-pulse"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] rounded-full flex items-center justify-center mx-auto shadow-xl">
                      <Crown className="w-10 h-10 text-black" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-bold text-white">
                        Unlock {filteredTransactions.length - 15} More Transactions
                      </h3>
                      <p className="text-xl text-orange-200 max-w-2xl mx-auto leading-relaxed">
                        You're missing potential deductions! Upgrade to Premium to review all your transactions and
                        maximize your tax savings.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-8 py-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{filteredTransactions.length - 15}</p>
                        <p className="text-sm text-zinc-400">Hidden Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#BEF397]">Unlimited</p>
                        <p className="text-sm text-zinc-400">With Premium</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">
                          {formatCurrency(stats.potentialSavings * 2)}+
                        </p>
                        <p className="text-sm text-zinc-400">Potential Deductions</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => (window.location.href = "/upgrade")}
                      size="lg"
                      className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-xl font-bold px-12 py-4 text-lg"
                    >
                      <Crown className="w-6 h-6 mr-3" />
                      Upgrade to Premium Now
                      <ArrowRight className="w-6 h-6 ml-3" />
                    </Button>
                    <p className="text-sm text-zinc-400">
                      30-day money-back guarantee • Cancel anytime • Instant access
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
