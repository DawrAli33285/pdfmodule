import { NextResponse } from "next/server"
import { merchantModel } from "@/lib/models/merchant"

export async function POST(req: Request) {
  try {
    const { descriptions } = await req.json()

    if (!Array.isArray(descriptions)) {
      return NextResponse.json({ error: "Descriptions array is required" }, { status: 400 })
    }

    console.log(`🔍 Bulk searching merchants for ${descriptions.length} descriptions`)

    const results = await merchantModel.bulkSearch(descriptions)

    // Convert Map to object for JSON response
    const resultsObject: Record<string, { merchant: any; matchScore: number }> = {}
    for (const [key, value] of results.entries()) {
      resultsObject[key] = value
    }

    return NextResponse.json({
      success: true,
      matches: resultsObject,
      totalMatches: results.size,
    })
  } catch (error) {
    console.error("Error bulk searching merchants:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
