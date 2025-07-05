import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    console.log("🎉 Processing payment link success...")

    // Get token from cookies
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    // Get request body
    const { planType = "ai" } = await request.json()

    // Connect to database
    const { db } = await connectToDatabase()
    const users = db.collection("users")

    // Update user subscription
    const updateData = {
      "subscription.plan": "premium",
      "subscription.planType": planType,
      "subscription.status": "active",
      "subscription.upgradeDate": new Date(),
      "subscription.startDate": new Date(),
      "subscription.paymentMethod": "stripe_payment_link",
      updatedAt: new Date(),
    }

    const result = await users.updateOne({ _id: new ObjectId(decoded.userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get updated user
    const updatedUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    console.log("✅ Payment link success processed for user:", updatedUser?.email)

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      subscription: updatedUser?.subscription,
    })
  } catch (error) {
    console.error("Error processing payment link success:", error)
    return NextResponse.json({ error: "Failed to process payment success" }, { status: 500 })
  }
}
