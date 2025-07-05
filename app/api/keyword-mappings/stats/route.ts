import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    const [total, deductible, nonDeductible, avgConfidence, mostUsed] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: "deductible" }),
      collection.countDocuments({ status: "non-deductible" }),
      collection
        .aggregate([{ $group: { _id: null, avg: { $avg: "$confidenceLevel" } } }])
        .toArray()
        .then((result) => (result.length > 0 ? result[0].avg : 0)),
      collection
        .find({})
        .sort({ usageCount: -1 })
        .limit(10)
        .toArray()
        .then((docs) =>
          docs.map((doc) => ({
            id: doc._id.toString(),
            keyword: doc.keyword,
            status: doc.status,
            usageCount: doc.usageCount || 0,
          })),
        ),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        total,
        deductible,
        nonDeductible,
        averageConfidence: Math.round(avgConfidence * 10) / 10,
        mostUsed,
      },
    })
  } catch (error: any) {
    console.error("❌ Stats error:", error)
    return NextResponse.json({ error: error.message || "Failed to get stats" }, { status: 500 })
  }
}
