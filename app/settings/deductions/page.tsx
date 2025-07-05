"use client"

import { useState, useEffect } from "react"
import { Settings, CheckCircle, X, Save, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { UserProfileService, type DeductionRule } from "@/lib/user-profile"

const deductionTypes = [
  {
    id: "work-from-home",
    label: "Work from Home",
    description: "Home office, utilities, internet expenses",
    categories: ["utilities", "internet", "phone", "office supplies"],
  },
  {
    id: "vehicle-expenses",
    label: "Vehicle Expenses",
    description: "Business travel, fuel, parking, maintenance",
    categories: ["fuel", "parking", "tolls", "car maintenance"],
  },
  {
    id: "professional-development",
    label: "Professional Development",
    description: "Courses, conferences, certifications, books",
    categories: ["education", "training", "conferences"],
  },
  {
    id: "technology",
    label: "Technology & Equipment",
    description: "Software, hardware, subscriptions, tools",
    categories: ["software", "hardware", "technology"],
  },
]

export default function DeductionSettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [workSituation, setWorkSituation] = useState({
    workFromHome: false,
    vehicleExpenses: false,
    professionalDevelopment: false,
    technology: false,
    travel: false,
    entertainment: false,
  })
  const [autoClassification, setAutoClassification] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deductionRules, setDeductionRules] = useState<DeductionRule[]>([])

  useEffect(() => {
    loadSettings()

    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const loadSettings = () => {
    const profile = UserProfileService.getProfile()

    if (profile.onboarding?.workSituation) {
      setWorkSituation(profile.onboarding.workSituation)
    }

    if (profile.preferences?.autoClassification !== undefined) {
      setAutoClassification(profile.preferences.autoClassification)
    }

    setDeductionRules(UserProfileService.getDeductionRules())
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      // Update user profile
      UserProfileService.updateProfile({
        onboarding: {
          workSituation,
        },
        preferences: {
          autoClassification,
        },
      })

      // Update deduction rules
      setDeductionRules(UserProfileService.getDeductionRules())

      // Trigger re-classification of transactions
      window.dispatchEvent(new CustomEvent("deductionRulesChanged"))

      setMessage({ type: "success", text: "Deduction settings updated successfully!" })

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update settings. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleWorkSituationChange = (key: keyof typeof workSituation, value: boolean) => {
    setWorkSituation((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <DashboardHeader />

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-[#BEF397]" />
                Deduction Settings
              </h1>
              <p className="text-zinc-400 mt-1">
                Configure how transactions are automatically classified as deductions
              </p>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <Alert
              className={`border-${message.type === "success" ? "green" : "red"}-800 bg-${message.type === "success" ? "green" : "red"}-900/20`}
            >
              <AlertDescription className={`text-${message.type === "success" ? "green" : "red"}-300`}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Auto Classification Toggle */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#BEF397]" />
                  Auto Classification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-classification" className="text-white font-medium">
                      Enable Automatic Transaction Classification
                    </Label>
                    <p className="text-zinc-400 text-sm mt-1">
                      Automatically classify transactions as deductions based on your work situation
                    </p>
                  </div>
                  <Switch
                    id="auto-classification"
                    checked={autoClassification}
                    onCheckedChange={setAutoClassification}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Work Situation Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Your Work Situation</CardTitle>
                <p className="text-zinc-400 text-sm">Tell us about your work to help us identify relevant deductions</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {deductionTypes.map((type, index) => {
                    const isEnabled = workSituation[type.id as keyof typeof workSituation]

                    return (
                      <motion.div
                        key={type.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{type.label}</h3>
                            {isEnabled && (
                              <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">Active</Badge>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm mb-2">{type.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {type.categories.map((category) => (
                              <Badge key={category} className="bg-zinc-700/50 text-zinc-300 border-zinc-600/50 text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(value) =>
                            handleWorkSituationChange(type.id as keyof typeof workSituation, value)
                          }
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Deduction Rules */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Active Deduction Rules</CardTitle>
                <p className="text-zinc-400 text-sm">
                  Based on your work situation, these rules will automatically classify transactions
                </p>
              </CardHeader>
              <CardContent>
                {deductionRules.length === 0 ? (
                  <div className="text-center py-8">
                    <X className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400">No active deduction rules</p>
                    <p className="text-zinc-500 text-sm">Enable work situations above to create rules</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deductionRules.map((rule, index) => (
                      <motion.div
                        key={rule.type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 rounded-lg bg-[#BEF397]/5 border border-[#BEF397]/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-[#BEF397]" />
                          <h4 className="font-medium text-white">{rule.description}</h4>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-zinc-400">Categories: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rule.categories.map((category) => (
                                <Badge
                                  key={category}
                                  className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 text-xs"
                                >
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-400">Keywords: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rule.keywords.slice(0, 8).map((keyword) => (
                                <Badge
                                  key={keyword}
                                  className="bg-zinc-700/50 text-zinc-300 border-zinc-600/50 text-xs"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                              {rule.keywords.length > 8 && (
                                <Badge className="bg-zinc-700/50 text-zinc-300 border-zinc-600/50 text-xs">
                                  +{rule.keywords.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
