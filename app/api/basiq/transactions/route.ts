import { type NextRequest, NextResponse } from "next/server"
import { transactionCache } from "@/lib/transaction-cache"

const BASIQ_API_URL = "https://au-api.basiq.io"

interface BasiqTransaction {
  id: string
  type: string
  status: string
  description: string
  amount: string
  account: string
  balance: string
  direction: string
  class: {
    category: string
    type: string
  }
  institution: string
  connection: string
  enrich?: {
    merchant?: {
      businessName?: string
      logoUri?: string
      website?: string
    }
    category?: {
      anzsic?: {
        class?: {
          code?: string
          title?: string
        }
        division?: {
          code?: string
          title?: string
        }
      }
    }
    location?: {
      latitude?: number
      longitude?: number
      address?: string
      suburb?: string
      state?: string
      postcode?: string
    }
  }
  postDate: string
  transactionDate: string
  subClass?: {
    title?: string
    code?: string
  }
}

interface BasiqAccount {
  id: string
  name: string
  accountNo: string
  balance: string
  available: string
  type: string
  class: {
    type: string
    product: string
  }
  institution: string
  connection: string
  status: string
  lastUpdated: string
  accountHolder: string
}

async function getBasiqToken(): Promise<string> {
  const apiKey = process.env.BASIQ_API_KEY || process.env.BASIQ_TOKEN

  if (!apiKey) {
    throw new Error("BASIQ_API_KEY or BASIQ_TOKEN environment variable is required")
  }

  // If it's already a token (starts with "Bearer"), use it directly
  if (apiKey.startsWith("Bearer ")) {
    return apiKey
  }

  // Otherwise, treat it as an API key and get a token
  try {
    const response = await fetch(`${BASIQ_API_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: "scope=SERVER_ACCESS",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Basiq token error:", response.status, errorText)
      throw new Error(`Failed to get Basiq token: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return `Bearer ${data.access_token}`
  } catch (error) {
    console.error("Error getting Basiq token:", error)
    throw error
  }
}

async function fetchBasiqAccounts(userId: string, token: string): Promise<BasiqAccount[]> {
  try {
    const response = await fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
      headers: {
        Authorization: token,
        Accept: "application/json",
        "basiq-version": "3.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Basiq accounts error:", response.status, errorText)
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Error fetching Basiq accounts:", error)
    return []
  }
}

// Mock Basiq API call
async function fetchBasiqTransactions(userId: string, accounts?: string[]) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock transaction data
  const mockTransactions = [
    {
      id: "txn_001",
      description: "WOOLWORTHS SUPERMARKET",
      amount: "-85.67",
      date: "2024-06-15T00:00:00Z",
      category: "Groceries",
      subCategory: "Food & Beverages",
      account: "Commonwealth Bank",
      accountId: "acc_001",
      accountNumber: "1234",
      type: "debit",
      potentialDeduction: false,
      enriched: true,
      merchantName: "Woolworths",
      anzsicCode: "4110",
      anzsicDescription: "Supermarket and Grocery Stores",
    },
    {
      id: "txn_002",
      description: "OFFICE WORKS PTY LTD",
      amount: "-156.90",
      date: "2024-06-12T00:00:00Z",
      category: "Office Supplies",
      subCategory: "Business Equipment",
      account: "Commonwealth Bank",
      accountId: "acc_001",
      accountNumber: "1234",
      type: "debit",
      potentialDeduction: true,
      enriched: true,
      merchantName: "Officeworks",
      anzsicCode: "4239",
      anzsicDescription: "Other Store-Based Retailing",
    },
  ]

  return mockTransactions
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const accountsParam = searchParams.get("accounts")
    const forceRefresh = searchParams.get("refresh") === "true"
    const userProfileParam = searchParams.get("userProfile")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    let accounts: string[] = []
    if (accountsParam) {
      try {
        accounts = JSON.parse(accountsParam)
      } catch (error) {
        console.warn("Could not parse accounts parameter:", error)
      }
    }

    let userProfile: any = null
    if (userProfileParam) {
      try {
        userProfile = JSON.parse(userProfileParam)
      } catch (error) {
        console.warn("Could not parse user profile:", error)
      }
    }

    let transactions: any[] = []
    let source = "basiq-api"

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedTransactions = transactionCache.getTransactions(userId, accounts)
      if (cachedTransactions) {
        transactions = cachedTransactions
        source = "cache"
      }
    }

    // Fetch from Basiq API if no cache or force refresh
    if (transactions.length === 0 || forceRefresh) {
      const token = await getBasiqToken()
      transactions = await fetchBasiqTransactions(userId, token, accounts)

      // Cache the results
      transactionCache.setTransactions(userId, accounts, transactions, userProfile)
      source = forceRefresh ? "basiq-api-forced" : "basiq-api"
    }

    // Get PDF transactions from localStorage and merge
    let pdfTransactions: any[] = []
    try {
      // This would normally be handled client-side, but for demo purposes
      // we'll simulate having PDF transactions
      const mockPdfTransactions = [
        {
          id: "pdf_001",
          description: "UBER TECHNOLOGIES",
          amount: "-24.50",
          date: "2024-06-13T00:00:00Z",
          category: "Transport",
          account: "PDF Statement",
          accountId: "pdf-upload",
          accountNumber: "****",
          type: "debit",
          potentialDeduction: true,
          enriched: false,
          source: "pdf-upload",
        },
      ]
      pdfTransactions = mockPdfTransactions
    } catch (error) {
      console.warn("Could not load PDF transactions:", error)
    }

    // Merge Basiq and PDF transactions
    const allTransactions = [...transactions, ...pdfTransactions]

    // Apply intelligent classification based on user profile
    const classifiedTransactions = allTransactions.map((transaction) => {
      let potentialDeduction = transaction.potentialDeduction || false

      // Enhanced classification based on user profile
      if (userProfile?.onboarding?.deductionTypes) {
        const deductionTypes = userProfile.onboarding.deductionTypes

        // Check if transaction matches user's selected deduction types
        if (
          deductionTypes.includes("Vehicles, Travel & Transport") &&
          (transaction.category?.toLowerCase().includes("transport") ||
            transaction.category?.toLowerCase().includes("fuel") ||
            transaction.description?.toLowerCase().includes("uber") ||
            transaction.description?.toLowerCase().includes("taxi"))
        ) {
          potentialDeduction = true
        }

        if (
          deductionTypes.includes("Work Tools, Equipment & Technology") &&
          (transaction.category?.toLowerCase().includes("office") ||
            transaction.category?.toLowerCase().includes("software") ||
            transaction.category?.toLowerCase().includes("equipment"))
        ) {
          potentialDeduction = true
        }

        // Add more classification rules based on other deduction types
      }

      return {
        ...transaction,
        potentialDeduction,
      }
    })

    const deductibleTransactions = classifiedTransactions.filter((t) => t.potentialDeduction)
    const totalDeductible = deductibleTransactions.reduce((sum, t) => {
      const amount = Number.parseFloat(t.amount)
      return sum + (amount < 0 ? Math.abs(amount) : 0)
    }, 0)

    const accountFiltering =
      accounts.length > 0
        ? `Filtered to ${accounts.length} selected account${accounts.length !== 1 ? "s" : ""}`
        : "All accounts"

    return NextResponse.json({
      success: true,
      transactions: classifiedTransactions,
      totalCount: classifiedTransactions.length,
      deductibleCount: deductibleTransactions.length,
      totalDeductible,
      source,
      timestamp: new Date().toISOString(),
      message: `Loaded ${classifiedTransactions.length} transactions from ${source}`,
      accountFiltering,
      userProfile: userProfile ? "Applied intelligent classification" : "No user profile provided",
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch transactions",
      },
      { status: 500 },
    )
  }
}
