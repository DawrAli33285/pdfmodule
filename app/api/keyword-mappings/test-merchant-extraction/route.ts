import { type NextRequest, NextResponse } from "next/server"

// Test the merchant extraction logic
function extractMerchantName(description: string): string | null {
  console.log(`🔍 TESTING MERCHANT EXTRACTION: "${description}"`)

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
        console.log(`✅ MERCHANT EXTRACTED (Pattern ${i + 1}): "${merchant}"`)
        return merchant
      }
    }
  }

  console.log(`❌ NO MERCHANT FOUND`)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          error: "Description is required",
        },
        { status: 400 },
      )
    }

    const merchant = extractMerchantName(description)

    return NextResponse.json({
      success: true,
      description,
      extractedMerchant: merchant,
      explanation: merchant
        ? `Successfully extracted "${merchant}" as the merchant name`
        : "Could not extract merchant name from description",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
