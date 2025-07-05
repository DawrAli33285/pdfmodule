import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { usageCount: 1 },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Keyword mapping not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Usage update error:", error)
    return NextResponse.json({ error: error.message || "Failed to update usage" }, { status: 500 })
  }
}
