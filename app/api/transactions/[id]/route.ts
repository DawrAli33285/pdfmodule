import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth"
import { DatabaseService } from "@/lib/services/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from auth token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const authService = AuthService.getInstance()
    const decoded = authService.verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = params

    const dbService = DatabaseService.getInstance()
    await dbService.updateTransaction(id, body)

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
    })
  } catch (error) {
    console.error("Update transaction error:", error)
    return NextResponse.json({ success: false, error: "Failed to update transaction" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from auth token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const authService = AuthService.getInstance()
    const decoded = authService.verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { id } = params

    const dbService = DatabaseService.getInstance()
    await dbService.deleteTransaction(id)

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete transaction" }, { status: 500 })
  }
}
