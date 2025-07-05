"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Crown,
  Sparkles,
  ArrowRight,
  BarChart3,
  Users,
  Calendar,
  Target,
  AlertCircle,
  RefreshCw,
  Shield,
  TrendingUp,
  ChevronRight,
  Play,
  Zap,
  Star,
  Gift,
  Rocket,
  Heart,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { TransactionUtils } from "@/lib/transaction-utils"

export default function UpgradeSuccessPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [planType, setPlanType] = useState<"ai" | "cpa" | null>(null)
  const [upgrade, setUpgrade] = useState<{
    date: string
    status: string
    planType: string
  } | null>(null)
  const [userStats, setUserStats] = useState({
    deductionAmount: 0,
    taxSavings: 0,
    potentialRefund: 0,
    userIncome: 80000,
  })
  const [updating, setUpdating] = useState(true)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initializeUpgrade()

    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const initializeUpgrade = async () => {
    try {
      setUpdating(true)
      setUpdateError(null)

      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get("session_id")
      const planFromUrl = urlParams.get("plan") as "ai" | "cpa"

      const pendingUpgrade = localStorage.getItem("pending_upgrade")
      const planType = localStorage.getItem("plan_type") as "ai" | "cpa"
      const upgradeDate = localStorage.getItem("upgrade_date")

      let finalPlanType: "ai" | "cpa" = "ai"
      let finalUpgradeDate = new Date().toISOString()

      if (sessionId && planFromUrl) {
        finalPlanType = planFromUrl
        finalUpgradeDate = new Date().toISOString()
      } else if (pendingUpgrade && planType && upgradeDate) {
        finalPlanType = planType
        finalUpgradeDate = upgradeDate
      } else {
        finalPlanType = "ai"
        finalUpgradeDate = new Date().toISOString()
      }

      const upgradeInfo = {
        status: "completed",
        planType: finalPlanType,
        date: finalUpgradeDate,
      }

      setUpgrade(upgradeInfo)
      setPlanType(finalPlanType)

      const updateResult = await updateSubscription(finalPlanType, finalUpgradeDate)

      if (updateResult) {
        setUpdateSuccess(true)
        await loadUserStats()

        // Show confetti animation
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)

        // Refresh Next.js cache so dashboard data is fresh
        router.refresh()

        // Clean up upgrade flags
        localStorage.removeItem("pending_upgrade")
        localStorage.removeItem("plan_type")
        localStorage.removeItem("upgrade_date")

        // Clean premium status cache so next page load fetches fresh status
        localStorage.removeItem("premium_status_cache")

        // Pre-warm the cache immediately so user doesn't see gating flash
        try {
          const res = await fetch("/api/auth/me", {
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache",
            },
          })
          if (res.ok) {
            const data = await res.json()
            const isPremium = data.user?.subscription?.plan === "premium"
            const userId = data.user?.id
            if (userId) {
              localStorage.setItem(
                "premium_status_cache",
                JSON.stringify({
                  userId,
                  isPremium,
                  timestamp: Date.now(),
                }),
              )
            }
          }
        } catch (error) {
          console.warn("Could not pre-warm premium status:", error)
        }

        // Animate steps
        setTimeout(() => setCurrentStep(1), 1500)
        setTimeout(() => setCurrentStep(2), 2500)
        setTimeout(() => setCurrentStep(3), 3500)
      } else {
        setUpdateSuccess(true)
      }
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setUpdating(false)
    }
  }

  const updateSubscription = async (planType: string, upgradeDate: string): Promise<boolean> => {
    try {
      const requestBody = {
        plan: "premium",
        planType: planType,
        status: "active",
        upgradeDate: upgradeDate,
      }

      const response = await fetch("/api/auth/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return true
      } else {
        setUpdateError(data.error || data.details || "Failed to update subscription")
        return true
      }
    } catch (error) {
      return true
    }
  }

  const loadUserStats = async () => {
    try {
      const processedTransactions = await TransactionUtils.loadAllTransactions()
      const stats = await TransactionUtils.calculateDashboardStats(processedTransactions)
      const userIncome = await TransactionUtils.getUserIncome()
      const potentialRefund = stats.taxSavings + stats.taxSavings * 0.3

      setUserStats({
        deductionAmount: stats.deductionAmount,
        taxSavings: stats.taxSavings,
        potentialRefund,
        userIncome,
      })
    } catch (error) {
      setUserStats({
        deductionAmount: 5000,
        taxSavings: 1500,
        potentialRefund: 2000,
        userIncome: 80000,
      })
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setUpdateError(null)
    initializeUpgrade()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount)
  }

  const getPlanName = (type: string) => {
    return type === "ai" ? "AI Smart Review" : "CPA Professional Review"
  }

  const getSteps = (type: string) => {
    if (type === "ai") {
      return [
        {
          id: 1,
          title: "Explore Your Dashboard",
          description: "See your tax savings and deductions in real-time",
          icon: <BarChart3 className="w-5 h-5" />,
          action: "View Dashboard",
          href: "/dashboard",
          time: "2 min",
          color: "from-[#BEF397] to-[#7DD3FC]",
        },
        {
          id: 2,
          title: "Review Tax Details",
          description: "Understand exactly how much you can save",
          icon: <Target className="w-5 h-5" />,
          action: "Check Details",
          href: "/tax-details",
          time: "5 min",
          color: "from-[#7DD3FC] to-purple-500",
        },
      ]
    } else {
      return [
        {
          id: 1,
          title: "Schedule Your CPA Call",
          description: "Book a personal consultation with a tax expert",
          icon: <Calendar className="w-5 h-5" />,
          action: "Schedule Now",
          href: "/contact-cpa",
          time: "3 min",
          color: "from-[#BEF397] to-[#7DD3FC]",
        },
        {
          id: 2,
          title: "Review Your Analysis",
          description: "See your personalized tax optimization plan",
          icon: <Target className="w-5 h-5" />,
          action: "View Analysis",
          href: "/tax-details",
          time: "5 min",
          color: "from-[#7DD3FC] to-purple-500",
        },
        {
          id: 3,
          title: "Access Premium Tools",
          description: "Use all advanced features and reports",
          icon: <Zap className="w-5 h-5" />,
          action: "Explore Tools",
          href: "/dashboard",
          time: "2 min",
          color: "from-purple-500 to-pink-500",
        },
      ]
    }
  }

  // Error state
  if (updateError && !updateSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 blur-xl"
              style={{
                width: `${100 + Math.random() * 50}px`,
                height: `${100 + Math.random() * 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 20, -20, 0],
                y: [0, -20, 20, 0],
                scale: [1, 1.1, 0.9, 1],
              }}
              transition={{
                duration: 6 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex">
          <DashboardSidebar />
          <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center min-h-[60vh]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-red-500/20"
                    >
                      <AlertCircle className="w-10 h-10 text-red-400" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
                    <p className="text-zinc-400 mb-8 max-w-md">
                      Your payment was successful, but we're having trouble setting up your account.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleRetry}
                        className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 font-semibold"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent backdrop-blur-xl"
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (!upgrade || updating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-[#BEF397]/10 to-[#7DD3FC]/10 blur-xl"
              style={{
                width: `${120 + Math.random() * 80}px`,
                height: `${120 + Math.random() * 80}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 30, -30, 0],
                y: [0, -30, 30, 0],
                scale: [1, 1.2, 0.8, 1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex">
          <DashboardSidebar />
          <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center min-h-[60vh]">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="relative mb-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-24 h-24 border-4 border-[#BEF397]/20 border-t-[#BEF397] rounded-full mx-auto"
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="absolute inset-2 border-4 border-[#7DD3FC]/20 border-b-[#7DD3FC] rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <Sparkles className="w-8 h-8 text-[#BEF397]" />
                        </motion.div>
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Setting up your premium account</h2>
                    <p className="text-zinc-400 mb-8">Activating all your premium features...</p>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="p-6 bg-gradient-to-r from-green-500/10 to-[#BEF397]/10 rounded-2xl border border-green-500/20 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 font-semibold">Payment successful</p>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success page
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-[#BEF397]/10 to-[#7DD3FC]/10 blur-xl"
            style={{
              width: `${150 + Math.random() * 100}px`,
              height: `${150 + Math.random() * 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 40, -40, 0],
              y: [0, -40, 40, 0],
              scale: [1, 1.3, 0.7, 1],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-10%",
                }}
                initial={{ y: -100, rotate: 0, opacity: 1 }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: 360,
                  opacity: 0,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeOut",
                }}
              >
                {["🎉", "🎊", "✨", "🎈", "🌟"][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex">
        <DashboardSidebar />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              {/* Success Header */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="relative mb-8"
                >
                  <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <CheckCircle className="w-14 h-14 text-white" />
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                  >
                    <Star className="w-5 h-5 text-white" />
                  </motion.div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <h1 className="text-5xl font-bold text-white mb-4">
                    Welcome to Premium! <span className="text-4xl">🎉</span>
                  </h1>
                  <p className="text-2xl text-zinc-300 mb-4">
                    Your <span className="text-[#BEF397] font-semibold">{getPlanName(upgrade.planType)}</span> is now
                    active
                  </p>
                  <Badge className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black font-bold px-6 py-2 text-lg">
                    <Crown className="w-5 h-5 mr-2" />
                    Premium Account Activated
                  </Badge>
                </motion.div>
              </motion.div>



              {/* Getting Started Guide */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                <Card className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 mb-8 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-xl flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-black" />
                      </div>
                      Getting Started Guide
                    </CardTitle>
                    <p className="text-zinc-400">Follow these steps to maximize your tax savings</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {getSteps(upgrade.planType).map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + index * 0.2 }}
                          className={`flex items-center gap-4 p-6 rounded-2xl border transition-all duration-500 ${
                            currentStep >= step.id
                              ? "bg-gradient-to-r from-[#BEF397]/10 to-[#7DD3FC]/10 border-[#BEF397]/30 shadow-lg"
                              : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                          }`}
                        >
                          {/* Step Number */}
                          <motion.div
                            animate={currentStep >= step.id ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.5 }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                              currentStep >= step.id
                                ? `bg-gradient-to-r ${step.color} text-black shadow-lg`
                                : "bg-zinc-700 text-zinc-400"
                            }`}
                          >
                            {currentStep >= step.id ? <CheckCircle className="w-6 h-6" /> : step.id}
                          </motion.div>

                          {/* Step Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-white font-semibold text-lg">{step.title}</h4>
                              <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400 bg-zinc-800/50">
                                {step.time}
                              </Badge>
                            </div>
                            <p className="text-zinc-400">{step.description}</p>
                          </div>

                          {/* Step Icon */}
                          <div className="text-[#BEF397] p-2 bg-[#BEF397]/10 rounded-lg">{step.icon}</div>

                          {/* Action Button */}
                          <Button
                            onClick={() => router.push(step.href)}
                            className={
                              currentStep >= step.id
                                ? `bg-gradient-to-r ${step.color} text-black hover:opacity-90 font-semibold shadow-lg`
                                : "bg-zinc-700 text-white hover:bg-zinc-600"
                            }
                          >
                            {step.action}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Premium Features */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
                <Card className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 mb-8 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-xl flex items-center gap-3">
                      <Gift className="w-6 h-6 text-[#BEF397]" />
                      Your Premium Features Are Now Active
                    </CardTitle>
                    <p className="text-zinc-400">Everything you need to maximize your tax refund</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        "Unlimited transaction analysis",
                        "Advanced tax optimization",
                        "Detailed reports & exports",
                        "Priority customer support",
                        "Monthly trends analysis",
                        "Category breakdown charts",
                      ].map((feature, index) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.4 + index * 0.1 }}
                          className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-[#BEF397]/10 rounded-xl border border-green-500/20"
                        >
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-zinc-300">{feature}</span>
                        </motion.div>
                      ))}
                      {upgrade.planType === "cpa" && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 2 }}
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-[#7DD3FC]/10 rounded-xl border border-purple-500/20"
                          >
                            <Users className="w-5 h-5 text-[#7DD3FC] flex-shrink-0" />
                            <span className="text-zinc-300">Personal CPA consultation</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 2.1 }}
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-[#7DD3FC]/10 rounded-xl border border-purple-500/20"
                          >
                            <Calendar className="w-5 h-5 text-[#7DD3FC] flex-shrink-0" />
                            <span className="text-zinc-300">Tax planning sessions</span>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="text-center bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 rounded-3xl p-8 border border-zinc-700 backdrop-blur-xl"
              >
                <h3 className="text-3xl font-bold text-white mb-4">Ready to maximize your tax refund?</h3>
                <p className="text-zinc-400 mb-8 text-lg">
                  Your premium features are active and ready to help you save money
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 text-xl px-10 py-6 font-bold shadow-2xl hover:shadow-[#BEF397]/20 transition-all duration-300"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Start Using Premium Features
                  <ChevronRight className="w-6 h-6 ml-3" />
                </Button>
                <p className="text-zinc-500 text-sm mt-4">All features unlocked • No limits • Full access</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
