import { SimpleAIClassificationService } from "./services/simple-ai-classification"

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category?: string
  subCategory?: string
  account?: string
  accountId?: string
  accountNumber?: string
  type: "debit" | "credit"
  potentialDeduction?: boolean
  enriched?: boolean
  merchantName?: string
  anzsicDescription?: string
  anzsicCode?: string
  source?: string
  balance?: number
  _basiqData?: any
  isBusinessExpense?: boolean
  deductionAmount?: number
  deductionType?: string
  autoClassified?: boolean
  aiClassification?: string
  aiConfidence?: number
  aiReasoning?: string
  classificationSource?: "database" | "ai" | "manual" | "fallback"
  keywordUsed?: string
}

export interface ProcessedTransaction {
  id: string
  description: string
  amount: string
  date: string
  category: string
  account: string
  accountId: string
  accountNumber?: string
  type: "debit" | "credit"
  isBusinessExpense: boolean
  deductionAmount: number
  deductionType?: string
  autoClassified: boolean
  source?: string
  balance?: number
  _basiqData?: any
  aiClassification?: string
  aiConfidence?: number
  classificationSource?: string
}

export interface ManualOverrides {
  [transactionId: string]: boolean
}

export interface CategoryOverrides {
  [transactionId: string]: string
}

export interface DeductionToggleState {
  [key: string]: boolean
}

export interface CategoryMapping {
  deductionType: string
  categories: string[]
  keywords: string[]
}

export interface MonthlyTrend {
  month: string
  expenses: number
  deductions: number
  savings: number
  count: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  count: number
  percentage: number
}

export interface QuarterlyData {
  quarter: string
  income: number
  expenses: number
  deductions: number
  netIncome: number
  taxSavings: number
}

export interface CategoryData {
  category: string
  amount: number
  count: number
  percentage: number
  isDeductible: boolean
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  deductions: number
  netIncome: number
}

export interface DashboardStats {
  totalTransactions: number
  totalIncome: number
  totalExpenses: number
  deductionAmount: number
  taxSavings: number
  accountsConnected: number
  lastSync: string
  classificationStats?: {
    databaseHits: number
    aiCalls: number
    accuracy: number
  }
}

export interface TaxSummary {
  totalDeductions: number
  potentialSavings: number
  taxableIncome: number
  estimatedTax: number
  effectiveTaxRate: number
  marginalTaxRate: number
}

export interface FinancialYearStats {
  totalIncome: number
  totalExpenses: number
  totalDeductions: number
  estimatedTaxSavings: number
  monthlyTrends: MonthlyTrend[]
  topCategories: CategoryBreakdown[]
  atoCategories: Array<{
    category: string
    amount: number
    compliance: "good" | "warning" | "bad"
    description: string
  }>
}

export class TransactionUtils {
  static readonly DEDUCTION_CATEGORIES = [
    "Vehicles, Travel & Transport",
    "Work Tools, Equipment & Technology",
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

  // Financial year utilities
  static filterByFinancialYear(transactions: Transaction[], financialYear: string): Transaction[] {
    const year = Number.parseInt(financialYear.replace("FY", ""))
    const startDate = new Date(year - 1, 6, 1) // July 1st
    const endDate = new Date(year, 5, 30, 23, 59, 59) // June 30th end of day

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }

  static getAvailableFinancialYears(transactions: Transaction[]): string[] {
    const fySet = new Set<string>()

    transactions.forEach((transaction) => {
      const fy = this.getFinancialYearFromDate(transaction.date)
      fySet.add(fy)
    })

    return Array.from(fySet).sort((a, b) => {
      const yearA = Number.parseInt(a.replace("FY", ""))
      const yearB = Number.parseInt(b.replace("FY", ""))
      return yearB - yearA // Most recent first
    })
  }

  static getCurrentFinancialYear(): string {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    if (currentMonth >= 7) {
      return `FY${currentYear + 1}`
    } else {
      return `FY${currentYear}`
    }
  }

  static getFinancialYearFromDate(dateString: string): string {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if (month >= 7) {
      return `FY${year + 1}`
    } else {
      return `FY${year}`
    }
  }

  static formatFinancialYear(year: string): string {
    const startYear = Number.parseInt(year.replace("FY", ""))
    const endYear = startYear + 1
    return `FY ${startYear}-${endYear.toString().slice(-2)}`
  }

  // Get transaction financial year (alias for backward compatibility)
  static getTransactionFinancialYear(dateString: string): string {
    return this.getFinancialYearFromDate(dateString)
  }

  // Refresh deduction toggles from onboarding data
  static refreshFromOnboarding(): DeductionToggleState {
    try {
      console.log("🔄 Refreshing deduction toggles from onboarding data...")

      const profile = JSON.parse(localStorage.getItem("user_profile") || "{}")
      const selectedTypes = profile.onboarding?.deductionTypes || []

      console.log("📋 Found onboarding deduction types:", selectedTypes)

      const refreshedToggles: DeductionToggleState = {}
      this.DEDUCTION_CATEGORIES.forEach((category) => {
        refreshedToggles[category] = selectedTypes.includes(category)
      })

      this.saveDeductionToggles(refreshedToggles)

      console.log("✅ Refreshed deduction toggles:", refreshedToggles)
      return refreshedToggles
    } catch (error) {
      console.error("❌ Error refreshing from onboarding:", error)

      const fallbackToggles: DeductionToggleState = {}
      this.DEDUCTION_CATEGORIES.forEach((category) => {
        fallbackToggles[category] = true
      })

      this.saveDeductionToggles(fallbackToggles)
      return fallbackToggles
    }
  }

  // Enhanced deduction toggles management
  static getDeductionToggles(): DeductionToggleState {
    try {
      const stored = localStorage.getItem("deduction_toggles")

      const profile = JSON.parse(localStorage.getItem("user_profile") || "{}")
      const selectedTypes = profile.onboarding?.deductionTypes || []

      console.log("Loading deduction toggles...")
      console.log("Stored toggles:", stored)
      console.log("Onboarding selections:", selectedTypes)

      if (stored) {
        const storedToggles = JSON.parse(stored)
        const hasOnboardingData = selectedTypes.length > 0
        const storedKeys = Object.keys(storedToggles)
        const needsSync = hasOnboardingData && storedKeys.length === 0

        if (needsSync) {
          console.log("Syncing stored toggles with onboarding data...")
          const syncedToggles = this.initializeFromOnboarding(selectedTypes)
          this.saveDeductionToggles(syncedToggles)
          return syncedToggles
        }

        return storedToggles
      }

      console.log("No stored toggles found, initializing from onboarding...")
      const initialToggles = this.initializeFromOnboarding(selectedTypes)
      this.saveDeductionToggles(initialToggles)

      return initialToggles
    } catch (error) {
      console.warn("Error loading deduction toggles:", error)
      return {}
    }
  }

  static initializeFromOnboarding(selectedTypes: string[]): DeductionToggleState {
    const toggles: DeductionToggleState = {}

    if (!selectedTypes || selectedTypes.length === 0) {
      console.log("🔍 No selectedTypes provided, searching localStorage...")

      const allStorageData: { [key: string]: any } = {}

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            const rawData = localStorage.getItem(key)
            if (rawData) {
              try {
                allStorageData[key] = JSON.parse(rawData)
              } catch {
                allStorageData[key] = rawData
              }
            }
          } catch (e) {
            console.warn(`Error reading ${key}:`, e)
          }
        }
      }

      const deductionIds = this.DEDUCTION_CATEGORIES
      console.log("📋 Looking for these deduction IDs:", deductionIds)

      const possibleSources = [
        allStorageData.user_profile?.onboarding?.deductionTypes,
        allStorageData.user_profile?.deductionTypes,
        allStorageData.onboarding_step1?.deductionTypes,
        allStorageData.onboarding_step1?.selectedDeductions,
        allStorageData.onboarding_step1?.selected,
        allStorageData.onboarding_data?.deductionTypes,
        allStorageData.step1_data?.deductionTypes,
        allStorageData.deduction_types,
        allStorageData.selected_deductions,
      ]

      for (const source of possibleSources) {
        if (Array.isArray(source) && source.length > 0) {
          selectedTypes = source
          console.log("✅ Found deduction types in source:", selectedTypes)
          break
        }
      }

      if (selectedTypes.length === 0) {
        Object.entries(allStorageData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            const matchingIds = value.filter((item) => typeof item === "string" && deductionIds.includes(item))
            if (matchingIds.length > 0) {
              console.log(`🎯 Found matching deduction IDs in ${key}:`, matchingIds)
              if (matchingIds.length > selectedTypes.length) {
                selectedTypes = matchingIds
              }
            }
          }

          if (typeof value === "object" && value !== null) {
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (Array.isArray(nestedValue)) {
                const matchingIds = nestedValue.filter(
                  (item) => typeof item === "string" && deductionIds.includes(item),
                )
                if (matchingIds.length > 0) {
                  console.log(`🎯 Found matching deduction IDs in ${key}.${nestedKey}:`, matchingIds)
                  if (matchingIds.length > selectedTypes.length) {
                    selectedTypes = matchingIds
                  }
                }
              }
            })
          }
        })
      }
    }

    console.log("📋 Final selectedTypes for initialization:", selectedTypes)

    this.DEDUCTION_CATEGORIES.forEach((category) => {
      toggles[category] = selectedTypes.includes(category)
    })

    console.log("✅ Initialized toggles from onboarding:", toggles)
    return toggles
  }

  static saveDeductionToggles(toggles: DeductionToggleState): void {
    try {
      localStorage.setItem("deduction_toggles", JSON.stringify(toggles))
      console.log("Saved deduction toggles:", toggles)
    } catch (error) {
      console.error("Error saving deduction toggles:", error)
    }
  }

  // Manual and category overrides management
  static getManualOverrides(): ManualOverrides {
    try {
      const stored = localStorage.getItem("manual_overrides")
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn("Error loading manual overrides:", error)
      return {}
    }
  }

  static saveManualOverrides(overrides: ManualOverrides): void {
    try {
      localStorage.setItem("manual_overrides", JSON.stringify(overrides))
      console.log("💾 Saved manual overrides:", Object.keys(overrides).length, "transactions")
    } catch (error) {
      console.error("Error saving manual overrides:", error)
    }
  }

  static getCategoryOverrides(): CategoryOverrides {
    try {
      const stored = localStorage.getItem("category_overrides")
      const overrides = stored ? JSON.parse(stored) : {}
      console.log("📂 Loaded category overrides:", Object.keys(overrides).length, "transactions")
      return overrides
    } catch (error) {
      console.warn("Error loading category overrides:", error)
      return {}
    }
  }

  static saveCategoryOverrides(overrides: CategoryOverrides): void {
    try {
      localStorage.setItem("category_overrides", JSON.stringify(overrides))
      console.log("💾 Saved category overrides:", Object.keys(overrides).length, "transactions")
    } catch (error) {
      console.error("Error saving category overrides:", error)
    }
  }

  static saveCategoryForTransaction(transactionId: string, category: string): void {
    try {
      const overrides = this.getCategoryOverrides()
      overrides[transactionId] = category
      this.saveCategoryOverrides(overrides)
      console.log(`✅ Saved category "${category}" for transaction ${transactionId}`)
    } catch (error) {
      console.error("Error saving category for transaction:", error)
    }
  }

  // Enhanced AI classification with caching
  static saveClassificationCache(transactions: Transaction[]): void {
    try {
      const cacheData = {
        timestamp: Date.now(),
        transactions: transactions.map((t) => ({
          id: t.id,
          isBusinessExpense: t.isBusinessExpense,
          deductionAmount: t.deductionAmount,
          deductionType: t.deductionType,
          autoClassified: t.autoClassified,
          classificationSource: t.classificationSource,
          aiConfidence: t.aiConfidence,
          keywordUsed: t.keywordUsed,
        })),
      }

      localStorage.setItem("classification_cache", JSON.stringify(cacheData))
      console.log("💾 Saved classification cache for", transactions.length, "transactions")
    } catch (error) {
      console.error("❌ Error saving classification cache:", error)
    }
  }

  static loadClassificationCache(): { [key: string]: any } | null {
    try {
      const cached = localStorage.getItem("classification_cache")
      if (!cached) return null

      const cacheData = JSON.parse(cached)
      const now = Date.now()
      const cacheAge = now - cacheData.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      if (cacheAge > maxAge) {
        localStorage.removeItem("classification_cache")
        console.log("🗑️ Classification cache expired, removed")
        return null
      }

      const cacheMap: { [key: string]: any } = {}
      cacheData.transactions.forEach((t: any) => {
        cacheMap[t.id] = t
      })

      console.log("📋 Loaded classification cache for", cacheData.transactions.length, "transactions")
      return cacheMap
    } catch (error) {
      console.error("❌ Error loading classification cache:", error)
      return null
    }
  }

  static async classifyTransactions(
    transactions: Transaction[],
    enabledDeductionTypes: DeductionToggleState,
    onProgress?: (completed: number, total: number, dbHits: number, aiCalls: number) => void,
  ): Promise<Transaction[]> {
    console.log("🚀 Starting ENHANCED classification for", transactions.length, "transactions")

    const cache = this.loadClassificationCache()
    const results: Transaction[] = []
    const needsClassification: Transaction[] = []

    transactions.forEach((transaction) => {
      const cached = cache?.[transaction.id]
      if (cached && cached.classificationSource) {
        results.push({
          ...transaction,
          isBusinessExpense: cached.isBusinessExpense,
          deductionAmount: cached.deductionAmount,
          deductionType: cached.deductionType,
          autoClassified: true,
          classificationSource: cached.classificationSource,
          aiConfidence: cached.aiConfidence,
          keywordUsed: cached.keywordUsed,
          category: cached.deductionType || transaction.category || "Other",
        })
      } else {
        needsClassification.push(transaction)
      }
    })

    console.log(`📋 Cache hits: ${results.length}, Need classification: ${needsClassification.length}`)

    if (needsClassification.length > 0) {
      const enabledCategories = Object.entries(enabledDeductionTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => type)

      console.log("📋 Enabled categories for classification:", enabledCategories)

      const transactionsToClassify = needsClassification.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number.parseFloat(t.amount.toString()) || 0,
      }))

      const classificationResults = await SimpleAIClassificationService.classifyTransactions(
        transactionsToClassify,
        enabledCategories,
      )

      const resultsMap = new Map(classificationResults.map((r) => [r.id, r]))

      const newlyClassified = needsClassification.map((transaction) => {
        const result = resultsMap.get(transaction.id)

        if (result) {
          const amount = Number.parseFloat(transaction.amount.toString()) || 0
          const deductionAmount = result.isDeductible && amount < 0 ? Math.abs(amount) : 0

          return {
            ...transaction,
            isBusinessExpense: result.isDeductible,
            deductionAmount,
            deductionType: result.atoCategory,
            autoClassified: true,
            aiConfidence: result.confidence,
            classificationSource: result.source,
            keywordUsed: result.keywordUsed,
            category: result.atoCategory || transaction.category || "Other",
          }
        } else {
          return {
            ...transaction,
            isBusinessExpense: false,
            deductionAmount: 0,
            autoClassified: true,
            classificationSource: "fallback" as const,
            aiConfidence: 0,
          }
        }
      })

      results.push(...newlyClassified)
    }

    this.saveClassificationCache(results)

    const dbHits = results.filter((t) => t.classificationSource === "database").length
    const aiCalls = results.filter((t) => t.classificationSource === "ai").length
    const cacheHits = results.filter((t) => t.classificationSource && cache?.[t.id]).length

    if (onProgress) {
      onProgress(results.length, transactions.length, dbHits, aiCalls)
    }

    console.log("✅ ENHANCED classification complete:", {
      total: results.length,
      cacheHits: cacheHits,
      databaseHits: dbHits,
      aiCalls: aiCalls,
      dbHitRate: `${((dbHits / results.length) * 100).toFixed(1)}%`,
      deductible: results.filter((t) => t.isBusinessExpense).length,
      autoClassified: results.filter((t) => t.autoClassified).length,
    })

    return results
  }

  // Enhanced transaction processing with AI
  static async processTransactions(transactions: Transaction[], useAI = true): Promise<Transaction[]> {
    const manualOverrides = this.getManualOverrides()
    const deductionToggles = this.getDeductionToggles()
    const categoryOverrides = this.getCategoryOverrides()

    console.log("🔄 Processing", transactions.length, "transactions with AI:", useAI)

    if (useAI && transactions.length > 0) {
      const transactionsNeedingAI = transactions.filter(
        (t) => !manualOverrides.hasOwnProperty(t.id) && !categoryOverrides.hasOwnProperty(t.id),
      )

      if (transactionsNeedingAI.length > 0) {
        console.log("🤖 Using AI for", transactionsNeedingAI.length, "transactions")

        try {
          const aiClassified = await this.classifyTransactions(transactionsNeedingAI, deductionToggles)
          const aiResultsMap = new Map(aiClassified.map((t) => [t.id, t]))

          return transactions.map((transaction) => {
            const aiResult = aiResultsMap.get(transaction.id)
            if (aiResult) {
              return aiResult
            }
            return this.applyManualOverrides(transaction, manualOverrides, categoryOverrides)
          })
        } catch (error) {
          console.error("❌ AI classification failed:", error)
          return transactions.map((transaction) =>
            this.applyManualOverrides(transaction, manualOverrides, categoryOverrides),
          )
        }
      }
    }

    return transactions.map((transaction) => this.applyManualOverrides(transaction, manualOverrides, categoryOverrides))
  }

  private static applyManualOverrides(
    transaction: Transaction,
    manualOverrides: ManualOverrides,
    categoryOverrides: CategoryOverrides,
  ): Transaction {
    const hasManualOverride = manualOverrides.hasOwnProperty(transaction.id)
    const hasCategoryOverride = categoryOverrides.hasOwnProperty(transaction.id)

    let isBusinessExpense = false
    let deductionType: string | undefined

    if (hasCategoryOverride) {
      isBusinessExpense = true
      deductionType = categoryOverrides[transaction.id]
    } else if (hasManualOverride) {
      isBusinessExpense = manualOverrides[transaction.id]
    }

    const amount = Number.parseFloat(transaction.amount.toString()) || 0
    const deductionAmount = isBusinessExpense && amount < 0 ? Math.abs(amount) : 0

    return {
      ...transaction,
      isBusinessExpense,
      deductionAmount,
      deductionType,
      category: deductionType || transaction.category || "Other",
      autoClassified: false,
      classificationSource: "manual",
    }
  }

  // Enhanced data loading with AI
  static async loadAllTransactions(useAI = true): Promise<Transaction[]> {
    try {
      console.log("🔄 Loading transactions with classification:", useAI)

      const pdfTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
      console.log("📄 PDF transactions:", pdfTransactions.length)

      let basiqTransactions: any[] = []
      const userId = localStorage.getItem("basiq_user_id")

      if (userId) {
        try {
          const response = await fetch(`/api/basiq/transactions?userId=${userId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && Array.isArray(data.transactions)) {
              basiqTransactions = data.transactions.map((t: any) => ({
                ...t,
                source: "bank-connection",
              }))
              console.log("🏦 Basiq transactions:", basiqTransactions.length)
            }
          }
        } catch (error) {
          console.log("❌ No Basiq transactions available")
        }
      }

      const allTransactions = [
        ...pdfTransactions.map((t: any) => ({ ...t, source: "pdf-upload" })),
        ...basiqTransactions,
      ]

      const uniqueTransactions = allTransactions
        .filter((transaction, index, self) => index === self.findIndex((t) => t.id === transaction.id))
        .filter((transaction) => transaction.balance !== undefined && !isNaN(Number(transaction.balance)))

      console.log("✅ Unique transactions:", uniqueTransactions.length)

      const processedTransactions = await this.processTransactions(uniqueTransactions, useAI)

      const dbClassified = processedTransactions.filter((t) => t.classificationSource === "database").length
      const aiClassified = processedTransactions.filter((t) => t.classificationSource === "ai").length

      console.log("📊 Classification results:", {
        database: dbClassified,
        ai: aiClassified,
        dbHitRate: `${((dbClassified / processedTransactions.length) * 100).toFixed(1)}%`,
      })

      return processedTransactions
    } catch (error) {
      console.error("❌ Error loading transactions:", error)
      return []
    }
  }

  // Core utility methods
  static getBusinessExpenses(transactions: Transaction[]): Transaction[] {
    return transactions.filter((t) => t.isBusinessExpense)
  }

  static getTotalDeductions(transactions: Transaction[]): number {
    const total = transactions
      .filter((t) => t.isBusinessExpense && t.deductionAmount)
      .reduce((sum, t) => sum + (t.deductionAmount || 0), 0)

    console.log("💰 Total deductions calculated:", {
      total,
      transactionCount: transactions.filter((t) => t.isBusinessExpense && t.deductionAmount).length,
    })

    return total
  }

  static getPotentialSavings(totalDeductions: number, taxRate = 0.3): number {
    return totalDeductions * taxRate
  }

  // User income and tax utilities
  static async getUserIncome(): Promise<number> {
    try {
      console.log("Attempting to fetch income from database...")

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Database response:", data)

        const dbIncome =
          data.user?.profile?.salary ||
          data.user?.profile?.preferences?.salary ||
          data.user?.preferences?.salary ||
          data.user?.salary

        if (dbIncome && dbIncome > 0) {
          console.log("User annual income retrieved from database:", dbIncome)
          return dbIncome
        } else {
          console.log("No valid salary found in database response:", data.user)
        }
      } else {
        console.log("Database fetch failed with status:", response.status)
      }
    } catch (error) {
      console.log("Could not fetch income from database, falling back to localStorage:", error)
    }

    try {
      const step2Data = JSON.parse(localStorage.getItem("onboarding_step2") || "{}")
      const income = step2Data.annualIncome || 80000
      console.log("User annual income retrieved from localStorage fallback:", income)
      return income
    } catch (error) {
      console.error("Error getting user income from localStorage:", error)
      return 80000
    }
  }

  static async getUserTaxRate(): Promise<number> {
    const income = await this.getUserIncome()
    let taxRate = 0

    if (income > 180000) taxRate = 45
    else if (income > 120000) taxRate = 37
    else if (income > 45000) taxRate = 32.5
    else if (income > 18200) taxRate = 19
    else taxRate = 0

    console.log(`Tax rate for income ${income}: ${taxRate}%`)
    return taxRate
  }

 
  // CENTRALIZED DASHBOARD STATS CALCULATION - FIXED to use deductionAmount consistently
 // CENTRALIZED DASHBOARD STATS CALCULATION - Updated to work with async getUserIncome
  static async calculateDashboardStats(transactions: Transaction[]): Promise<DashboardStats> {
    const totalIncome = await this.getUserIncome()

    let totalExpenses = 0
    let deductionAmount = 0

    transactions.forEach((transaction) => {
      const amount = Number.parseFloat(transaction.amount.toString()) || 0

      if (amount < 0) {
        totalExpenses += Math.abs(amount)
      }

      // Fix: More accurate deduction calculation
      if (transaction.isBusinessExpense) {
        if ( transaction.deductionAmount > 0) {
          deductionAmount += transaction.deductionAmount
        } else if (amount < 0) {
          // Fallback: if no deductionAmount but is business expense, use absolute amount
          deductionAmount += Math.abs(amount)
        }
      }
    })

    const taxRatePercentage = await this.getUserTaxRate()
    const taxSavings = deductionAmount * (taxRatePercentage / 100)
    const uniqueAccounts = new Set(transactions.map((t) => t.accountId)).size

    const stats = {
      totalTransactions: transactions.length, // This should be accurate now
      totalIncome,
      totalExpenses,
      deductionAmount, // This should be accurate now
      taxSavings,
      accountsConnected: uniqueAccounts,
      lastSync: new Date().toISOString(),
    }

    console.log("📊 Dashboard stats calculated:", {
      totalTransactions: stats.totalTransactions,
      businessExpenseCount: transactions.filter((t) => t.isBusinessExpense).length,
      deductionAmount: stats.deductionAmount,
      taxSavings: stats.taxSavings,
    })

    return stats
  }
 
  // Monthly trends calculation
  static async calculateMonthlyTrends(transactions: Transaction[]): Promise<MonthlyTrend[]> {
    const monthlyData = new Map<string, { income: number; expenses: number; deductions: number; count: number }>()

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthKey = date.toLocaleDateString("en-AU", { year: "numeric", month: "short" })
      const amount = Number.parseFloat(transaction.amount.toString()) || 0

      const existing = monthlyData.get(monthKey) || { income: 0, expenses: 0, deductions: 0, count: 0 }

      if (amount > 0) {
        existing.income += amount
      } else {
        const expenseAmount = Math.abs(amount)
        existing.expenses += expenseAmount
      }

      if (transaction.isBusinessExpense && transaction.deductionAmount) {
        existing.deductions += transaction.deductionAmount
      }

      existing.count += 1
      monthlyData.set(monthKey, existing)
    })

    const taxRate = (await this.getUserTaxRate()) / 100

    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6) // Last 6 months
      .map(([monthKey, data]) => ({
        month: monthKey,
        expenses: data.expenses,
        deductions: data.deductions,
        savings: data.deductions * taxRate,
        count: data.count,
      }))
  }

  // Category breakdown calculation
  static calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
    const categoryMap = new Map<string, { amount: number; count: number }>()
    let totalDeductionAmount = 0

    transactions.forEach((transaction) => {
      if (transaction.isBusinessExpense && transaction.deductionAmount) {
        const category = transaction.category || "Other"
        const amount = transaction.deductionAmount
        const existing = categoryMap.get(category) || { amount: 0, count: 0 }
        categoryMap.set(category, {
          amount: existing.amount + amount,
          count: existing.count + 1,
        })
        totalDeductionAmount += amount
      }
    })

    const result = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalDeductionAmount > 0 ? (data.amount / totalDeductionAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    console.log("📂 Category breakdown calculated:", {
      totalCategories: result.length,
      totalDeductionAmount,
      topCategory: result[0]?.category,
      topAmount: result[0]?.amount,
    })

    return result
  }

  // Statistics calculation
  static getStats(transactions: Transaction[]) {
    console.log("📊 Calculating stats for", transactions.length, "transactions")

    const businessExpenses = transactions.filter((t) => {
      const isBusiness = t.isBusinessExpense === true
      return isBusiness
    })

    console.log("💼 Found", businessExpenses.length, "business expenses")

    const totalDeductions = businessExpenses.reduce((sum, t) => {
      let deductionAmount = t.deductionAmount || 0

      if (deductionAmount === 0 && t.isBusinessExpense) {
        const amount = Number.parseFloat(t.amount.toString()) || 0
        deductionAmount = amount < 0 ? Math.abs(amount) : 0
      }

      return sum + deductionAmount
    }, 0)

    let totalExpenses = 0
    transactions.forEach((transaction) => {
      const amount = Number.parseFloat(transaction.amount.toString()) || 0
      if (amount < 0) {
        totalExpenses += Math.abs(amount)
      }
    })

    const taxRate = 0.325 // Default middle tax bracket
    const potentialSavings = totalDeductions * taxRate

    const stats = {
      totalTransactions: transactions.length,
      totalExpenses,
      businessExpenses: businessExpenses.length,
      totalDeductions,
      potentialSavings,
    }

    console.log("📊 Stats calculated:", {
      totalTransactions: stats.totalTransactions,
      businessExpenses: stats.businessExpenses,
      totalDeductions: stats.totalDeductions,
      potentialSavings: stats.potentialSavings,
      sampleBusinessExpenses: businessExpenses.slice(0, 3).map((t) => ({
        id: t.id,
        amount: t.amount,
        deductionAmount: t.deductionAmount,
        isBusinessExpense: t.isBusinessExpense,
      })),
    })

    return stats
  }

  // Classification stats
  static async getClassificationStats() {
    return await SimpleAIClassificationService.getStats()
  }

  // Debug utility
  static debugOnboardingData(): void {
    console.log("🔍 DEBUGGING ONBOARDING DATA")
    console.log("============================")

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const data = localStorage.getItem(key)
      if (key && data && (key.includes("onboard") || key.includes("deduction"))) {
        try {
          console.log(`${key}:`, JSON.parse(data))
        } catch (error) {
          console.log(`${key}:`, data)
        }
      }
    }

    console.log("Current toggles:", this.getDeductionToggles())
    console.log("Available categories:", this.DEDUCTION_CATEGORIES)
    console.log("============================")
  }
}

export default TransactionUtils
