"use client"

import { useState, useEffect } from "react"
import { Calculator, DollarSign, TrendingUp, FileText, ArrowRight, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { TransactionUtils } from "@/lib/transaction-utils"

interface TaxCalculation {
  grossIncome: number
  taxableIncome: number
  totalDeductions: number
  taxOwed: number
  taxRate: number
  refundAmount: number
  effectiveTaxRate: number
}

export default function CalculatorPage() {
  const [income, setIncome] = useState("")
  const [deductions, setDeductions] = useState("")
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("")
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>([])
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState({ income: false, deductions: false })
  const [allTransactions, setAllTransactions] = useState<any[]>([])

  useEffect(() => {
    loadUserData()

    // Listen for sidebar state changes
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  // Reload deductions when financial year changes
  useEffect(() => {
    if (!loading && selectedFinancialYear && allTransactions.length > 0) {
      loadDeductionsForFinancialYear(selectedFinancialYear)
    }
  }, [selectedFinancialYear, allTransactions])

  const loadDeductionsForFinancialYear = async (financialYear: string) => {
    try {
      console.log(`📊 Loading deductions for financial year: ${financialYear}`)

      // Filter transactions by financial year using the same logic as dashboard
      const year = Number.parseInt(financialYear.replace("FY", ""))
      const startDate = new Date(year - 1, 6, 1) // July 1st of previous year
      const endDate = new Date(year, 5, 30, 23, 59, 59) // June 30th of current year

      console.log("📅 Financial year period:", { startDate, endDate })

      const filteredTransactions = allTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= startDate && transactionDate <= endDate
      })

      console.log(
        `📊 Transactions in ${TransactionUtils.formatFinancialYear(financialYear)}:`,
        filteredTransactions.length,
      )

      const totalDeductions = TransactionUtils.getTotalDeductions(filteredTransactions)
      console.log(`📊 Total deductions for ${TransactionUtils.formatFinancialYear(financialYear)}:`, totalDeductions)

      if (totalDeductions > 0) {
        setDeductions(Math.round(totalDeductions).toString())
        setDataLoaded((prev) => ({ ...prev, deductions: true }))
        console.log("✅ Updated deductions for financial year:", totalDeductions)
      } else {
        setDeductions("")
        setDataLoaded((prev) => ({ ...prev, deductions: false }))
        console.log("❌ No deductions found for financial year")
      }
    } catch (error) {
      console.error("❌ Error loading deductions for financial year:", error)
    }
  }

  const loadUserData = async () => {
    try {
      setLoading(true)
      console.log("🔄 Loading user data for calculator...")

      let loadedIncome = ""
      let incomeLoaded = false

      // Load user income
      try {
        console.log("💰 Fetching user income...")
        const userIncome = await TransactionUtils.getUserIncome()
        console.log("💰 User income result:", userIncome)

        if (userIncome && userIncome > 0) {
          loadedIncome = userIncome.toString()
          incomeLoaded = true
          console.log("✅ Pre-filled income:", userIncome)
        } else {
          console.log("❌ No valid income found")
        }
      } catch (error) {
        console.error("❌ Error loading user income:", error)
      }

      // Load all transactions and get available financial years
      try {
        console.log("📊 Loading all transactions...")
        const transactions = await TransactionUtils.loadAllTransactions()
        console.log("📊 Total transactions loaded:", transactions.length)

        setAllTransactions(transactions)

        // Get available financial years from transactions (same as dashboard)
        const fyears = TransactionUtils.getAvailableFinancialYears(transactions)
        setAvailableFinancialYears(fyears)

        // Set default to current financial year if available (same as dashboard)
        const currentFY = TransactionUtils.getCurrentFinancialYear()
        const defaultFY = fyears.includes(currentFY) ? currentFY : fyears[0] || currentFY
        setSelectedFinancialYear(defaultFY)

        console.log("📅 Available financial years:", fyears)
        console.log("📅 Selected financial year:", defaultFY)
      } catch (error) {
        console.error("❌ Error loading transactions:", error)
      }

      // Set income state
      setIncome(loadedIncome)
      setDataLoaded((prev) => ({ ...prev, income: incomeLoaded }))
    } catch (error) {
      console.error("❌ Error loading user data:", error)
    } finally {
      setLoading(false)
      console.log("✅ Loading complete")
    }
  }

  // Auto-calculate when both fields are populated (but not during initial loading)
  useEffect(() => {
    if (income && deductions && !loading) {
      console.log("🧮 Auto-calculating from useEffect...")
      calculateTax()
    }
  }, [income, deductions, loading])

  const calculateTaxWithValues = (incomeValue: string, deductionsValue: string) => {
    const grossIncome = Number.parseFloat(incomeValue) || 0
    const totalDeductions = Number.parseFloat(deductionsValue) || 0

    console.log("🧮 Calculating tax with:", { grossIncome, totalDeductions })

    const taxableIncome = Math.max(0, grossIncome - totalDeductions)

    // Australian tax brackets 2024-25
    let taxOwed = 0
    let taxRate = 0

    if (taxableIncome <= 18200) {
      taxOwed = 0
      taxRate = 0
    } else if (taxableIncome <= 45000) {
      taxOwed = (taxableIncome - 18200) * 0.19
      taxRate = 19
    } else if (taxableIncome <= 120000) {
      taxOwed = 5092 + (taxableIncome - 45000) * 0.325
      taxRate = 32.5
    } else if (taxableIncome <= 180000) {
      taxOwed = 29467 + (taxableIncome - 120000) * 0.37
      taxRate = 37
    } else {
      taxOwed = 51667 + (taxableIncome - 180000) * 0.45
      taxRate = 45
    }

    const effectiveTaxRate = grossIncome > 0 ? (taxOwed / grossIncome) * 100 : 0
    const refundAmount = totalDeductions * (taxRate / 100)

    const result = {
      grossIncome,
      taxableIncome,
      totalDeductions,
      taxOwed,
      taxRate,
      refundAmount,
      effectiveTaxRate,
    }

    console.log("🧮 Tax calculation result:", result)
    setCalculation(result)
  }

  const calculateTax = () => {
    calculateTaxWithValues(income, deductions)
  }

  const handleFinancialYearChange = (newFinancialYear: string) => {
    console.log("📅 Financial year changed to:", TransactionUtils.formatFinancialYear(newFinancialYear))
    setSelectedFinancialYear(newFinancialYear)
    // Clear calculation when financial year changes
    setCalculation(null)
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <DashboardHeader />

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-[#BEF397]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Tax Calculator</h1>
              <p className="text-zinc-400 mt-1">Calculate your potential tax savings and refunds</p>
            </div>
          </div>

          {/* Data Loading Alert */}
          {(dataLoaded.income || dataLoaded.deductions) && !loading && (
            <Alert className="border-[#BEF397]/30 bg-[#BEF397]/10">
              <Info className="h-4 w-4 text-[#BEF397]" />
              <AlertDescription className="text-[#BEF397]">
                <strong>Smart Pre-fill:</strong> {dataLoaded.income && "Annual income loaded from your profile"}{" "}
                {dataLoaded.income && dataLoaded.deductions && "• "}{" "}
                {dataLoaded.deductions &&
                  selectedFinancialYear &&
                  `Tax deductions calculated for ${TransactionUtils.formatFinancialYear(selectedFinancialYear)}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-zinc-900/80 border-zinc-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#BEF397]" />
                    Income & Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-[#BEF397]/30 border-t-[#BEF397] rounded-full animate-spin" />
                      <span className="ml-3 text-zinc-400">Loading your data...</span>
                    </div>
                  )}

                  {!loading && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="financialYear" className="text-zinc-300">
                          Financial Year
                        </Label>
                        <Select value={selectedFinancialYear} onValueChange={handleFinancialYearChange}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Select Financial Year" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {availableFinancialYears.map((year) => (
                              <SelectItem key={year} value={year} className="text-white hover:bg-zinc-800">
                                {TransactionUtils.formatFinancialYear(year)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedFinancialYear && (
                          <p className="text-xs text-zinc-500">
                            July 1, {Number.parseInt(selectedFinancialYear.replace("FY", "")) - 1} - June 30,{" "}
                            {selectedFinancialYear.replace("FY", "")}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="income" className="text-zinc-300">
                          Annual Gross Income{" "}
                          {dataLoaded.income && <span className="text-[#BEF397] text-xs">(from your profile)</span>}
                        </Label>
                        <Input
                          id="income"
                          type="number"
                          placeholder="e.g., 75000"
                          value={income}
                          onChange={(e) => {
                            console.log("💰 Income changed to:", e.target.value)
                            setIncome(e.target.value)
                          }}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                        />
                        {dataLoaded.income && income && (
                          <p className="text-xs text-[#BEF397]">
                            ✓ Loaded:{" "}
                            {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                              Number(income),
                            )}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deductions" className="text-zinc-300">
                          Total Tax Deductions{" "}
                          {dataLoaded.deductions && selectedFinancialYear && (
                            <span className="text-[#BEF397] text-xs">
                              (for {TransactionUtils.formatFinancialYear(selectedFinancialYear)})
                            </span>
                          )}
                        </Label>
                        <Input
                          id="deductions"
                          type="number"
                          placeholder="e.g., 5000"
                          value={deductions}
                          onChange={(e) => {
                            console.log("📊 Deductions changed to:", e.target.value)
                            setDeductions(e.target.value)
                          }}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                        />
                        {dataLoaded.deductions && deductions && selectedFinancialYear && (
                          <p className="text-xs text-[#BEF397]">
                            ✓ Loaded for {TransactionUtils.formatFinancialYear(selectedFinancialYear)}:{" "}
                            {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                              Number(deductions),
                            )}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={calculateTax}
                        className="w-full bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-semibold"
                        disabled={!income}
                      >
                        Calculate Tax
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Results */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              {calculation ? (
                <Card className="bg-zinc-900/80 border-zinc-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#BEF397]" />
                      Tax Calculation Results
                      {selectedFinancialYear && (
                        <span className="text-sm font-normal text-zinc-400">
                          ({TransactionUtils.formatFinancialYear(selectedFinancialYear)})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-400">Gross Income</p>
                        <p className="text-lg font-semibold text-white">
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                            calculation.grossIncome,
                          )}
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-400">Total Deductions</p>
                        <p className="text-lg font-semibold text-[#BEF397]">
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                            calculation.totalDeductions,
                          )}
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-400">Taxable Income</p>
                        <p className="text-lg font-semibold text-white">
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                            calculation.taxableIncome,
                          )}
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-400">Tax Rate</p>
                        <p className="text-lg font-semibold text-[#7DD3FC]">{calculation.taxRate}%</p>
                      </div>

                      <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-400">Tax Owed</p>
                        <p className="text-lg font-semibold text-red-400">
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                            calculation.taxOwed,
                          )}
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-400">Potential Refund</p>
                        <p className="text-lg font-semibold text-[#BEF397]">
                          {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                            calculation.refundAmount,
                          )}
                        </p>
                      </div>
                    </div>

                    <Alert className="border-[#BEF397]/30 bg-[#BEF397]/10">
                      <Info className="h-4 w-4 text-[#BEF397]" />
                      <AlertDescription className="text-[#BEF397]">
                        Your effective tax rate is {calculation.effectiveTaxRate.toFixed(1)}%. This calculation is an
                        estimate based on standard tax brackets
                        {selectedFinancialYear && ` for ${TransactionUtils.formatFinancialYear(selectedFinancialYear)}`}
                        .
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-zinc-900/80 border-zinc-700/50">
                  <CardContent className="p-12 text-center">
                    {loading ? (
                      <>
                        <div className="w-16 h-16 border-4 border-[#BEF397]/30 border-t-[#BEF397] rounded-full animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-400 mb-2">Loading Your Data</h3>
                        <p className="text-zinc-500">Fetching your income and deductions...</p>
                      </>
                    ) : (
                      <>
                        <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-400 mb-2">
                          {income || deductions ? "Ready to Calculate" : "Enter Your Details"}
                        </h3>
                        <p className="text-zinc-500">
                          {income || deductions
                            ? `Your data has been loaded${selectedFinancialYear ? ` for ${TransactionUtils.formatFinancialYear(selectedFinancialYear)}` : ""}. Click Calculate Tax to see results.`
                            : "Fill in your income and deductions to see your tax calculation"}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          {/* Tax Brackets Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-zinc-900/80 border-zinc-700/50">
              <CardHeader>
                <CardTitle className="text-white">Australian Tax Brackets 2024-25</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
                    <p className="text-sm text-zinc-400">$0 - $18,200</p>
                    <p className="text-lg font-semibold text-green-400">0%</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
                    <p className="text-sm text-zinc-400">$18,201 - $45,000</p>
                    <p className="text-lg font-semibold text-blue-400">19%</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
                    <p className="text-sm text-zinc-400">$45,001 - $120,000</p>
                    <p className="text-lg font-semibold text-yellow-400">32.5%</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
                    <p className="text-sm text-zinc-400">$120,001 - $180,000</p>
                    <p className="text-lg font-semibold text-orange-400">37%</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
                    <p className="text-sm text-zinc-400">$180,001+</p>
                    <p className="text-lg font-semibold text-red-400">45%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
