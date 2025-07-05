"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  DollarSign,
  Calculator,
  Save,
  TrendingUp,
  Home,
  Car,
  ShoppingBag,
  Laptop,
  GraduationCap,
  Users,
  Coffee,
  Heart,
  Gift,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"
import { TransactionUtils } from "@/lib/transaction-utils"

export default function SalaryDeductionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // State for salary and deductions
  const [annualSalary, setAnnualSalary] = useState<string>("")
  const [deductionToggles, setDeductionToggles] = useState<Record<string, boolean>>({})

  // All 11 deduction categories from onboarding step 1 (matching transaction tab exactly)
  const deductionCategories = [
    {
      key: "Vehicles, Travel & Transport",
      label: "Vehicles, Travel & Transport",
      icon: Car,
      description: "Car expenses, fuel, parking, public transport, flights",
    },
    {
      key: "Work Tools, Equipment & Technology",
      label: "Work Tools, Equipment & Technology",
      icon: Laptop,
      description: "Computers, software, tools, machinery, subscriptions",
    },
    {
      key: "Work Clothing & Uniforms",
      label: "Work Clothing & Uniforms",
      icon: ShoppingBag,
      description: "Uniforms, protective clothing, safety equipment",
    },
    {
      key: "Home Office Expenses",
      label: "Home Office Expenses",
      icon: Home,
      description: "Utilities, internet, phone, office supplies, rent portion",
    },
    {
      key: "Education & Training",
      label: "Education & Training",
      icon: GraduationCap,
      description: "Courses, conferences, books, professional development",
    },
    {
      key: "Professional Memberships & Fees",
      label: "Professional Memberships & Fees",
      icon: Users,
      description: "Association fees, licenses, certifications",
    },
    {
      key: "Meals & Entertainment (Work-Related)",
      label: "Meals & Entertainment (Work-Related)",
      icon: Coffee,
      description: "Client meals, business entertainment, work functions",
    },
    {
      key: "Personal Grooming & Wellbeing",
      label: "Personal Grooming & Wellbeing",
      icon: Heart,
      description: "Haircuts, gym memberships, health expenses",
    },
    {
      key: "Gifts & Donations",
      label: "Gifts & Donations",
      icon: Gift,
      description: "Corporate gifts, charitable donations, sponsorships",
    },
    {
      key: "Investments, Insurance & Superannuation",
      label: "Investments, Insurance & Superannuation",
      icon: Shield,
      description: "Investment fees, insurance premiums, super contributions",
    },
    {
      key: "Tax & Accounting Expenses",
      label: "Tax & Accounting Expenses",
      icon: Calculator,
      description: "Accountant fees, tax preparation, bookkeeping",
    },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Load salary from database using the same method as dashboard
        const salary = await TransactionUtils.getUserIncome()
        // Format salary with commas
        const formattedSalary = salary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        setAnnualSalary(formattedSalary)

        // Load deduction toggles using the same method as transaction tab
        const toggles = TransactionUtils.getDeductionToggles()
        setDeductionToggles(toggles)

        console.log("Loaded salary:", salary)
        console.log("Loaded deduction toggles:", toggles)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load your settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Listen for sidebar state changes
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [toast])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Convert formatted salary back to number (remove commas)
      const numericSalary = Number.parseFloat(annualSalary.replace(/,/g, "")) || 0

      console.log("Saving salary to database:", numericSalary)

      // Save salary to database with correct structure
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: {
            salary: numericSalary,
          },
        }),
        credentials: "include",
      })

      const responseData = await response.json()
      console.log("Profile update response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save salary")
      }

      // Save deduction toggles using the same method as transaction tab
      TransactionUtils.saveDeductionToggles(deductionToggles)

      // Update localStorage for immediate reflection in other parts of the app
      const step2Data = JSON.parse(localStorage.getItem("onboarding_step2") || "{}")
      step2Data.annualIncome = numericSalary
      localStorage.setItem("onboarding_step2", JSON.stringify(step2Data))

      // Clear any cached data that might contain old salary info
      localStorage.removeItem("premium_status_cache")
      localStorage.removeItem("transaction_stats_cache")

      console.log("Settings saved successfully")

      toast({
        title: "Settings Saved",
        description: "Your salary and deduction preferences have been updated successfully.",
      })

      // Dispatch event to notify other components of the update
      window.dispatchEvent(new CustomEvent("salaryUpdated", { detail: { salary: numericSalary } }))
      window.dispatchEvent(new CustomEvent("transactionsUpdated"))

      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push("/profile")
      }, 1000)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeductionToggle = (categoryKey: string, enabled: boolean) => {
    setDeductionToggles((prev) => ({
      ...prev,
      [categoryKey]: enabled,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-black">
        <DashboardSidebar />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
          <DashboardHeader />
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#BEF397]/20 border-t-[#BEF397] rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Salary & Deduction Settings</h1>
            <p className="text-zinc-400">
              Manage your income information and configure which expense categories to track for tax deductions.
            </p>
          </motion.div>

          {/* Income Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-zinc-900/50 border-zinc-700/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-[#BEF397] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Income Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="annualSalary" className="text-zinc-300">
                      Annual Salary (AUD)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="annualSalary"
                        type="text"
                        placeholder="75,000"
                        value={annualSalary}
                        onChange={(e) => {
                          // Remove all non-digits
                          const numericValue = e.target.value.replace(/[^\d]/g, "")
                          // Format with commas
                          const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          setAnnualSalary(formattedValue)
                        }}
                        className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </div>
                    <p className="text-sm text-zinc-500">
                      This information is used to calculate your tax savings and marginal tax rate.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deduction Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-zinc-900/50 border-zinc-700/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-[#BEF397] flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Deduction Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 mb-6">
                  Select which expense categories you want to automatically track for tax deductions. These settings
                  will be used when analyzing your transactions.
                </p>

                <div className="space-y-4">
                  {deductionCategories.map((category) => {
                    const IconComponent = category.icon
                    const isEnabled = deductionToggles[category.key] || false

                    return (
                      <motion.div
                        key={category.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + deductionCategories.indexOf(category) * 0.05 }}
                        className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                              isEnabled
                                ? "bg-[#BEF397]/20 border border-[#BEF397]/30"
                                : "bg-zinc-700/50 border border-zinc-600/30"
                            }`}
                          >
                            <IconComponent
                              className={`w-6 h-6 transition-colors ${isEnabled ? "text-[#BEF397]" : "text-zinc-400"}`}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-white text-base">{category.label}</h3>
                            <p className="text-sm text-zinc-400 mt-1">{category.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleDeductionToggle(category.key, checked)}
                        />
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-blue-400 font-medium text-sm">How it works</h4>
                      <p className="text-blue-300/80 text-sm mt-1">
                        When you upload bank statements or connect your accounts, transactions will be automatically
                        analyzed and categorized based on your selected deduction types. You can always manually review
                        and adjust these classifications later.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex justify-end"
          >
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-[#BEF397] text-black hover:bg-[#BEF397]/90 font-medium px-8"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
