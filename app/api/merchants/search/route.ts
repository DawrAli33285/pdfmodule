import { type NextRequest, NextResponse } from "next/server"
import { merchantModel } from "@/lib/models/merchant"

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          error: "Description is required",
        },
        { status: 400 },
      )
    }

    const merchants = await merchantModel.searchByKeywords(description)

    return NextResponse.json({
      success: true,
      merchants,
      count: merchants.length,
    })
  } catch (error) {
    console.error("Error searching merchants:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search merchants",
      },
      { status: 500 },
    )
  }
}
