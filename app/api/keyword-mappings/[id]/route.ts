import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    const mapping = await collection.findOne({ _id: new ObjectId(id) })

    if (!mapping) {
      return NextResponse.json({ error: "Keyword mapping not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      mapping: {
        ...mapping,
        id: mapping._id.toString(),
      },
    })
  } catch (error: any) {
    console.error("❌ Get mapping error:", error)
    return NextResponse.json({ error: error.message || "Failed to get mapping" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    const update = {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    }

    const result = await collection.findOneAndUpdate({ _id: new ObjectId(id) }, update, { returnDocument: "after" })

    if (!result) {
      return NextResponse.json({ error: "Keyword mapping not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      mapping: {
        ...result,
        id: result._id.toString(),
      },
    })
  } catch (error: any) {
    console.error("❌ Update mapping error:", error)
    return NextResponse.json({ error: error.message || "Failed to update mapping" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Keyword mapping not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Delete mapping error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete mapping" }, { status: 500 })
  }
}
