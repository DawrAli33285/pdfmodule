import { type NextRequest, NextResponse } from "next/server"
import { basiqService } from "@/lib/basiq-service"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, email } = await request.json()

    if (!phoneNumber || !email) {
      return NextResponse.json({ success: false, error: "Phone number and email are required" }, { status: 400 })
    }

    console.log("Starting Basiq connection process...")
    console.log("Phone:", phoneNumber, "Email:", email)

    // Use the Basiq service to handle the connection
    const result = await basiqService.connectBankAccount(email, phoneNumber)

    return NextResponse.json({
      success: true,
      authId: result.authId,
      userId: result.userId,
    })
  } catch (error) {
    console.error("Basiq connect error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect to Basiq",
      },
      { status: 500 },
    )
  }
}
