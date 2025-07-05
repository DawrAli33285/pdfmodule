import { type NextRequest, NextResponse } from "next/server"
import { basiqService } from "@/lib/basiq-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      )
    }

    console.log("Fetching consents for user:", userId)

    // Get consents from Basiq
    const consents = await basiqService.getUserConsents(userId)

    return NextResponse.json({
      success: true,
      consents: consents,
    })
  } catch (error) {
    console.error("Basiq consents error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch consents",
      },
      { status: 500 },
    )
  }
}
