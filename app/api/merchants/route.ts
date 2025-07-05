import { type NextRequest, NextResponse } from "next/server"
import { merchantModel } from "@/lib/models/merchant"

export async function GET(request: NextRequest) {
  try {
    const stats = await merchantModel.getStatistics()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Error fetching merchant stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch merchant stats",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantData = await request.json()

    const merchant = await merchantModel.create(merchantData)

    return NextResponse.json({
      success: true,
      merchant,
    })
  } catch (error) {
    console.error("Error creating merchant:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create merchant",
      },
      { status: 500 },
    )
  }
}
