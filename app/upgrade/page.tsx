"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ArrowRight,
  Zap,
  BarChart3,
  FileText,
  Receipt,
  Shield,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Loader2,
  Crown,
  Award,
  Infinity,
  Brain,
  Calculator,
  CheckCircle,
  Phone,
  UserCheck,
  FileCheck,
  Sparkles,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { TransactionUtils } from "@/lib/transaction-utils"

interface UserStats {
  deductionAmount: number
  taxSavings: number
  potentialRefund: number
  userIncome: number
  totalTransactions: number
  businessExpenses: number
  taxRate: number
}

export default function UpgradePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"ai" | "cpa" | "premium" | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  useEffect(() => {
    loadUserStatsCached()

    // Listen for sidebar state changes
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const loadUserStatsCached = async () => {
    try {
      setStatsLoading(true)
      console.log("📊 Loading user stats for upgrade page...")

      // Check cache first
      const cacheKey = "upgrade_stats_cache"
      const cached = localStorage.getItem(cacheKey)

      if (cached) {
        const { stats, timestamp } = JSON.parse(cached)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

        // Use cached data if it's less than 5 minutes old
        if (timestamp > fiveMinutesAgo) {
          console.log("💾 Using cached upgrade stats:", stats)
          setUserStats(stats)
          setStatsLoading(false)
          return
        }
      }

      console.log("🔄 Loading fresh upgrade stats from TransactionUtils...")

      // Load transactions using the SAME method as transactions page
      const processedTransactions = await TransactionUtils.loadAllTransactions(true) // Enable AI

      // Get deduction toggles to filter properly (same as transactions page)
      const deductionToggles = TransactionUtils.getDeductionToggles()

      // Filter transactions by enabled deduction types (same logic as transactions page)
      const deductionFilteredTransactions = processedTransactions.filter((transaction) => {
        let matchesDeductionSettings = true
        if (transaction.isBusinessExpense && transaction.deductionType) {
          matchesDeductionSettings = deductionToggles[transaction.deductionType] === true
        }
        return matchesDeductionSettings
      })

      // Calculate stats using the SAME method as transactions page
      const dashboardStats = await TransactionUtils.calculateDashboardStats(deductionFilteredTransactions)

      // Get user income and tax rate
      const userIncome = await TransactionUtils.getUserIncome()
      const taxRate = await TransactionUtils.getUserTaxRate()

      // Calculate business expenses count (same logic as transactions page)
      const businessExpenses = deductionFilteredTransactions.filter((t) => {
        const isBusiness = t.isBusinessExpense === true
        const amount = Number.parseFloat(t.amount.toString()) || 0
        return isBusiness && amount < 0
      }).length

      // Calculate potential refund with premium optimizations (50% improvement estimate)
      const potentialRefund = dashboardStats.taxSavings + dashboardStats.taxSavings * 0.5

      const stats: UserStats = {
        deductionAmount: dashboardStats.deductionAmount,
        taxSavings: dashboardStats.taxSavings,
        potentialRefund,
        userIncome,
        totalTransactions: dashboardStats.totalTransactions,
        businessExpenses,
        taxRate,
      }

      // Cache the results
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          stats,
          timestamp: Date.now(),
        }),
      )

      setUserStats(stats)

      console.log("📈 User stats loaded and cached for upgrade (consistent with transactions page):", stats)
    } catch (error) {
      console.error("💥 Error loading user stats:", error)

      // Fallback to reasonable defaults if API fails
      const fallbackStats: UserStats = {
        deductionAmount: 3500,
        taxSavings: 1137,
        potentialRefund: 1706,
        userIncome: 85000,
        totalTransactions: 150,
        businessExpenses: 45,
        taxRate: 32.5,
      }

      setUserStats(fallbackStats)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleUpgrade = async (planType: "ai" | "cpa" | "premium") => {
    try {
      setLoading(true)
      setSelectedPlan(planType)

      console.log("🚀 Starting upgrade process for plan:", planType)

      // Store plan information for success page
      localStorage.setItem("pending_upgrade", "true")
      localStorage.setItem("plan_type", planType)
      localStorage.setItem("upgrade_date", new Date().toISOString())

      // Get checkout URL from API
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()

      if (data.success && data.paymentUrl) {
        console.log("💳 Redirecting to Stripe payment:", data.paymentUrl)
        // Redirect to Stripe payment link
        window.location.href = data.paymentUrl
      } else {
        console.error("❌ Failed to create checkout:", data.error)
        alert("Failed to create checkout session. Please try again.")
      }
    } catch (error) {
      console.error("💥 Error during upgrade:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount)
  }

  const calculateSavings = () => {
    if (!userStats) return 0
    return userStats.potentialRefund - userStats.taxSavings
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-12">
              <Badge className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black px-6 py-2 mb-6 text-sm font-bold">
                <Crown className="w-4 h-4 mr-2" />
                PREMIUM UPGRADE
              </Badge>

              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-[#BEF397] to-[#7DD3FC] bg-clip-text text-transparent mb-4">
                Maximize Your Tax Refund
              </h1>
              <p className="text-xl text-zinc-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Choose the perfect plan to unlock AI-powered tax optimization and professional CPA services
              </p>

              {/* Enhanced Current Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm border border-zinc-700/50">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="w-8 h-8 text-[#BEF397] mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 mb-2">Current Deductions</p>
                    {statsLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#BEF397] mx-auto" />
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        {userStats ? formatCurrency(userStats.deductionAmount) : formatCurrency(0)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm border border-zinc-700/50">
                  <CardContent className="p-6 text-center">
                    <Calculator className="w-8 h-8 text-[#7DD3FC] mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 mb-2">Tax Savings</p>
                    {statsLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#7DD3FC] mx-auto" />
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        {userStats ? formatCurrency(userStats.taxSavings) : formatCurrency(0)}
                      </p>
                    )}
                    {userStats && (
                      <p className="text-xs text-zinc-500 mt-1">At {userStats.taxRate.toFixed(1)}% marginal rate</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* AI Smart Review Plan */}
              <Card className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-2 border-[#BEF397]/30 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#BEF397]/5 via-[#7DD3FC]/5 to-purple-500/5" />

                <Badge className="absolute top-4 right-4 bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">
                  Most Popular
                </Badge>

                <CardHeader className="text-center pb-6 pt-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Zap className="w-8 h-8 text-black" />
                  </div>

                  <CardTitle className="text-2xl text-white mb-2">AI Smart Review</CardTitle>
                  <p className="text-zinc-300 mb-4 text-sm leading-relaxed">
                    AI-powered optimization with unlimited features
                  </p>



                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] bg-clip-text text-transparent">
                      19.99
                    </span>
                    <span className="text-zinc-400 ml-2 text-sm">/month</span>
                    <p className="text-lg font-semibold text-zinc-500 mt-1">Billed annually at $240</p>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 relative z-10">
                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {[
                      { icon: Infinity, text: "Unlimited transaction analysis" },
                      { icon: Brain, text: "AI-powered deduction detection" },
                      { icon: BarChart3, text: "Advanced analytics & insights" },
                      { icon: FileText, text: "Export to PDF, CSV, Excel" },
                      { icon: Target, text: "Tax optimization suggestions" },
                      { icon: Shield, text: "Priority email support" },
                      { icon: Receipt, text: "Subscription cost can be tax deductible" },
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-2">
                        <feature.icon className="w-4 h-4 text-[#BEF397] flex-shrink-0" />
                        <span className="text-zinc-200 text-sm">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleUpgrade("ai")}
                    disabled={loading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 font-bold py-3 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    {loading && selectedPlan === "ai" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Get AI Smart Review
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Premium CPA Plan */}
              <Card className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-2 border-purple-500/30 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-[#7DD3FC]/5 to-pink-500/5" />

                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Best Value
                </Badge>

                <CardHeader className="text-center pb-6 pt-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>

                  <CardTitle className="text-2xl text-white mb-2">Premium CPA Service</CardTitle>
                  <p className="text-zinc-300 mb-4 text-sm leading-relaxed">
                    Complete CPA review, lodgment & optimization
                  </p>

                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      $49.92
                    </span>
                    <span className="text-zinc-400 ml-2 text-sm">/month</span>
                    <p className="text-lg font-semibold text-zinc-500 mt-1"> Billed annually at $599</p>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 relative z-10">
                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {[
                      { icon: CheckCircle, text: "Everything in AI Smart Review" },
                      { icon: UserCheck, text: "Personal CPA consultation" },
                      { icon: Phone, text: "1-on-1 phone/video calls" },
                      { icon: FileCheck, text: "Professional tax lodgment" },
                      { icon: Target, text: "Personalized tax strategies" },
                      { icon: Sparkles, text: "Tax return optimization" },
                      { icon: Shield, text: "Audit protection & support" },
                      { icon: Crown, text: "Priority phone support" },
                       { icon: Receipt, text: "Subscription cost can be tax deductible" },
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-2">
                        <feature.icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-zinc-200 text-sm">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleUpgrade("premium")}
                    disabled={loading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 font-bold py-3 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    {loading && selectedPlan === "premium" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5 mr-2" />
                        Get Premium CPA Service
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-zinc-500 text-xs mt-3">Includes professional tax lodgment service</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                {
                  icon: TrendingUp,
                  title: "50% More Savings",
                  description: "Find deductions you missed with AI analysis",
                  color: "text-green-400",
                  bgColor: "from-green-500/10 to-emerald-500/10",
                },
                {
                  icon: Clock,
                  title: "Save 10+ Hours",
                  description: "Automated processing and categorization",
                  color: "text-blue-400",
                  bgColor: "from-blue-500/10 to-cyan-500/10",
                },
                {
                  icon: Users,
                  title: "10,000+ Users",
                  description: "Trusted by thousands of Australians",
                  color: "text-purple-400",
                  bgColor: "from-purple-500/10 to-pink-500/10",
                },
                {
                  icon: Award,
                  title: "Expert Accuracy",
                  description: "ATO-compliant analysis and reporting",
                  color: "text-orange-400",
                  bgColor: "from-orange-500/10 to-red-500/10",
                },
              ].map((benefit, index) => (
                <Card
                  key={index}
                  className={`bg-gradient-to-br ${benefit.bgColor} border border-zinc-700/50 hover:border-zinc-600/50 transition-all`}
                >
                  <CardContent className="p-6 text-center">
                    <benefit.icon className={`w-12 h-12 ${benefit.color} mx-auto mb-4`} />
                    <h3 className="text-white font-semibold mb-2 text-lg">{benefit.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trust Indicators */}
            <Card className="bg-zinc-900/30 border border-zinc-800/50 mb-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-8 text-zinc-400">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="font-semibold text-white">Secure Payment</p>
                      <p className="text-sm">256-bit SSL encryption</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="font-semibold text-white">Instant Access</p>
                      <p className="text-sm">Immediate activation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="font-semibold text-white">30-Day Guarantee</p>
                      <p className="text-sm">Full money-back promise</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center">
              <p className="text-zinc-500 text-sm">
                Powered by Stripe • Your payment information is secure and encrypted
              </p>
              <p className="text-zinc-600 text-xs mt-2">Questions? Contact our support team for assistance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
