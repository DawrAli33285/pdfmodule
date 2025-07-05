"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, CheckCircle, RefreshCw, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface Account {
  id: string
  name: string
  type: string
  accountNo: string
  balance: string
  institution: string
  transactionTotal?: number
  transactionCount?: number
}

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAccounts()
  }, [])

  const manualRefresh = () => {
    setLoading(true)
    setError("")
    fetchAccounts()
  }

  const fetchAccounts = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const userId = urlParams.get("userId") || localStorage.getItem("basiq_user_id")

      if (!userId) {
        setError("No user ID found. Please start the connection process again.")
        setLoading(false)
        return
      }

      console.log("Fetching accounts for user:", userId)

      // Use the working API endpoint from version 1
      const response = await fetch(`/api/users/${userId}/accounts`)

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.status}`)
      }

      const data = await response.json()
      console.log("Accounts response:", data)

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        // Transform accounts to match our interface
        const transformedAccounts = data.data.map((account: any) => ({
          id: account.id,
          name: account.displayName || account.name || "Unknown Account",
          type: account.type || account.class || "Unknown",
          accountNo: account.accountNo || "No account number",
          balance: typeof account.balance === "object" ? account.balance.current || "0.00" : account.balance || "0.00",
          institution: account.institution?.shortName || account.institution?.name || "Unknown Bank",
        }))

        setAccounts(transformedAccounts)
        // Select all accounts by default
        setSelectedAccounts(transformedAccounts.map((account: Account) => account.id))
      } else {
        setAccounts([])
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch accounts")
    } finally {
      setLoading(false)
    }
  }

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    )
  }

  const handleViewTransactions = () => {
    if (selectedAccounts.length === 0) {
      alert("Please select at least one account")
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const userId = urlParams.get("userId") || localStorage.getItem("basiq_user_id")

    // Pass both userId and selected account IDs
    const params = new URLSearchParams()
    if (userId) {
      params.set("userId", userId)
    }
    // Pass selected account IDs as comma-separated string
    params.set("accounts", selectedAccounts.join(","))

    router.push(`/transactions?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-black text-white">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="w-8 h-8 border-2 border-[#BEF397]/30 border-t-[#BEF397] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Your Bank Accounts</h2>
            <p className="text-zinc-400 text-lg">
              Select accounts to analyze for transactions. All accounts are selected by default.
            </p>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </div>
                <button
                  onClick={manualRefresh}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Accounts List */}
          <div className="space-y-4 mb-8">
            <AnimatePresence>
              {accounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className={`cursor-pointer transition-all duration-200 p-6 rounded-2xl border-2 ${
                    selectedAccounts.includes(account.id)
                      ? "bg-[#BEF397]/10 border-[#BEF397]"
                      : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  }`}
                  onClick={() => toggleAccount(account.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedAccounts.includes(account.id)
                            ? "bg-[#BEF397] border-[#BEF397]"
                            : "border-zinc-500 hover:border-zinc-400"
                        }`}
                      >
                        {selectedAccounts.includes(account.id) && <CheckCircle className="w-4 h-4 text-black" />}
                      </div>
                      <div className="w-12 h-12 bg-[#BEF397]/20 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-[#BEF397]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{account.name}</h3>
                        <p className="text-sm text-zinc-400">{account.accountNo}</p>
                        <div className="mt-1 inline-block px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium">
                          {account.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        ${Number.parseFloat(account.balance).toLocaleString()}
                      </p>
                      <p className="text-sm text-zinc-400">{account.institution}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* No Accounts State */}
          {accounts.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-zinc-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">No accounts found</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                No accounts were connected. Please try connecting again or check your bank connection.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black rounded-2xl px-8 py-3 font-bold"
              >
                Connect Accounts
              </Button>
            </motion.div>
          )}

          {/* Continue Button */}
          {accounts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="fixed bottom-8 left-80 right-8"
            >
              <Button
                onClick={handleViewTransactions}
                disabled={selectedAccounts.length === 0}
                className="w-full h-16 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg shadow-[#BEF397]/25 hover:shadow-xl hover:shadow-[#BEF397]/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedAccounts.length === 0
                  ? "Select at least one account"
                  : `Analyze ${selectedAccounts.length} Account${selectedAccounts.length > 1 ? "s" : ""}`}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
