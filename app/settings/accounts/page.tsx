"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Building2,
  Wallet,
  CheckCircle,
  XCircle,
  Database,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface Account {
  id: string
  name: string
  displayName: string
  accountNo: string
  accountType: string
  balance: string
  currency: string
  status: string
  institution: {
    id: string
    name: string
    shortName: string
  }
  selected?: boolean
}

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showBalances, setShowBalances] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    loadAccounts()
    loadSelectedAccounts()

    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      const userId = localStorage.getItem("basiq_user_id")
      if (!userId) {
        router.push("/onboarding")
        return
      }

      const response = await fetch(`/api/basiq/accounts?userId=${userId}`)
      const data = await response.json()

      if (data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts)
      } else {
        throw new Error(data.error || "Failed to load accounts")
      }
    } catch (error) {
      console.error("Error loading accounts:", error)
      setError(`Failed to load accounts: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedAccounts = () => {
    const saved = localStorage.getItem("selected_accounts")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSelectedAccounts(Array.isArray(parsed) ? parsed : [])
      } catch (error) {
        console.error("Error parsing selected accounts:", error)
        setSelectedAccounts([])
      }
    }
  }

  const saveSelectedAccounts = (accounts: Account[]) => {
    localStorage.setItem("selected_accounts", JSON.stringify(accounts))
    setSelectedAccounts(accounts)

    // Notify other components that account selection has changed
    window.dispatchEvent(new CustomEvent("accountSelectionChanged"))
  }

  const toggleAccountSelection = (account: Account) => {
    const isSelected = selectedAccounts.some((acc) => acc.id === account.id)

    if (isSelected) {
      const newSelection = selectedAccounts.filter((acc) => acc.id !== account.id)
      saveSelectedAccounts(newSelection)
    } else {
      const newSelection = [...selectedAccounts, account]
      saveSelectedAccounts(newSelection)
    }
  }

  const removeAccount = async (accountId: string) => {
    if (
      !confirm("Are you sure you want to remove this account? This will stop tracking transactions from this account.")
    ) {
      return
    }

    try {
      // Remove from selected accounts
      const newSelection = selectedAccounts.filter((acc) => acc.id !== accountId)
      saveSelectedAccounts(newSelection)

      // Remove from accounts list
      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId))

      // TODO: Call API to disconnect account from Basiq if needed
      console.log("Account removed:", accountId)
    } catch (error) {
      console.error("Error removing account:", error)
      setError("Failed to remove account")
    }
  }

  const connectNewAccount = async () => {
    try {
      setConnecting(true)
      setError(null)

      const userId = localStorage.getItem("basiq_user_id")
      if (!userId) {
        router.push("/onboarding")
        return
      }

      // Create a new auth link for additional account connection
      const response = await fetch(`/api/users/${userId}/auth_link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: localStorage.getItem("user_mobile") || "",
        }),
      })

      const data = await response.json()

      if (data.success && data.authLink) {
        // Redirect to the auth link to connect additional account
        window.location.href = data.authLink
      } else {
        throw new Error(data.error || "Failed to create auth link")
      }
    } catch (error) {
      console.error("Error connecting new account:", error)
      setError(`Failed to connect new account: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setConnecting(false)
    }
  }

  const getAccountIcon = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case "credit":
      case "credit card":
        return <CreditCard className="w-5 h-5" />
      case "savings":
      case "transaction":
      case "checking":
        return <Wallet className="w-5 h-5" />
      default:
        return <Building2 className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "available":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case "inactive":
      case "unavailable":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        )
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{status}</Badge>
    }
  }

  const formatBalance = (balance: string, currency = "AUD") => {
    const amount = Number.parseFloat(balance || "0")
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency,
    }).format(amount)
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
            <p className="text-white text-lg">Loading accounts...</p>
          </div>
        </div>
      </div>
    )
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
                <Building2 className="w-8 h-8 text-[#7DD3FC]" />
                Account Management
              </h1>
              <p className="text-zinc-400 mt-1">Manage your connected bank accounts and select which ones to analyze</p>
              <div className="flex items-center gap-2 mt-2">
                <Database className="w-4 h-4 text-[#7DD3FC]" />
                <span className="text-sm text-[#7DD3FC]">
                  {accounts.length} accounts connected • {selectedAccounts.length} selected for analysis
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-300">Show Balances</span>
                <Switch checked={showBalances} onCheckedChange={setShowBalances} />
              </div>
              <Button
                onClick={loadAccounts}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={connectNewAccount}
                disabled={connecting}
                className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD390]/90 text-black font-semibold"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="border-red-800 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error}
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  size="sm"
                  className="ml-4 border-red-700 text-red-300 hover:bg-red-800"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Account Selection Info */}
          <Alert className="border-blue-800 bg-blue-900/20">
            <Database className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <strong>Account Selection:</strong> Select which accounts you want to include in your tax analysis. Only
              transactions from selected accounts will be analyzed for business expenses and deductions.
            </AlertDescription>
          </Alert>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.length === 0 ? (
              <div className="col-span-full">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-zinc-300 mb-2">No accounts connected</h3>
                    <p className="text-zinc-500 mb-6">
                      Connect your bank accounts to start analyzing your transactions for tax deductions.
                    </p>
                    <Button
                      onClick={connectNewAccount}
                      disabled={connecting}
                      className="bg-[#BEF397] text-black hover:bg-[#BEF397]/90"
                    >
                      {connecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Connect First Account
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              accounts.map((account, index) => {
                const isSelected = selectedAccounts.some((acc) => acc.id === account.id)

                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`bg-zinc-900/80 border-zinc-700/50 transition-all duration-200 cursor-pointer hover:border-zinc-600 ${
                        isSelected ? "ring-2 ring-[#BEF397]/50 border-[#BEF397]/30" : ""
                      }`}
                      onClick={() => toggleAccountSelection(account)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSelected ? "bg-[#BEF397]/20" : "bg-zinc-800"}`}>
                              {getAccountIcon(account.accountType)}
                            </div>
                            <div>
                              <CardTitle className="text-white text-sm font-semibold">
                                {account.displayName || account.name}
                              </CardTitle>
                              <p className="text-xs text-zinc-400">
                                {account.institution.shortName || account.institution.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 text-xs">
                                Selected
                              </Badge>
                            )}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeAccount(account.id)
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400">Account Number</span>
                            <span className="text-xs text-zinc-300 font-mono">****{account.accountNo.slice(-4)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400">Type</span>
                            <Badge className="bg-zinc-700 text-zinc-300 text-xs">{account.accountType}</Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400">Status</span>
                            {getStatusBadge(account.status)}
                          </div>

                          {showBalances && (
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                              <span className="text-xs text-zinc-400">Balance</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {formatBalance(account.balance, account.currency)}
                                </span>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowBalances(!showBalances)
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="p-1 h-auto text-zinc-400 hover:text-zinc-300"
                                >
                                  {showBalances ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Selection Summary */}
          {selectedAccounts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="bg-[#BEF397]/5 border-[#BEF397]/20">
                <CardHeader>
                  <CardTitle className="text-[#BEF397] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Selected Accounts ({selectedAccounts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-1 bg-[#BEF397]/20 rounded">{getAccountIcon(account.accountType)}</div>
                          <div>
                            <div className="text-sm font-medium text-white">{account.displayName || account.name}</div>
                            <div className="text-xs text-zinc-400">****{account.accountNo.slice(-4)}</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => toggleAccountSelection(account)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-auto"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800">
                    <p className="text-sm text-blue-300">
                      <strong>Note:</strong> Only transactions from these selected accounts will be included in your tax
                      analysis and reports. You can change this selection at any time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
