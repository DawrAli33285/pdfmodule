import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Checking onboarding data storage...")

    // Check localStorage simulation (this would be client-side)
    const debugData = {
      timestamp: new Date().toISOString(),
      keywordMappingsCheck: null as any,
      databaseConnection: null as any,
      sampleKeywords: [] as any[],
      collectionStats: null as any,
    }

    // Check database connection and keyword mappings
    let totalCount = 0 // Declare totalCount variable
    try {
      const client = await clientPromise
      const db = client.db("taxapp")
      const collection = db.collection("keyword_mappings")

      debugData.databaseConnection = "✅ Connected successfully"

      // Get collection stats
      totalCount = await collection.countDocuments() // Assign value to totalCount
      const deductibleCount = await collection.countDocuments({ status: "deductible" })
      const nonDeductibleCount = await collection.countDocuments({ status: "non-deductible" })

      debugData.collectionStats = {
        total: totalCount,
        deductible: deductibleCount,
        nonDeductible: nonDeductibleCount,
      }

      // Get sample keywords
      const sampleKeywords = await collection.find({}).limit(10).toArray()
      debugData.sampleKeywords = sampleKeywords.map((k) => ({
        keyword: k.keyword,
        status: k.status,
        atoCategory: k.atoCategory,
        source: k.source,
      }))

      // Test specific keywords that should exist
      const testKeywords = ["uber", "coles", "fuel", "laptop", "netflix"]
      const keywordTests = {}

      for (const keyword of testKeywords) {
        const found = await collection.findOne({ keyword: keyword.toLowerCase() })
        keywordTests[keyword] = found
          ? {
              status: found.status,
              atoCategory: found.atoCategory,
              confidence: found.confidenceLevel,
            }
          : "❌ NOT FOUND"
      }

      debugData.keywordMappingsCheck = keywordTests
    } catch (dbError) {
      debugData.databaseConnection = `❌ Database error: ${dbError.message}`
      debugData.keywordMappingsCheck = "❌ Could not check due to DB error"
    }

    return NextResponse.json({
      success: true,
      debug: debugData,
      recommendations: [
        totalCount === 0 ? "🚨 No keywords in database - run seeding script" : null,
        totalCount < 50 ? "⚠️ Very few keywords - consider running comprehensive seeding" : null,
        "💡 Check logs for keyword extraction and database lookup details",
        "🔧 Verify MongoDB connection string and database name",
      ].filter(Boolean),
    })
  } catch (error: any) {
    console.error("❌ Debug endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        debug: {
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name,
          stack: error.stack,
        },
      },
      { status: 500 },
    )
  }
}
