import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/middleware/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = authResult.user.id
    const { db } = await connectToDatabase()

    // Get transactions for the authenticated user
    const transactions = await db.collection("transactions").find({ userId }).sort({ date: -1 }).toArray()

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t) => ({
        ...t,
        _id: t._id.toString(),
      })),
    })
  } catch (error: any) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = authResult.user.id
    const body = await request.json()
    const { transactions } = body

    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: "Transactions array is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Add userId to each transaction and insert
    const transactionsWithUser = transactions.map((t) => ({
      ...t,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const result = await db.collection("transactions").insertMany(transactionsWithUser)

    return NextResponse.json({
      success: true,
      inserted: result.insertedCount,
    })
  } catch (error: any) {
    console.error("Error saving transactions:", error)
    return NextResponse.json({ error: "Failed to save transactions" }, { status: 500 })
  }
}
