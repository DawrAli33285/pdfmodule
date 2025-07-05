import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { description, exact = false, threshold = 60 } = await request.json()

    if (!description || typeof description !== "string") {
      return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection("keyword_mappings")

    // Clean and normalize the description
    const cleanedDescription = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Extract words from description
    const words = cleanedDescription.split(" ").filter((word) => word.length >= 2)

    if (exact) {
      // Exact match only
      const exactMatch = await collection.findOne({ keyword: cleanedDescription })
      if (exactMatch) {
        return NextResponse.json({
          success: true,
          mapping: {
            ...exactMatch,
            id: exactMatch._id.toString(),
          },
          matchType: "exact",
          matchScore: 100,
        })
      }
      return NextResponse.json({ success: false, mapping: null })
    }

    // Try exact word match first
    for (const word of words) {
      if (word.length >= 3) {
        const exactMatch = await collection.findOne({ keyword: word })
        if (exactMatch) {
          // Update usage count asynchronously
          collection.updateOne({ _id: exactMatch._id }, { $inc: { usageCount: 1 } }).catch(console.error)

          return NextResponse.json({
            success: true,
            mapping: {
              ...exactMatch,
              id: exactMatch._id.toString(),
            },
            matchType: "exact",
            matchScore: 100,
          })
        }
      }
    }

    // Try contains match next (more generous)
    const containsQueries = words
      .filter((word) => word.length >= 3)
      .map((word) => ({ keyword: { $regex: word, $options: "i" } }))

    if (containsQueries.length > 0) {
      const containsMatch = await collection.findOne({ $or: containsQueries })
      if (containsMatch) {
        // Update usage count asynchronously
        collection.updateOne({ _id: containsMatch._id }, { $inc: { usageCount: 1 } }).catch(console.error)

        return NextResponse.json({
          success: true,
          mapping: {
            ...containsMatch,
            id: containsMatch._id.toString(),
          },
          matchType: "contains",
          matchScore: 80,
        })
      }
    }

    // Try fuzzy match as last resort (most generous)
    const allKeywords = await collection
      .find({})
      .project({ keyword: 1, status: 1, atoCategory: 1, confidenceLevel: 1, source: 1, usageCount: 1 })
      .toArray()

    let bestMatch = null
    let bestScore = threshold

    for (const keywordDoc of allKeywords) {
      const keyword = keywordDoc.keyword.toLowerCase()

      // Check if any word in description contains the keyword or vice versa
      for (const word of words) {
        if (word.length < 3) continue

        if (keyword.includes(word) || word.includes(keyword)) {
          const score = Math.min(
            (keyword.length / Math.max(keyword.length, word.length)) * 100,
            (word.length / Math.max(keyword.length, word.length)) * 100,
          )

          if (score > bestScore) {
            bestScore = score
            bestMatch = keywordDoc
          }
        }
      }
    }

    if (bestMatch) {
      // Update usage count asynchronously
      collection.updateOne({ _id: bestMatch._id }, { $inc: { usageCount: 1 } }).catch(console.error)

      return NextResponse.json({
        success: true,
        mapping: {
          ...bestMatch,
          id: bestMatch._id.toString(),
        },
        matchType: "fuzzy",
        matchScore: bestScore,
      })
    }

    return NextResponse.json({ success: false, mapping: null })
  } catch (error: any) {
    console.error("❌ Search error:", error)
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 })
  }
}
