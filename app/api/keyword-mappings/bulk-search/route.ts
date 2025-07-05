import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

interface KeywordMapping {
  _id: string
  keyword: string
  status: "deductible" | "non-deductible"
  atoCategory: string | null
  confidenceLevel: number
  source: string
  description?: string
  examples?: string[]
  usageCount?: number
  createdAt?: Date
  updatedAt?: Date
}

interface SearchResult {
  mapping: KeywordMapping
  matchType: "exact" | "contains" | "fuzzy"
  matchScore: number
}

// 🔥 THIS FUNCTION EXTRACTS MERCHANTS FOR LOOKUP - SHOULD MATCH THE SAVE LOGIC
function extractMerchantFromDescription(description: string): string | null {
  console.log(`🔍 BULK SEARCH - EXTRACTING MERCHANT from: "${description}"`)

  // Use the same enhanced merchant extraction logic as the save function
  const originalDesc = description.trim()

  // Common patterns for different transaction types
  const patterns = [
    // Pattern 1: "Debit Card Purchase MERCHANT_NAME Location..."
    /(?:debit card purchase|card purchase|purchase)\s+([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)(?:\s+(?:sydney|melbourne|brisbane|perth|adelaide|australia|aus|nsw|vic|qld|wa|sa|nt|act))/i,

    // Pattern 2: "EFTPOS MERCHANT_NAME Location"
    /^eftpos\s+([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)(?:\s+(?:sydney|melbourne|brisbane|perth|adelaide|australia|aus|nsw|vic|qld|wa|sa|nt|act))/i,

    // Pattern 3: "Direct Debit MERCHANT_NAME"
    /(?:direct debit|dd)\s+([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)(?:\s|$)/i,

    // Pattern 4: "Transfer to/from MERCHANT_NAME"
    /(?:transfer (?:to|from)|tfr)\s+([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)(?:\s|$)/i,

    // Pattern 5: "MERCHANT_NAME *trip" (for Uber)
    /([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)\s*\*(?:trip|ride|delivery)/i,

    // Pattern 6: "MERCHANT_NAME - Description"
    /^([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)\s*[-–]\s*/i,

    // Pattern 7: Just the first meaningful word after common prefixes
    /(?:^|\s)([a-zA-Z][a-zA-Z0-9&\-'.]{3,}?)(?:\s|$)/i,
  ]

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = originalDesc.match(pattern)

    if (match && match[1]) {
      let merchant = match[1].trim()

      // Clean up the merchant name
      merchant = merchant
        .replace(/\s+/g, " ") // Normalize spaces
        .replace(/[^\w\s&\-'.]/g, "") // Remove special chars except business-friendly ones
        .trim()

      // Skip if it's a common word or too generic
      const skipWords = new Set([
        "card",
        "debit",
        "credit",
        "purchase",
        "payment",
        "transaction",
        "eftpos",
        "transfer",
        "withdrawal",
        "deposit",
        "fee",
        "charge",
        "service",
        "bank",
        "australia",
        "sydney",
        "melbourne",
        "brisbane",
        "perth",
        "adelaide",
        "nsw",
        "vic",
        "qld",
        "wa",
        "sa",
        "nt",
        "act",
        "aus",
      ])

      if (!skipWords.has(merchant.toLowerCase()) && merchant.length >= 3) {
        console.log(`✅ BULK SEARCH - MERCHANT EXTRACTED (Pattern ${i + 1}): "${merchant}" from "${description}"`)
        return merchant
      }
    }
  }

  console.log(`❌ BULK SEARCH - NO MERCHANT FOUND in: "${description}"`)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { descriptions } = await request.json()

    if (!descriptions || !Array.isArray(descriptions)) {
      return NextResponse.json(
        {
          success: false,
          error: "Descriptions array is required",
        },
        { status: 400 },
      )
    }

    console.log(`🔍 BULK searching ${descriptions.length} descriptions`)

    const client = await clientPromise
    const db = client.db("moulai-tax-app")
    const collection = db.collection("keyword_mappings")

    const results: { [description: string]: SearchResult } = {}

    // Extract unique merchants from all descriptions
    const merchantMap = new Map<string, string[]>()
    const allMerchants = new Set<string>()

    for (const description of descriptions) {
      const merchant = extractMerchantFromDescription(description)
      if (merchant) {
        const normalizedMerchant = merchant.toLowerCase().trim()
        allMerchants.add(normalizedMerchant)

        if (!merchantMap.has(normalizedMerchant)) {
          merchantMap.set(normalizedMerchant, [])
        }
        merchantMap.get(normalizedMerchant)!.push(description)

        console.log(`🔍 Merchant extraction: "${description.substring(0, 50)}..." → "${normalizedMerchant}"`)
      }
    }

    console.log(`🏪 Extracted ${allMerchants.size} unique merchants from ${descriptions.length} descriptions`)

    if (allMerchants.size === 0) {
      console.log("⚠️ No merchants extracted from descriptions")
      return NextResponse.json({
        success: true,
        results: {},
        stats: {
          totalDescriptions: descriptions.length,
          uniqueMerchants: 0,
          matches: 0,
        },
      })
    }

    // Perform bulk lookup for all unique merchants
    const merchantArray = Array.from(allMerchants)
    console.log(
      `🔍 Performing bulk lookup for merchants: ${merchantArray.slice(0, 10).join(", ")}${merchantArray.length > 10 ? "..." : ""}`,
    )

    // Try exact matches first
    const exactMatches = await collection
      .find({
        keyword: { $in: merchantArray },
      })
      .toArray()

    console.log(`✅ Found ${exactMatches.length} exact matches out of ${merchantArray.length} merchants`)

    // Create a map of merchant to mapping for quick lookup
    const merchantToMapping = new Map<string, KeywordMapping>()
    exactMatches.forEach((mapping) => {
      merchantToMapping.set(mapping.keyword, mapping)
      console.log(`✅ EXACT MATCH: "${mapping.keyword}" → ${mapping.status} (${mapping.atoCategory || "N/A"})`)
    })

    // For merchants without exact matches, try fuzzy matching
    const unmatchedMerchants = merchantArray.filter((m) => !merchantToMapping.has(m))

    if (unmatchedMerchants.length > 0) {
      console.log(`🔍 Trying fuzzy matching for ${unmatchedMerchants.length} unmatched merchants`)

      // Try contains matching for unmatched merchants
      for (const merchant of unmatchedMerchants.slice(0, 20)) {
        // Limit to prevent performance issues
        const containsMatches = await collection
          .find({
            keyword: { $regex: merchant, $options: "i" },
          })
          .limit(1)
          .toArray()

        if (containsMatches.length > 0) {
          merchantToMapping.set(merchant, containsMatches[0])
          console.log(`✅ FUZZY MATCH: "${merchant}" → "${containsMatches[0].keyword}" → ${containsMatches[0].status}`)
        } else {
          console.log(`❌ No match for merchant: "${merchant}"`)
        }
      }
    }

    // Map results back to original descriptions
    let totalMatches = 0
    for (const [merchant, descriptions] of merchantMap.entries()) {
      const mapping = merchantToMapping.get(merchant)
      if (mapping) {
        for (const description of descriptions) {
          results[description] = {
            mapping: {
              _id: mapping._id.toString(),
              keyword: mapping.keyword,
              status: mapping.status,
              atoCategory: mapping.atoCategory,
              confidenceLevel: mapping.confidenceLevel,
              source: mapping.source,
              description: mapping.description,
              examples: mapping.examples,
              usageCount: mapping.usageCount,
              createdAt: mapping.createdAt,
              updatedAt: mapping.updatedAt,
            },
            matchType: mapping.keyword === merchant ? "exact" : "fuzzy",
            matchScore: mapping.keyword === merchant ? 100 : 80,
          }
          totalMatches++
        }
      }
    }

    console.log(`📊 BULK SEARCH COMPLETE: ${totalMatches}/${descriptions.length} matched`)

    return NextResponse.json({
      success: true,
      results,
      stats: {
        totalDescriptions: descriptions.length,
        uniqueMerchants: allMerchants.size,
        matches: totalMatches,
        exactMatches: exactMatches.length,
        fuzzyMatches: totalMatches - exactMatches.length,
      },
    })
  } catch (error: any) {
    console.error("❌ Bulk search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
