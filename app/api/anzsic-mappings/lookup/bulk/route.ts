import { type NextRequest, NextResponse } from "next/server"
import { anzsicMappingModel } from "@/lib/models/anzsic-mapping"

export async function POST(request: NextRequest) {
  try {
    const { mappings } = await request.json()

    if (!Array.isArray(mappings)) {
      return NextResponse.json({ success: false, error: "Mappings must be an array" }, { status: 400 })
    }

    const result = await anzsicMappingModel.bulkCreate(mappings)

    return NextResponse.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
    })
  } catch (error) {
    console.error("Error creating bulk ANZSIC mappings:", error)
    return NextResponse.json({ success: false, error: "Failed to create ANZSIC mappings" }, { status: 500 })
  }
}
