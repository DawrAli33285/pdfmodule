import { type NextRequest, NextResponse } from "next/server"
import { anzsicMappingModel } from "@/lib/models/anzsic-mapping"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const { mappings, total } = await anzsicMappingModel.findAll(page, limit)

    return NextResponse.json({
      success: true,
      mappings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching ANZSIC mappings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch ANZSIC mappings",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mappings } = body

    if (!Array.isArray(mappings)) {
      return NextResponse.json(
        {
          success: false,
          error: "Mappings must be an array",
        },
        { status: 400 },
      )
    }

    const result = await anzsicMappingModel.bulkCreate(mappings)

    return NextResponse.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      message: `Created ${result.created} mappings, skipped ${result.skipped} existing ones`,
    })
  } catch (error) {
    console.error("Error creating ANZSIC mappings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create ANZSIC mappings",
      },
      { status: 500 },
    )
  }
}
