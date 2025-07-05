"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ChevronRight,
  Settings,
  FileText,
  Gift,
  CreditCard,
  HelpCircle,
  Shield,
  Building,
  CheckCircle,
  Edit3,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function ProfilePage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [accountSettings, setAccountSettings] = useState<any>(null)
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          const user = data.user
          setUserProfile({
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            taxStatus: "individual",
          })
          setPhoneNumber(user.phone || "")
        } else {
          console.error("Failed to fetch user profile")
        }
      } catch (err) {
        console.error("Error fetching user profile:", err)
      }
    }

    fetchUserProfile()

    // Get account settings
    const accountSettingsData = localStorage.getItem("account_settings")
    if (accountSettingsData) {
      setAccountSettings(JSON.parse(accountSettingsData))
    }

    // Listen for sidebar state changes
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const menuSections = [
    {
      title: "Account Management",
      items: [
        {
          icon: Settings,
          label: "Account Details",
          route: "/settings/account",
          description: "Manage your personal information",
        },
        {
          icon: DollarSign,
          label: "Salary & Deductions",
          route: "/settings/salary-deductions",
          description: "Configure income and deduction preferences",
        },
      ],
    },
    // {
    //   title: "Banking & Accounts",
    //   items: [
    //     {
    //       icon: CreditCard,
    //       label: "Connected Accounts",
    //       route: "/settings/accounts",
    //       description: "Manage your bank account connections",
    //       custom: true,
    //     },
    //     {
    //       icon: Gift,
    //       label: "Subscription",
    //       route: "/settings/billing",
    //       description: "Manage your subscription and billing",
    //     },
    //   ],
    // },
    {
      title: "Support & Legal",
      items: [
        {
          icon: HelpCircle,
          label: "Help Centre",
          route: "/help/contact",
          description: "Find answers to common questions",
        },
        {
          icon: Shield,
          label: "Privacy Policy",
          route: "/legal/privacy",
          description: "Review our privacy practices",
        },
        {
          icon: FileText,
          label: "Terms of Service",
          route: "/legal/terms",
          description: "Read our terms and conditions",
        },
      ],
    },
  ]

  const handleEditAccounts = () => {
    router.push("/select-accounts")
  }

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <DashboardHeader />
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border-zinc-700/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20 border-4 border-[#BEF397]/30">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-[#BEF397]/20 to-[#9FE4FF]/20 text-[#BEF397] font-semibold">
                      {userProfile?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">{userProfile?.name || "Loading..."}</h2>
                    <p className="text-zinc-400 mb-2">{userProfile?.email || "Loading..."}</p>
                    {phoneNumber && <p className="text-zinc-400 mb-2">{phoneNumber}</p>}
                    <div className="flex items-center gap-3">
                      <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">
                        {userProfile?.taxStatus === "individual" ? "Individual Taxpayer" : "Business Taxpayer"}
                      </Badge>
                      <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                        Verified Account
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Connected Accounts Section */}
          {accountSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-zinc-900/50 border-zinc-700/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-[#BEF397] flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Connected Bank Accounts
                    </CardTitle>
                    <Button
                      onClick={handleEditAccounts}
                      variant="outline"
                      size="sm"
                      className="border-[#BEF397]/30 text-[#BEF397] hover:bg-[#BEF397]/10 bg-transparent"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Selection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-semibold">
                          {accountSettings.selectedAccounts.length} of {accountSettings.totalAccounts} accounts selected
                        </p>
                        <p className="text-zinc-400 text-sm">
                          Last updated: {new Date(accountSettings.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accountSettings.accountDetails.map((account: any, index: number) => (
                      <div key={account.id} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              account.type.toLowerCase().includes("credit")
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {account.type.toLowerCase().includes("credit") ? (
                              <CreditCard className="w-5 h-5" />
                            ) : (
                              <Building className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{account.name}</h4>
                            <p className="text-zinc-400 text-xs">{account.bank}</p>
                            <p className="text-zinc-500 text-xs font-mono">****{account.accountNumber}</p>
                          </div>
                          <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                            {account.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Settings Sections */}
          <div className="space-y-8">
            {menuSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + sectionIndex * 0.1 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-[#BEF397] flex items-center gap-2">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-zinc-800/50">
                      {section.items.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + sectionIndex * 0.1 + index * 0.05 }}
                        >
                          {item.custom &&
                          item.label === "Connected Accounts" ? // Skip this as we have a dedicated section above
                          null : (
                            <Button
                              variant="ghost"
                              className="w-full justify-between h-auto p-6 hover:bg-zinc-800/50 text-white rounded-none group"
                              onClick={() => router.push(item.route)}
                            >
                              <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BEF397]/20 to-[#9FE4FF]/20 flex items-center justify-center border border-[#BEF397]/20 group-hover:border-[#BEF397]/40 transition-colors">
                                  <item.icon className="w-5 h-5 text-[#BEF397]" />
                                </div>
                                <div>
                                  <div className="font-medium text-base mb-1">{item.label}</div>
                                  <div className="text-sm text-zinc-400">{item.description}</div>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-[#BEF397] transition-colors" />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
