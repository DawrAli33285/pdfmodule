import { type NextRequest, NextResponse } from "next/server"
import { anzsicMappingModel } from "@/lib/models/anzsic-mapping"

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params

    // Handle null/undefined codes
    if (!code || code === "null" || code === "undefined") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ANZSIC code",
          mapping: null,
        },
        { status: 400 },
      )
    }

    console.log(`🔍 Looking up ANZSIC mapping for code: ${code}`)

    const mapping = await anzsicMappingModel.findByAnzsicCode(code)

    if (!mapping) {
      console.log(`❌ No mapping found for ANZSIC code: ${code}`)
      return NextResponse.json({
        success: true,
        mapping: null,
        message: `No mapping found for ANZSIC code: ${code}`,
      })
    }

    console.log(`✅ Found mapping for ANZSIC code ${code}:`, mapping.atoCategory)

    return NextResponse.json({
      success: true,
      mapping,
    })
  } catch (error) {
    console.error("Error looking up ANZSIC mapping:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to lookup ANZSIC mapping",
        mapping: null,
      },
      { status: 500 },
    )
  }
}
