"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building, CreditCard, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { transactionCache } from "@/lib/transaction-cache"

export default function SelectAccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fetchingTransactions, setFetchingTransactions] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("basiq_user_id")

      if (!userId) {
        setError("No user ID found. Please reconnect your bank.")
        setLoading(false)
        return
      }

      // Check cache first
      const cachedAccounts = transactionCache.getAccounts(userId)
      if (cachedAccounts) {
        console.log("Using cached accounts")
        setAccounts(cachedAccounts)
        setSelectedAccounts(cachedAccounts.map((account: any) => account.id))
        setLoading(false)
        return
      }

      console.log("Fetching accounts from Basiq API")
      const response = await fetch(`/api/users/${userId}/accounts`)
      if (!response.ok) throw new Error("Failed to fetch accounts")

      const data = await response.json()
      const accountsData = data.data || []

      // Cache the accounts
      transactionCache.setAccounts(userId, accountsData)

      setAccounts(accountsData)
      setSelectedAccounts(accountsData.map((account: any) => account.id))
    } catch (err) {
      console.error("Error fetching accounts:", err)
      setError("Failed to load accounts. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts((prev) => {
      if (prev.includes(accountId)) {
        return prev.filter((id) => id !== accountId)
      } else {
        return [...prev, accountId]
      }
    })
  }

  const handleContinue = async () => {
    console.log("Continue button clicked")
    console.log("Selected accounts:", selectedAccounts)

    if (selectedAccounts.length === 0) {
      alert("Please select at least one account to analyze.")
      return
    }

    const userId = localStorage.getItem("basiq_user_id")

    if (!userId) {
      setError("No user ID found. Please reconnect your bank.")
      return
    }

    try {
      setFetchingTransactions(true)

      // Store selected accounts and settings
      localStorage.setItem("selected_accounts", JSON.stringify(selectedAccounts))
      localStorage.setItem("accounts_selected", "true")

      // Store account selection settings for profile page
      const accountSettings = {
        selectedAccounts: selectedAccounts,
        totalAccounts: accounts.length,
        lastUpdated: new Date().toISOString(),
        accountDetails: accounts
          .filter((acc) => selectedAccounts.includes(acc.id))
          .map((acc) => ({
            id: acc.id,
            name: acc.displayName || acc.name || "Account",
            type: acc.type || "transaction",
            bank: acc.institution?.shortName || acc.institution?.name || "Bank",
            accountNumber: acc.accountNo?.slice(-4) || acc.accountNumber?.slice(-4) || "****",
          })),
      }
      localStorage.setItem("account_settings", JSON.stringify(accountSettings))

      console.log("Pre-fetching transactions for selected accounts...")

      // Pre-fetch transactions for the selected accounts to populate cache
      const userProfile = JSON.parse(localStorage.getItem("user_profile") || "{}")
      let url = `/api/basiq/transactions?userId=${userId}`

      // Add user profile for intelligent classification
      if (userProfile.onboarding?.deductionTypes?.length > 0) {
        url += `&userProfile=${encodeURIComponent(JSON.stringify(userProfile))}`
      }

      // Add selected accounts
      if (selectedAccounts.length > 0) {
        url += `&accounts=${encodeURIComponent(JSON.stringify(selectedAccounts))}`
      }

      console.log("Fetching transactions from:", url)

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        console.log(`Successfully pre-fetched ${data.totalCount} transactions`)
        console.log(`Found ${data.deductibleCount} potential deductions`)

        // Navigate to dashboard
        const params = new URLSearchParams()
        if (userId) params.set("userId", userId)
        params.set("accounts", selectedAccounts.join(","))

        router.push(`/dashboard?${params.toString()}`)
      } else {
        throw new Error(data.error || "Failed to fetch transactions")
      }
    } catch (error) {
      console.error("Error pre-fetching transactions:", error)
      setError("Failed to load transaction data. Please try again.")
    } finally {
      setFetchingTransactions(false)
    }
  }

  const handleRefresh = () => {
    // Clear cache and refetch
    const userId = localStorage.getItem("basiq_user_id")
    if (userId) {
      transactionCache.clearAll(userId)
    }
    fetchAccounts()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 border-2 border-[#BEF397]/20 border-t-[#BEF397] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#BEF397] text-xl">Loading your accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[#BEF397] text-2xl font-bold">moulai.</h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Select Accounts to Analyze</h2>
          <p className="text-zinc-400 text-lg">Choose which accounts you'd like us to analyze for tax deductions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
            <p className="text-red-400">{error}</p>
            <Button onClick={fetchAccounts} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
              Retry
            </Button>
          </div>
        )}

        {accounts.length > 0 && (
          <>
            {/* Cache Status */}
            <Alert className="mb-6 border-blue-800 bg-blue-900/20">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Performance Mode:</strong> Transaction data will be cached for faster loading. Use the refresh
                button to get the latest data from your bank.
              </AlertDescription>
            </Alert>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {accounts.map((account, index) => {
                const isSelected = selectedAccounts.includes(account.id)
                const accountType = account.type || "transaction"
                const balance = account.balance || account.availableBalance || 0

                return (
                  <div
                    key={account.id}
                    onClick={() => handleAccountToggle(account.id)}
                    className={`p-6 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-[#BEF397] bg-[#BEF397]/10 shadow-lg"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            accountType.toLowerCase().includes("credit")
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {accountType.toLowerCase().includes("credit") ? (
                            <CreditCard className="w-6 h-6" />
                          ) : (
                            <Building className="w-6 h-6" />
                          )}
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-[#BEF397] bg-[#BEF397]" : "border-zinc-600"
                          }`}
                        >
                          {isSelected && <div className="w-3 h-3 rounded-full bg-black" />}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                        {accountType}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-lg mb-1">
                        {account.displayName || account.name || "Account"}
                      </h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        {account.institution?.shortName || account.institution?.name || "Bank"}
                      </p>
                      <p className="text-zinc-500 text-sm font-mono">
                        ****{account.accountNo?.slice(-4) || account.accountNumber?.slice(-4) || "****"}
                      </p>
                      {balance !== 0 && (
                        <p className="text-[#BEF397] font-semibold mt-2">${Math.abs(balance).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selection Summary */}
            <div className="mb-8 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    {selectedAccounts.length} of {accounts.length} accounts selected
                  </h3>
                  <p className="text-zinc-400">
                    {selectedAccounts.length === 0
                      ? "Select at least one account to continue"
                      : "We'll analyze transactions from these accounts for tax deductions"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#BEF397] font-semibold text-lg">
                    {selectedAccounts.length > 0 ? "Ready to analyze" : "No accounts selected"}
                  </p>
                  <p className="text-zinc-400 text-sm">AI-powered categorization</p>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={selectedAccounts.length === 0 || fetchingTransactions}
              className="w-full h-16 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {fetchingTransactions ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading Transaction Data...
                </>
              ) : (
                `Start Analyzing Transactions (${selectedAccounts.length} accounts)`
              )}
            </button>
          </>
        )}

        {accounts.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4">No accounts found</h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              We couldn't find any connected accounts. Please try connecting your bank again.
            </p>
            <Button
              onClick={() => router.push("/connect-bank")}
              className="bg-[#BEF397] hover:bg-[#BEF397]/80 text-black"
            >
              Connect Bank Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
