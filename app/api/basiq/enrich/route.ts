import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json()

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        {
          success: false,
          error: "Transactions array is required",
        },
        { status: 400 },
      )
    }

    console.log("Enriching", transactions.length, "transactions with intelligent mock data")

    // Use intelligent mock enrichment directly (no API calls)
    const enrichedTransactions = addIntelligentEnrichment(transactions)

    return NextResponse.json({
      success: true,
      enriched: true,
      transactions: enrichedTransactions,
      enrichmentStats: {
        total: transactions.length,
        enriched: enrichedTransactions.filter((txn: any) => txn.enriched).length,
        failed: 0,
      },
      note: "Using intelligent mock enrichment data based on transaction patterns",
    })
  } catch (error) {
    console.error("Enrich API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to enrich transactions",
      },
      { status: 500 },
    )
  }
}

// Comprehensive function to add intelligent enrichment data
function addIntelligentEnrichment(transactions: any[]) {
  const anzsicDatabase = [
    // Supermarkets & Grocery
    {
      keywords: ["woolworths", "coles", "iga", "aldi", "supermarket", "grocery", "foodworks", "spar"],
      anzsicCode: "4711",
      anzsicDescription: "Supermarket and Grocery Stores",
      merchantCategory: "Grocery & Supermarkets",
      tags: ["essential", "food", "household"],
    },
    // Restaurants & Cafes
    {
      keywords: [
        "mcdonald",
        "kfc",
        "subway",
        "domino",
        "pizza",
        "restaurant",
        "cafe",
        "coffee",
        "starbucks",
        "hungry jack",
      ],
      anzsicCode: "5611",
      anzsicDescription: "Cafes and Restaurants",
      merchantCategory: "Food & Dining",
      tags: ["dining", "food-service"],
    },
    // Takeaway Food
    {
      keywords: ["uber eats", "deliveroo", "menulog", "takeaway", "delivery", "doordash"],
      anzsicCode: "5621",
      anzsicDescription: "Takeaway Food Services",
      merchantCategory: "Food Delivery",
      tags: ["convenience", "delivery"],
    },
    // Fuel Stations
    {
      keywords: ["shell", "bp", "caltex", "7-eleven", "fuel", "petrol", "gas station", "ampol", "united"],
      anzsicCode: "4520",
      anzsicDescription: "Automotive Fuel Retailing",
      merchantCategory: "Fuel & Automotive",
      tags: ["transport", "fuel", "potential-business-expense"],
    },
    // Banking & Finance
    {
      keywords: ["salary", "wage", "payment", "transfer", "interest", "fee", "bank", "atm"],
      anzsicCode: "6010",
      anzsicDescription: "Banking",
      merchantCategory: "Banking & Finance",
      tags: ["banking", "finance"],
    },
    // Clothing & Fashion
    {
      keywords: ["target", "kmart", "big w", "myer", "david jones", "clothing", "fashion", "uniqlo", "zara"],
      anzsicCode: "4251",
      anzsicDescription: "Clothing Retailing",
      merchantCategory: "Clothing & Fashion",
      tags: ["retail", "clothing"],
    },
    // Electronics & Office Supplies
    {
      keywords: ["jb hi-fi", "harvey norman", "officeworks", "apple", "electronics", "office supplies", "computer"],
      anzsicCode: "4321",
      anzsicDescription: "Electrical and Electronic Goods Retailing",
      merchantCategory: "Electronics & Technology",
      tags: ["technology", "electronics", "potential-business-expense"],
    },
    // Pharmacy & Health
    {
      keywords: ["chemist", "pharmacy", "priceline", "terry white", "health", "medical", "doctor"],
      anzsicCode: "4271",
      anzsicDescription: "Pharmaceutical and Other Store-Based Retailing",
      merchantCategory: "Health & Pharmacy",
      tags: ["health", "medical"],
    },
    // Transport Services
    {
      keywords: ["uber", "taxi", "transport", "bus", "train", "metro", "parking", "toll"],
      anzsicCode: "4620",
      anzsicDescription: "Road Transport",
      merchantCategory: "Transport Services",
      tags: ["transport", "travel", "potential-business-expense"],
    },
    // Utilities
    {
      keywords: ["electricity", "gas", "water", "internet", "phone", "telstra", "optus", "vodafone", "utility"],
      anzsicCode: "2610",
      anzsicDescription: "Electricity Supply",
      merchantCategory: "Utilities",
      tags: ["utilities", "essential", "potential-business-expense"],
    },
    // Insurance
    {
      keywords: ["insurance", "aami", "nrma", "budget direct", "allianz", "suncorp"],
      anzsicCode: "6201",
      anzsicDescription: "General Insurance",
      merchantCategory: "Insurance",
      tags: ["insurance", "protection", "potential-business-expense"],
    },
    // Entertainment & Subscriptions
    {
      keywords: ["netflix", "spotify", "cinema", "movie", "entertainment", "subscription", "disney", "amazon prime"],
      anzsicCode: "5921",
      anzsicDescription: "Sound Recording and Music Publishing",
      merchantCategory: "Entertainment & Media",
      tags: ["entertainment", "subscription"],
    },
    // Hardware & Home Improvement
    {
      keywords: ["bunnings", "hardware", "home improvement", "tools", "mitre 10", "masters"],
      anzsicCode: "4291",
      anzsicDescription: "Hardware, Building and Garden Supplies Retailing",
      merchantCategory: "Hardware & Home",
      tags: ["home-improvement", "tools", "potential-business-expense"],
    },
    // Professional Services
    {
      keywords: ["accountant", "lawyer", "consultant", "professional", "legal", "accounting", "advisory"],
      anzsicCode: "6920",
      anzsicDescription: "Accounting Services",
      merchantCategory: "Professional Services",
      tags: ["business", "professional", "potential-business-expense"],
    },
    // Software & Technology Services
    {
      keywords: ["software", "saas", "microsoft", "adobe", "google", "aws", "cloud", "hosting"],
      anzsicCode: "7000",
      anzsicDescription: "Computer System Design and Related Services",
      merchantCategory: "Technology Services",
      tags: ["technology", "software", "potential-business-expense"],
    },
    // Education & Training
    {
      keywords: ["education", "training", "course", "university", "tafe", "school", "learning"],
      anzsicCode: "8102",
      anzsicDescription: "Higher Education",
      merchantCategory: "Education & Training",
      tags: ["education", "training", "potential-business-expense"],
    },
    // Accommodation & Travel
    {
      keywords: ["hotel", "accommodation", "airbnb", "booking", "travel", "flight", "airline"],
      anzsicCode: "4400",
      anzsicDescription: "Accommodation",
      merchantCategory: "Travel & Accommodation",
      tags: ["travel", "accommodation", "potential-business-expense"],
    },
  ]

  return transactions.map((txn: any) => {
    const description = (txn.description || "").toLowerCase()

    // Find matching ANZSIC category
    let matchedCategory = null
    let matchScore = 0

    for (const category of anzsicDatabase) {
      const matches = category.keywords.filter((keyword) => description.includes(keyword))
      if (matches.length > matchScore) {
        matchedCategory = category
        matchScore = matches.length
      }
    }

    // Default category for unmatched transactions
    if (!matchedCategory) {
      matchedCategory = {
        anzsicCode: "9999",
        anzsicDescription: "Other Services",
        merchantCategory: "Other",
        tags: ["uncategorized"],
      }
    }

    // Extract merchant name (clean up the description)
    let merchantName = txn.description
    if (merchantName) {
      // Remove common transaction prefixes/suffixes
      merchantName = merchantName
        .replace(/^(EFTPOS|VISA|MASTERCARD|PAYPAL|DIRECT DEBIT)\s*/i, "")
        .replace(/\s*\d{2}\/\d{2}$/, "") // Remove dates
        .replace(/\s*AUS$/, "") // Remove country codes
        .replace(/\s*\d{4}$/, "") // Remove 4-digit codes
        .trim()
    }

    // Determine if this could be a business expense
    const isBusinessExpense = matchedCategory.tags.includes("potential-business-expense")
    const isDebitTransaction = txn.type === "debit" || Number.parseFloat(txn.amount || "0") < 0

    // Calculate confidence based on match quality
    let confidence: "low" | "medium" | "high" = "medium"
    if (matchScore > 1) {
      confidence = "high"
    } else if (matchedCategory.anzsicCode === "9999") {
      confidence = "low"
    }

    // Enhanced tags based on transaction analysis
    const enhancedTags = [...matchedCategory.tags]
    if (isBusinessExpense && isDebitTransaction) {
      enhancedTags.push("potential-business-expense")
    }

    // Add amount-based tags
    const amount = Math.abs(Number.parseFloat(txn.amount || "0"))
    if (amount > 1000) {
      enhancedTags.push("large-expense")
    } else if (amount < 10) {
      enhancedTags.push("small-expense")
    }

    // Add frequency tags (mock - in real app would analyze transaction history)
    if (description.includes("subscription") || description.includes("monthly")) {
      enhancedTags.push("recurring")
    }

    return {
      ...txn,
      enriched: true,
      anzsicCode: matchedCategory.anzsicCode,
      anzsicDescription: matchedCategory.anzsicDescription,
      merchantName: merchantName || txn.description,
      merchantCategory: matchedCategory.merchantCategory,
      tags: enhancedTags,
      // Add potential tax deduction flag
      potentialDeduction: isBusinessExpense && isDebitTransaction,
      // Add confidence score
      enrichmentConfidence: confidence,
      // Add match score for debugging
      matchScore: matchScore,
    }
  })
}
