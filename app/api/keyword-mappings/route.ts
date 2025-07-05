import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mappings } = body

    if (!Array.isArray(mappings) || mappings.length === 0) {
      return NextResponse.json({ error: "Mappings array is required" }, { status: 400 })
    }

    console.log(`💾 Creating ${mappings.length} keyword mappings...`)

    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    // Get all existing keywords to avoid duplicates
    const keywords = mappings.map((m) => m.keyword.toLowerCase().trim())
    const existingKeywords = await collection
      .find({ keyword: { $in: keywords } })
      .project({ keyword: 1 })
      .toArray()

    const existingSet = new Set(existingKeywords.map((doc) => doc.keyword))

    // Filter out existing keywords
    const newMappings = mappings
      .filter((mapping) => !existingSet.has(mapping.keyword.toLowerCase().trim()))
      .map((mapping) => ({
        keyword: mapping.keyword.toLowerCase().trim(),
        status: mapping.status,
        atoCategory: mapping.atoCategory,
        confidenceLevel: mapping.confidenceLevel,
        source: mapping.source || "ai",
        description: mapping.description || null,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

    let created = 0
    if (newMappings.length > 0) {
      const result = await collection.insertMany(newMappings)
      created = result.insertedCount
    }

    const skipped = mappings.length - created

    console.log(`✅ Created ${created} new mappings, skipped ${skipped} duplicates`)

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: `Created ${created} new mappings, skipped ${skipped} duplicates`,
    })
  } catch (error: any) {
    console.error("❌ Error creating keyword mappings:", error)
    return NextResponse.json({ error: error.message || "Failed to create keyword mappings" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const sortBy = searchParams.get("sortBy") || "keyword"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    const skip = (page - 1) * limit
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    const [mappings, total] = await Promise.all([
      collection.find().sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(),
    ])

    return NextResponse.json({
      success: true,
      mappings: mappings.map((mapping) => ({
        ...mapping,
        id: mapping._id.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error("Error getting keyword mappings:", error)
    return NextResponse.json({ error: error.message || "Failed to get keyword mappings" }, { status: 500 })
  }
}
