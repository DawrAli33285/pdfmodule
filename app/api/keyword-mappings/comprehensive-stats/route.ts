import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Getting comprehensive keyword mapping statistics...")

    const client = await clientPromise
    const db = client.db("moulai-tax-app")
    const collection = db.collection("keyword_mappings")

    // Get total counts
    const totalMappings = await collection.countDocuments()
    const deductibleMappings = await collection.countDocuments({ status: "deductible" })
    const nonDeductibleMappings = await collection.countDocuments({ status: "non-deductible" })

    // Calculate average confidence
    const avgConfidenceResult = await collection
      .aggregate([
        {
          $group: {
            _id: null,
            averageConfidence: { $avg: "$confidenceLevel" },
          },
        },
      ])
      .toArray()

    const averageConfidence = avgConfidenceResult.length > 0 ? avgConfidenceResult[0].averageConfidence : 0

    // Get category breakdown
    const categoryBreakdown = await collection
      .aggregate([
        { $match: { status: "deductible" } },
        {
          $group: {
            _id: "$atoCategory",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()

    // Get source breakdown
    const sourceBreakdown = await collection
      .aggregate([
        {
          $group: {
            _id: "$source",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()

    // Get most used keywords
    const mostUsedKeywords = await collection.find({}).sort({ usageCount: -1 }).limit(10).toArray()

    const stats = {
      totalMappings,
      deductibleMappings,
      nonDeductibleMappings,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      categoryBreakdown: categoryBreakdown.map((item) => ({
        category: item._id || "Uncategorized",
        count: item.count,
      })),
      sourceBreakdown: sourceBreakdown.map((item) => ({
        source: item._id || "Unknown",
        count: item.count,
      })),
      mostUsedKeywords: mostUsedKeywords.map((item) => ({
        keyword: item.keyword,
        usageCount: item.usageCount || 0,
        status: item.status,
      })),
    }

    console.log("✅ Comprehensive statistics calculated:", {
      total: stats.totalMappings,
      deductible: stats.deductibleMappings,
      nonDeductible: stats.nonDeductibleMappings,
    })

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error("❌ Error getting comprehensive statistics:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
