import { type NextRequest, NextResponse } from "next/server"
import { merchantModel } from "@/lib/models/merchant"
import { anzsicMappingModel } from "@/lib/models/anzsic-mapping"

interface TransactionToClassify {
  id: string
  description: string
  amount: number
}

// Enhanced internal merchant extraction with pattern matching
function extractMerchantInternally(description: string): {
  merchantName: string
  anzsicCode: string
  anzsicDescription: string
  confidence: number
  atoCategory: string
  isDeductible: boolean
} {
  console.log(`🔧 Internal extraction for: "${description}"`)

  const desc = description.toLowerCase()

  // Comprehensive pattern matching for common merchants
  const patterns = [
    // Fuel Stations
    {
      keywords: ["shell", "bp", "caltex", "mobil", "7-eleven", "ampol"],
      merchantName: "Fuel Station",
      anzsicCode: "4613",
      anzsicDescription: "Motor vehicle fuel retailing",
      atoCategory: "Vehicles, Travel & Transport",
      isDeductible: true,
      confidence: 85,
    },

    // Supermarkets
    {
      keywords: ["woolworths", "coles", "iga", "aldi", "foodworks"],
      merchantName: "Supermarket",
      anzsicCode: "4711",
      anzsicDescription: "Supermarket and grocery stores",
      atoCategory: "Other",
      isDeductible: false,
      confidence: 85,
    },

    // Fast Food
    {
      keywords: ["mcdonald", "kfc", "subway", "dominos", "pizza hut", "hungry jack"],
      merchantName: "Fast Food",
      anzsicCode: "5621",
      anzsicDescription: "Takeaway food services",
      atoCategory: "Meals & Entertainment (Work-Related)",
      isDeductible: true,
      confidence: 80,
    },

    // Coffee Shops
    {
      keywords: ["starbucks", "gloria jean", "coffee club", "cafe"],
      merchantName: "Coffee Shop",
      anzsicCode: "5621",
      anzsicDescription: "Takeaway food services",
      atoCategory: "Meals & Entertainment (Work-Related)",
      isDeductible: true,
      confidence: 75,
    },

    // Hardware Stores
    {
      keywords: ["bunnings", "masters", "mitre 10"],
      merchantName: "Hardware Store",
      anzsicCode: "4521",
      anzsicDescription: "Hardware and building supplies",
      atoCategory: "Equipment & Tools",
      isDeductible: true,
      confidence: 80,
    },

    // Electronics
    {
      keywords: ["jb hi-fi", "harvey norman", "officeworks", "dick smith"],
      merchantName: "Electronics Store",
      anzsicCode: "4252",
      anzsicDescription: "Electronics retailing",
      atoCategory: "Equipment & Tools",
      isDeductible: true,
      confidence: 80,
    },

    // Clothing
    {
      keywords: ["target", "kmart", "big w", "myer", "david jones"],
      merchantName: "Clothing Store",
      anzsicCode: "4721",
      anzsicDescription: "Clothing retailing",
      atoCategory: "Other",
      isDeductible: false,
      confidence: 75,
    },

    // Transport
    {
      keywords: ["uber", "taxi", "cabcharge", "transport"],
      merchantName: "Transport Service",
      anzsicCode: "7220",
      anzsicDescription: "Taxi and transport",
      atoCategory: "Vehicles, Travel & Transport",
      isDeductible: true,
      confidence: 80,
    },

    // Professional Services
    {
      keywords: ["accounting", "lawyer", "legal", "consultant"],
      merchantName: "Professional Service",
      anzsicCode: "6920",
      anzsicDescription: "Accounting services",
      atoCategory: "Professional Memberships & Fees",
      isDeductible: true,
      confidence: 70,
    },

    // Parking
    {
      keywords: ["parking", "wilson", "secure parking"],
      merchantName: "Parking",
      anzsicCode: "7220",
      anzsicDescription: "Transport services",
      atoCategory: "Vehicles, Travel & Transport",
      isDeductible: true,
      confidence: 75,
    },

    // Telecommunications
    {
      keywords: ["telstra", "optus", "vodafone", "tpg"],
      merchantName: "Telecommunications",
      anzsicCode: "5910",
      anzsicDescription: "Telecommunications",
      atoCategory: "Phone & Internet",
      isDeductible: true,
      confidence: 80,
    },

    // Banks/ATM
    {
      keywords: ["atm", "bank", "westpac", "commonwealth", "anz", "nab"],
      merchantName: "Banking Service",
      anzsicCode: "6220",
      anzsicDescription: "Banking",
      atoCategory: "Bank Fees",
      isDeductible: true,
      confidence: 70,
    },
  ]

  // Try to match patterns
  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (desc.includes(keyword)) {
        // Try to extract actual merchant name from description
        const words = description.split(/\s+/).filter((word) => word.length > 2)
        const merchantName =
          words.find((word) => word.toLowerCase().includes(keyword) || keyword.includes(word.toLowerCase())) ||
          pattern.merchantName

        console.log(
          `🎯 Pattern match: "${keyword}" -> ${pattern.merchantName} (${pattern.anzsicCode}) - deductible: ${pattern.isDeductible}`,
        )

        return {
          merchantName: merchantName.charAt(0).toUpperCase() + merchantName.slice(1).toLowerCase(),
          anzsicCode: pattern.anzsicCode,
          anzsicDescription: pattern.anzsicDescription,
          confidence: pattern.confidence,
          atoCategory: pattern.atoCategory,
          isDeductible: pattern.isDeductible,
        }
      }
    }
  }

  // Fallback: extract first meaningful word
  const cleaned = description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const excludeWords = new Set([
    "payment",
    "purchase",
    "withdrawal",
    "deposit",
    "transfer",
    "fee",
    "charge",
    "atm",
    "pos",
    "eft",
    "bpay",
    "direct",
    "debit",
    "credit",
    "card",
    "visa",
    "mastercard",
    "amex",
    "paypal",
    "apple",
    "google",
    "samsung",
    "pay",
    "transaction",
    "ref",
    "trace",
    "auth",
    "merchant",
    "terminal",
    "branch",
  ])

  const keywords = cleaned
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .filter((word) => !excludeWords.has(word))
    .filter((word) => !/^\d+$/.test(word))

  const merchantName =
    keywords.length > 0 ? keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1) : "Unknown Merchant"

  console.log(`🔧 Fallback extraction: "${merchantName}" (9999) - not deductible`)

  return {
    merchantName,
    anzsicCode: "9999",
    anzsicDescription: "General retail",
    confidence: 30,
    atoCategory: "Other",
    isDeductible: false,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json()

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 })
    }

    console.log(`🔧 INTERNAL merchant extraction for ${transactions.length} transactions (AI disabled due to quota)`)

    // Check if ANZSIC mappings exist
    const anzsicCount = await anzsicMappingModel.count()
    console.log(`📊 ANZSIC mappings in database: ${anzsicCount}`)

    // Use internal extraction for all transactions
    const results = transactions.map((transaction: TransactionToClassify) => {
      const internalResult = extractMerchantInternally(transaction.description)

      return {
        id: transaction.id,
        merchantName: internalResult.merchantName,
        anzsicCode: internalResult.anzsicCode,
        anzsicDescription: internalResult.anzsicDescription,
        confidence: internalResult.confidence,
        source: "internal",
        atoCategory: internalResult.atoCategory,
        isDeductible: internalResult.isDeductible,
      }
    })

    console.log(`✅ Internal extraction completed for ${results.length} transactions`)

    // Create comprehensive ANZSIC mappings if none exist
    if (anzsicCount === 0) {
      console.log("🏗️ Creating comprehensive ANZSIC mappings...")

      const comprehensiveMappings = [
        // Transport & Vehicle Related (Deductible)
        {
          anzsicCode: "4613",
          anzsicDescription: "Motor vehicle fuel retailing",
          atoCategory: "Vehicles, Travel & Transport",
          isDeductible: true,
        },
        {
          anzsicCode: "4520",
          anzsicDescription: "Motor vehicle parts and accessories",
          atoCategory: "Vehicles, Travel & Transport",
          isDeductible: true,
        },
        {
          anzsicCode: "7220",
          anzsicDescription: "Taxi and transport",
          atoCategory: "Vehicles, Travel & Transport",
          isDeductible: true,
        },
        { anzsicCode: "6220", anzsicDescription: "Banking", atoCategory: "Bank Fees", isDeductible: true },

        // Professional Services (Deductible)
        {
          anzsicCode: "6920",
          anzsicDescription: "Accounting services",
          atoCategory: "Tax & Accounting Expenses",
          isDeductible: true,
        },
        {
          anzsicCode: "6910",
          anzsicDescription: "Legal services",
          atoCategory: "Professional Memberships & Fees",
          isDeductible: true,
        },
        {
          anzsicCode: "7000",
          anzsicDescription: "Computer system design",
          atoCategory: "Equipment & Tools",
          isDeductible: true,
        },

        // Equipment & Tools (Deductible)
        {
          anzsicCode: "4521",
          anzsicDescription: "Hardware and building supplies",
          atoCategory: "Equipment & Tools",
          isDeductible: true,
        },
        {
          anzsicCode: "4252",
          anzsicDescription: "Electronics retailing",
          atoCategory: "Equipment & Tools",
          isDeductible: true,
        },

        // Communications (Deductible)
        {
          anzsicCode: "5910",
          anzsicDescription: "Telecommunications",
          atoCategory: "Phone & Internet",
          isDeductible: true,
        },

        // Education & Training (Deductible)
        {
          anzsicCode: "8010",
          anzsicDescription: "Primary education",
          atoCategory: "Education & Training",
          isDeductible: true,
        },
        {
          anzsicCode: "8020",
          anzsicDescription: "Secondary education",
          atoCategory: "Education & Training",
          isDeductible: true,
        },
        {
          anzsicCode: "8030",
          anzsicDescription: "Higher education",
          atoCategory: "Education & Training",
          isDeductible: true,
        },

        // Work-Related Meals (Deductible)
        {
          anzsicCode: "5621",
          anzsicDescription: "Takeaway food services",
          atoCategory: "Meals & Entertainment (Work-Related)",
          isDeductible: true,
        },
        {
          anzsicCode: "4512",
          anzsicDescription: "Cafes and restaurants",
          atoCategory: "Meals & Entertainment (Work-Related)",
          isDeductible: true,
        },

        // Personal/Non-Deductible
        {
          anzsicCode: "4711",
          anzsicDescription: "Supermarket and grocery stores",
          atoCategory: "Other",
          isDeductible: false,
        },
        { anzsicCode: "4721", anzsicDescription: "Clothing retailing", atoCategory: "Other", isDeductible: false },
        { anzsicCode: "9529", anzsicDescription: "Other personal services", atoCategory: "Other", isDeductible: false },
        { anzsicCode: "9999", anzsicDescription: "General retail", atoCategory: "Other", isDeductible: false },
      ]

      for (const mapping of comprehensiveMappings) {
        try {
          await anzsicMappingModel.create(mapping)
          console.log(
            `✅ Created ANZSIC mapping: ${mapping.anzsicCode} -> ${mapping.atoCategory} (deductible: ${mapping.isDeductible})`,
          )
        } catch (error) {
          console.log(`⚠️ ANZSIC mapping ${mapping.anzsicCode} might already exist`)
        }
      }
    }

    // Process results and create merchants
    let newMerchantsCreated = 0
    let existingMerchantsFound = 0
    let deductibleMerchants = 0

    for (const result of results) {
      if (
        result.merchantName &&
        result.merchantName !== "Unknown Merchant" &&
        result.anzsicCode &&
        /^\d{4}$/.test(result.anzsicCode)
      ) {
        try {
          const existingMerchant = await merchantModel.findByName(result.merchantName)

          if (!existingMerchant) {
            console.log(`🏪 Creating new merchant: ${result.merchantName} (${result.anzsicCode})`)

            await merchantModel.create({
              merchantName: result.merchantName,
              anzsicCode: result.anzsicCode,
              source: "internal",
              confidence: result.confidence,
            })

            newMerchantsCreated++
            console.log(`✅ Created merchant: ${result.merchantName}`)
          } else {
            existingMerchantsFound++
            console.log(`⚠️ Merchant already exists: ${result.merchantName}`)
          }

          if (result.isDeductible) {
            deductibleMerchants++
          }

          console.log(
            `✅ Processed ${result.merchantName} -> ${result.atoCategory} (deductible: ${result.isDeductible})`,
          )
        } catch (createError) {
          console.error(`❌ Failed to create merchant "${result.merchantName}":`, createError)
        }
      }
    }

    const totalMerchantsInDB = await merchantModel.count()
    const finalAnzsicCount = await anzsicMappingModel.count()

    console.log(`✅ Internal processing complete:`)
    console.log(`- New merchants created: ${newMerchantsCreated}`)
    console.log(`- Existing merchants found: ${existingMerchantsFound}`)
    console.log(`- Deductible merchants: ${deductibleMerchants}`)
    console.log(`- Total merchants in database: ${totalMerchantsInDB}`)
    console.log(`- ANZSIC mappings in database: ${finalAnzsicCount}`)

    const validMerchants = results.filter((r) => r.merchantName !== "Unknown Merchant")
    console.log(`✅ Extracted merchants for ${validMerchants.length}/${transactions.length} transactions`)

    return NextResponse.json({
      success: true,
      results: results,
      merchantStats: {
        newMerchantsCreated,
        existingMerchantsFound,
        totalMerchantsInDB,
        validMerchantsExtracted: validMerchants.length,
        anzsicMappingsInDB: finalAnzsicCount,
        deductibleMerchants,
        extractionSource: "internal",
        note: "Using internal pattern matching due to AI quota limits",
      },
    })
  } catch (error) {
    console.error("❌ Internal merchant extraction failed:", error)

    // FINAL FALLBACK: Return basic structure for all transactions
    const fallbackResults = transactions.map((t: TransactionToClassify) => ({
      id: t.id,
      merchantName: "Unknown Merchant",
      anzsicCode: "9999",
      anzsicDescription: "General retail",
      confidence: 0,
      atoCategory: "Other",
      isDeductible: false,
      source: "fallback",
    }))

    return NextResponse.json({
      success: true,
      results: fallbackResults,
      merchantStats: {
        newMerchantsCreated: 0,
        existingMerchantsFound: 0,
        totalMerchantsInDB: 0,
        validMerchantsExtracted: 0,
        anzsicMappingsInDB: 0,
        deductibleMerchants: 0,
        extractionSource: "fallback",
        error: error instanceof Error ? error.message : "Complete extraction failed",
      },
    })
  }
}
