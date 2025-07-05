import { type NextRequest, NextResponse } from "next/server"
import { basiqService } from "@/lib/basiq-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      // Return mock data for demo purposes
      const mockAccounts = [
        {
          id: "acc_1",
          name: "Everyday Account",
          type: "transaction",
          accountNo: "123456789",
          balance: "2450.50", // This should match the sum of transactions for this account
          institution: "Commonwealth Bank",
        },
        {
          id: "acc_2",
          name: "Savings Account",
          type: "savings",
          accountNo: "987654321",
          balance: "15562.50", // Adjusted balance (15750 - 200 + 12.50)
          institution: "Commonwealth Bank",
        },
        {
          id: "acc_3",
          name: "Credit Card",
          type: "credit",
          accountNo: "4532********1234",
          balance: "-143.50", // Sum of credit card transactions: -28.50 - 4.80 - 65.20 - 45.00 = -143.50
          institution: "ANZ Bank",
        },
      ]

      return NextResponse.json({
        success: true,
        accounts: mockAccounts,
      })
    }

    console.log("Fetching accounts for user:", userId)

    // Get real accounts from Basiq
    const accounts = await basiqService.getUserAccounts(userId)

    // Transform accounts to match our interface
    const transformedAccounts = accounts.map((account: any) => ({
      id: account.id,
      name: account.name || account.displayName || "Unknown Account",
      type: account.type || account.class,
      accountNo: account.accountNo || account.accountNumber || "****",
      balance: account.balance?.current || account.availableBalance || "0.00",
      institution: account.institution?.name || "Unknown Bank",
    }))

    return NextResponse.json({
      success: true,
      accounts: transformedAccounts,
    })
  } catch (error) {
    console.error("Basiq accounts error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch accounts",
      },
      { status: 500 },
    )
  }
}
