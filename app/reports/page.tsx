"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw,
  Crown,
  Lock,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { TransactionUtils, type ProcessedTransaction, type DashboardStats } from "@/lib/transaction-utils"

interface MonthlyReport {
  month: string
  year: number
  income: number
  expenses: number
  deductions: number
  taxSavings: number
  transactionCount: number
}

interface CategoryReport {
  category: string
  amount: number
  count: number
  percentage: number
  avgTransaction: number
}

interface YearlyReport {
  year: number
  totalIncome: number
  totalExpenses: number
  totalDeductions: number
  totalTaxSavings: number
  transactionCount: number
  months: MonthlyReport[]
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    deductionAmount: 0,
    taxSavings: 0,
    accountsConnected: 0,
    lastSync: new Date().toISOString(),
  })
  const [yearlyReports, setYearlyReports] = useState<YearlyReport[]>([])
  const [categoryReports, setCategoryReports] = useState<CategoryReport[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [planType, setPlanType] = useState<"ai" | "cpa" | null>(null)

  useEffect(() => {
    checkPremiumStatus()
    loadReportsData()

    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const checkPremiumStatus = () => {
    const upgradeStatus = localStorage.getItem("upgrade_status")
    const plan = localStorage.getItem("plan_type") as "ai" | "cpa" | null
    setIsPremium(upgradeStatus === "completed")
    setPlanType(plan)
  }

  const loadReportsData = async () => {
    try {
      setLoading(true)

      // 🔹 Load all transactions using centralized utility
      const processedTransactions = await TransactionUtils.loadAllTransactions()
      setTransactions(processedTransactions)

      // 🔹 Calculate dashboard stats
      const dashboardStats = await TransactionUtils.calculateDashboardStats(processedTransactions)
      setStats(dashboardStats)

      // 🔹 Generate other reports as before
      const yearlyData = generateYearlyReports(processedTransactions)
      setYearlyReports(yearlyData)

      const categoryData = generateCategoryReports(processedTransactions)
      setCategoryReports(categoryData)

      const currentYear = new Date().getFullYear().toString()
      if (yearlyData.some((r) => r.year.toString() === currentYear)) {
        setSelectedYear(currentYear)
      } else if (yearlyData.length > 0) {
        setSelectedYear(yearlyData[0].year.toString())
      }
    } catch (error) {
      console.error("Error loading reports data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getUserTaxRate = (): number => {
    try {
      const step2Data = JSON.parse(localStorage.getItem("onboarding_step2") || "{}")
      const income = step2Data.annualIncome || 80000

      if (income > 180000) return 45
      if (income > 120000) return 37
      if (income > 45000) return 32.5
      if (income > 18200) return 19
      return 0
    } catch {
      return 32.5
    }
  }

  const generateYearlyReports = (processedTransactions: ProcessedTransaction[]): YearlyReport[] => {
    const yearlyData = new Map<number, YearlyReport>()
    const taxRate = getUserTaxRate() / 100

    processedTransactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const year = date.getFullYear()
      const month = date.getMonth()
      const amount = Number.parseFloat(transaction.amount)

      if (!yearlyData.has(year)) {
        yearlyData.set(year, {
          year,
          totalIncome: 0,
          totalExpenses: 0,
          totalDeductions: 0,
          totalTaxSavings: 0,
          transactionCount: 0,
          months: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(year, i).toLocaleDateString("en-AU", { month: "short" }),
            year,
            income: 0,
            expenses: 0,
            deductions: 0,
            taxSavings: 0,
            transactionCount: 0,
          })),
        })
      }

      const yearReport = yearlyData.get(year)!
      const monthReport = yearReport.months[month]

      yearReport.transactionCount++
      monthReport.transactionCount++

      if (amount > 0) {
        yearReport.totalIncome += amount
        monthReport.income += amount
      } else {
        const expenseAmount = Math.abs(amount)
        yearReport.totalExpenses += expenseAmount
        monthReport.expenses += expenseAmount

        if (transaction.isBusinessExpense) {
          yearReport.totalDeductions += expenseAmount
          monthReport.deductions += expenseAmount

          const taxSaving = expenseAmount * taxRate
          yearReport.totalTaxSavings += taxSaving
          monthReport.taxSavings += taxSaving
        }
      }
    })

    return Array.from(yearlyData.values()).sort((a, b) => b.year - a.year)
  }

  const generateCategoryReports = (processedTransactions: ProcessedTransaction[]): CategoryReport[] => {
    const categoryData = new Map<string, { amount: number; count: number }>()
    let totalDeductionAmount = 0

    processedTransactions.forEach((transaction) => {
      if (transaction.isBusinessExpense) {
        const category = transaction.category || "Other"
        const amount = Math.abs(Number.parseFloat(transaction.amount))
        const existing = categoryData.get(category) || { amount: 0, count: 0 }
        categoryData.set(category, {
          amount: existing.amount + amount,
          count: existing.count + 1,
        })
        totalDeductionAmount += amount
      }
    })

    return Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalDeductionAmount > 0 ? (data.amount / totalDeductionAmount) * 100 : 0,
        avgTransaction: data.count > 0 ? data.amount / data.count : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount)
  }

  const getFilteredYearlyReport = (): YearlyReport | null => {
    if (selectedYear === "all") return null
    return yearlyReports.find((report) => report.year.toString() === selectedYear) || null
  }

  const getAllTimeStats = () => {
    return yearlyReports.reduce(
      (acc, report) => ({
        totalIncome: acc.totalIncome + report.totalIncome,
        totalExpenses: acc.totalExpenses + report.totalExpenses,
        totalDeductions: acc.totalDeductions + report.totalDeductions,
        totalTaxSavings: acc.totalTaxSavings + report.totalTaxSavings,
        transactionCount: acc.transactionCount + report.transactionCount,
      }),
      {
        totalIncome: 0,
        totalExpenses: 0,
        totalDeductions: 0,
        totalTaxSavings: 0,
        transactionCount: 0,
      },
    )
  }

  const exportReport = (type: "yearly" | "category" | "monthly") => {
    if (!isPremium) {
      window.location.href = "/upgrade"
      return
    }

    let csvContent: string[][] = []
    let filename = ""

    switch (type) {
      case "yearly":
        csvContent = [
          ["Yearly Financial Report"],
          ["Generated on", new Date().toLocaleDateString("en-AU")],
          [""],
          ["Year", "Total Income", "Total Expenses", "Total Deductions", "Tax Savings", "Transactions"],
          ...yearlyReports.map((report) => [
            report.year.toString(),
            formatCurrency(report.totalIncome),
            formatCurrency(report.totalExpenses),
            formatCurrency(report.totalDeductions),
            formatCurrency(report.totalTaxSavings),
            report.transactionCount.toString(),
          ]),
        ]
        filename = `yearly-report-${new Date().toISOString().split("T")[0]}.csv`
        break

      case "category":
        csvContent = [
          ["Category Report"],
          ["Generated on", new Date().toLocaleDateString("en-AU")],
          [""],
          ["Category", "Amount", "Count", "Percentage", "Avg Transaction"],
          ...categoryReports.map((cat) => [
            cat.category,
            formatCurrency(cat.amount),
            cat.count.toString(),
            `${cat.percentage.toFixed(1)}%`,
            formatCurrency(cat.avgTransaction),
          ]),
        ]
        filename = `category-report-${new Date().toISOString().split("T")[0]}.csv`
        break

      case "monthly":
        const yearReport = getFilteredYearlyReport()
        if (!yearReport) return

        csvContent = [
          [`Monthly Report - ${yearReport.year}`],
          ["Generated on", new Date().toLocaleDateString("en-AU")],
          [""],
          ["Month", "Income", "Expenses", "Deductions", "Tax Savings", "Transactions"],
          ...yearReport.months.map((month) => [
            month.month,
            formatCurrency(month.income),
            formatCurrency(month.expenses),
            formatCurrency(month.deductions),
            formatCurrency(month.taxSavings),
            month.transactionCount.toString(),
          ]),
        ]
        filename = `monthly-report-${yearReport.year}-${new Date().toISOString().split("T")[0]}.csv`
        break
    }

    const csvString = csvContent.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Redirect non-premium users
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <DashboardSidebar />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                className="mb-6 text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <BarChart3 className="w-12 h-12 text-zinc-500" />
                  <Lock className="w-6 h-6 text-zinc-400 absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-1" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">Advanced Reports</h1>
                <p className="text-xl text-zinc-300 mb-2">Unlock detailed financial analytics</p>
                <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                  Get comprehensive yearly reports, monthly trends, category breakdowns, and export capabilities with
                  our premium plans.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <BarChart3 className="w-8 h-8 text-[#BEF397] mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Monthly Trends</h3>
                    <p className="text-zinc-400 text-sm">Track deductions over time</p>
                  </div>

                  <div className="p-6 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <PieChart className="w-8 h-8 text-[#7DD3FC] mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Category Analysis</h3>
                    <p className="text-zinc-400 text-sm">Breakdown by expense type</p>
                  </div>

                  <div className="p-6 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <Download className="w-8 h-8 text-[#E5B1FD] mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Export Options</h3>
                    <p className="text-zinc-400 text-sm">PDF, CSV, Excel formats</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => (window.location.href = "/upgrade")}
                    className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 text-lg px-8 py-3"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Access Reports
                  </Button>
                  <p className="text-sm text-zinc-500">
                    Starting from $199 - includes unlimited transactions and advanced analytics
                  </p>
                </div>
              </div>
            </div>
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
            <RefreshCw className="w-8 h-8 animate-spin text-[#BEF397] mx-auto mb-4" />
            <p className="text-white text-lg">Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  const allTimeStats = getAllTimeStats()
  const selectedYearReport = getFilteredYearlyReport()

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black font-semibold">
                    <Crown className="w-4 h-4 mr-1" />
                    {planType?.toUpperCase()} Member
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">Advanced Reports</h1>
                <p className="text-zinc-400">Comprehensive financial reports and analytics for your tax deductions.</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">All Years</SelectItem>
                    {yearlyReports.map((report) => (
                      <SelectItem key={report.year} value={report.year.toString()}>
                        {report.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={loadReportsData}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="yearly" className="data-[state=active]:bg-zinc-800">
                  Yearly
                </TabsTrigger>
                <TabsTrigger value="monthly" className="data-[state=active]:bg-zinc-800">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:bg-zinc-800">
                  Categories
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Total Income</p>
                          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalIncome)}</p>
                          <p className="text-xs text-zinc-500 mt-1">All time</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Total Expenses</p>
                          <p className="text-2xl font-bold text-white">{formatCurrency(allTimeStats.totalExpenses)}</p>
                          <p className="text-xs text-zinc-500 mt-1">All time</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Total Deductions</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(allTimeStats.totalDeductions)}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">All time</p>
                        </div>
                        <FileText className="w-8 h-8 text-[#BEF397]" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Total Tax Savings</p>
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(allTimeStats.totalTaxSavings)}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">All time</p>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-black" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Export Actions */}
                <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">Export Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={() => exportReport("yearly")}
                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Yearly Report
                      </Button>
                      <Button
                        onClick={() => exportReport("category")}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Category Report
                      </Button>
                      <Button
                        onClick={() => exportReport("monthly")}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
                        disabled={!selectedYearReport}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Monthly Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="yearly" className="space-y-6">
                {/* Yearly Reports */}
                <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>Yearly Financial Summary</span>
                      <Button
                        onClick={() => exportReport("yearly")}
                        size="sm"
                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {yearlyReports.length > 0 ? (
                      <div className="space-y-4">
                        {yearlyReports.map((report) => (
                          <div key={report.year} className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-bold text-white">{report.year}</h3>
                              <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">
                                {report.transactionCount} transactions
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Income</p>
                                <p className="text-lg font-bold text-green-400">{formatCurrency(report.totalIncome)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Expenses</p>
                                <p className="text-lg font-bold text-red-400">{formatCurrency(report.totalExpenses)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Deductions</p>
                                <p className="text-lg font-bold text-[#BEF397]">
                                  {formatCurrency(report.totalDeductions)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Tax Savings</p>
                                <p className="text-lg font-bold text-[#7DD3FC]">
                                  {formatCurrency(report.totalTaxSavings)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No yearly data available</p>
                        <p className="text-sm text-zinc-500">Upload statements to generate yearly reports</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="space-y-6">
                {/* Monthly Reports */}
                {selectedYearReport ? (
                  <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>Monthly Breakdown - {selectedYearReport.year}</span>
                        <Button
                          onClick={() => exportReport("monthly")}
                          size="sm"
                          className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedYearReport.months.map((month) => (
                          <div key={month.month} className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-white">{month.month}</h4>
                              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                                {month.transactionCount}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-zinc-400">Income</span>
                                <span className="text-sm text-green-400">{formatCurrency(month.income)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-zinc-400">Expenses</span>
                                <span className="text-sm text-red-400">{formatCurrency(month.expenses)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-zinc-400">Deductions</span>
                                <span className="text-sm text-[#BEF397]">{formatCurrency(month.deductions)}</span>
                              </div>
                              <div className="flex justify-between border-t border-zinc-700 pt-2">
                                <span className="text-sm font-medium text-white">Tax Savings</span>
                                <span className="text-sm font-medium text-[#7DD3FC]">
                                  {formatCurrency(month.taxSavings)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">Select a year to view monthly breakdown</p>
                        <p className="text-sm text-zinc-500">Choose a specific year from the dropdown above</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                {/* Category Reports */}
                <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>Category Analysis</span>
                      <Button
                        onClick={() => exportReport("category")}
                        size="sm"
                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {categoryReports.length > 0 ? (
                      <div className="space-y-4">
                        {categoryReports.map((category, index) => (
                          <div
                            key={category.category}
                            className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full",
                                    index === 0 && "bg-[#BEF397]",
                                    index === 1 && "bg-[#7DD3FC]",
                                    index === 2 && "bg-purple-500",
                                    index === 3 && "bg-orange-500",
                                    index === 4 && "bg-pink-500",
                                    index >= 5 && "bg-zinc-500",
                                  )}
                                />
                                <h4 className="font-semibold text-white">{category.category}</h4>
                              </div>
                              <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">
                                {category.count} transactions
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Total Amount</p>
                                <p className="text-lg font-bold text-white">{formatCurrency(category.amount)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Percentage</p>
                                <p className="text-lg font-bold text-[#7DD3FC]">{category.percentage.toFixed(1)}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Avg Transaction</p>
                                <p className="text-lg font-bold text-[#BEF397]">
                                  {formatCurrency(category.avgTransaction)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-zinc-400">Tax Savings</p>
                                <p className="text-lg font-bold text-green-400">
                                  {formatCurrency(category.amount * (getUserTaxRate() / 100))}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <PieChart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No category data available</p>
                        <p className="text-sm text-zinc-500">Upload statements to generate category reports</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
