import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TransactionToClassify {
  id: string
  description: string
  amount: number
}

export async function POST(request: NextRequest) {
  try {
    const { transactions, enabledCategories } = await request.json()

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: false, error: "Transactions array is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not configured, falling back to non-deductible")
      return NextResponse.json({
        success: true,
        results: transactions.map((t: TransactionToClassify) => ({
          id: t.id,
          status: "deductible", // Default to deductible when no API key
          atoCategory: "Work Tools, Equipment & Technology",
          confidence: 60,
          reasoning: "OpenAI API not configured, defaulting to deductible",
          merchantName: "unknown", // Add merchant extraction fallback
        })),
      })
    }

    // FAST PROCESSING: Use GPT-3.5-turbo for speed, batch up to 20 transactions
    const batchSize = Math.min(transactions.length, 20)
    // Only include transactions with negative amounts
    const batch = transactions
      .filter((t) => t.amount < 0)
      .slice(0, 20);

    // Get all deduction categories
    const allCategories = [
      "Vehicles, Travel & Transport",
      "Work Tools, Equipment & Technology",
      "Work Clothing & Uniforms",
      "Home Office Expenses",
      "Education & Training",
      "Professional Memberships & Fees",
      "Meals & Entertainment (Work-Related)",
      "Personal Grooming & Wellbeing",
      "Gifts & Donations",
      "Investments, Insurance & Superannuation",
      "Tax & Accounting Expenses",
    ]

    // Use enabled categories if provided, otherwise use all categories
    const categoriesList =
      Array.isArray(enabledCategories) && enabledCategories.length > 0 ? enabledCategories : allCategories

    // Create optimized prompt for VERY GENEROUS deduction detection + MERCHANT EXTRACTION
    const transactionList = batch
      .map(
        (t: TransactionToClassify, index: number) =>
          `${index + 1}. ID: ${t.id}, Description: "${t.description}", Amount: $${Math.abs(t.amount).toFixed(2)}`,
      )
      .join("\n")

    const prompt = `You are an Australian tax expert AND merchant extraction specialist. For each transaction, you must:

1. CLASSIFY for tax deductions (if it is likely to be classify as deductible then classify as deductible - be smart). If the descriotion include Bpay, Payment it is non-deductible. The atoCategory should be consistent with what you've already given previously.
2. EXTRACT the merchant/business name from the transaction description

AVAILABLE DEDUCTION CATEGORIES:
${categoriesList.map((cat, i) => `${i + 1}. ${cat}`).join("\n")}

TRANSACTIONS:
${transactionList}

MERCHANT EXTRACTION RULES:
- Extract the actual business/merchant name, NOT generic words like "debit", "card", "purchase"
- Examples:
  * "Debit Card Purchase Goget Sydney Aus" → merchant: "goget"
  * "Uber *trip Sydney" → merchant: "uber"  
  * "EFTPOS Woolworths Metro" → merchant: "woolworths"
  * "Direct Debit Netflix" → merchant: "netflix"
  * "Transfer to Commonwealth Bank" → merchant: "commonwealth bank"
- If no clear merchant found, use "unknown"
- Keep merchant names lowercase and clean (no special characters - remove  "pty ltd" or "ltd" - just want the merchant name)

Return JSON array with BOTH classification AND merchant extraction:
[{"id": "transaction_id", "status": "deductible|non-deductible", "atoCategory": "exact category name from list", "confidence": 0-100, "reasoning": "brief reason", "merchantName": "extracted_merchant_name"}]`

    console.log("🤖 AI processing", batch.length, "transactions with MERCHANT EXTRACTION")

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // FASTER than GPT-4
      messages: [
        {
          role: "system",
          content:
            "You are an Australian tax advisor AND merchant extraction expert. Extract clear merchant names from transaction descriptions. Respond only with valid JSON arrays.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // Higher temperature for more creative/generous classifications
      max_tokens: Math.min(3000, batch.length * 150), // More tokens for merchant extraction
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error("No response from OpenAI")
    }

    console.log("🤖 AI response with MERCHANT EXTRACTION received")

    // Parse JSON response
    let aiResults: any[]
    try {
      const cleanedResponse = response.replace(/\`\`\`json\n?|\n?\`\`\`/g, "").trim()
      aiResults = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("Failed to parse AI response:", response)
      // Fallback: be EXTREMELY generous and mark ALL as deductible with basic merchant extraction
      aiResults = batch.map((t: TransactionToClassify) => ({
        id: t.id,
        status: "deductible", // GENEROUS fallback
        atoCategory: "Work Tools, Equipment & Technology", // Default category
        confidence: 70,
        reasoning: "AI parsing failed, marked as deductible by default",
        merchantName: extractBasicMerchant(t.description), // Fallback merchant extraction
      }))
    }

    // Validate results and ensure they use the exact category names
    const validatedResults = aiResults.map((result) => {
      // Default to deductible
      if (!["deductible", "non-deductible"].includes(result.status)) {
        result.status = "deductible" // GENEROUS default
      }

      // Ensure confidence is within bounds
      result.confidence = Math.min(Math.max(result.confidence || 70, 50), 100)

      // Ensure category is one of the valid categories
      if (result.status === "deductible" && (!result.atoCategory || !categoriesList.includes(result.atoCategory))) {
        // Find the closest matching category
        const lowerCaseCategory = (result.atoCategory || "").toLowerCase()
        let matchedCategory = "Work Tools, Equipment & Technology" // Default

        for (const category of categoriesList) {
          if (
            category.toLowerCase().includes(lowerCaseCategory) ||
            lowerCaseCategory.includes(category.toLowerCase().split(",")[0].trim())
          ) {
            matchedCategory = category
            break
          }
        }

        result.atoCategory = matchedCategory
      }

      // Ensure merchant name is clean and valid
      if (!result.merchantName || typeof result.merchantName !== "string") {
        result.merchantName = extractBasicMerchant(
          batch.find((t) => t.id === result.id)?.description || ""
        )
      } else {
        // Clean up the merchant name
        result.merchantName = result.merchantName
          .toLowerCase()
          .replace(/[^\w\s&\-'.]/g, "")
          .replace(/\s+/g, " ")
          .trim()
      }

      return result
    })

    console.log("✅ AI classification with MERCHANT EXTRACTION complete:", {
      total: validatedResults.length,
      deductible: validatedResults.filter((r) => r.status === "deductible").length,
      avgConfidence: validatedResults.reduce((sum, r) => sum + r.confidence, 0) / validatedResults.length,
      merchantsExtracted: validatedResults.filter((r) => r.merchantName && r.merchantName !== "unknown").length,
      sampleMerchants: validatedResults.slice(0, 3).map((r) => ({
        description: batch.find((t) => t.id === r.id)?.description?.substring(0, 50),
        merchant: r.merchantName,
        deductible: r.status,
        atoCategory: r.atoCategory

      })),
    })

    return NextResponse.json({
      success: true,
      results: validatedResults,
    })
  } catch (error) {
    console.error("❌ ULTRA-GENEROUS AI classification with MERCHANT EXTRACTION error:", error)

    // Get the transactions from the request
    let transactions: TransactionToClassify[] = []
    try {
      const body = await request.json()
      transactions = body.transactions || []
    } catch (e) {
      console.error("Failed to parse request body:", e)
    }

    // EXTREMELY GENEROUS fallback: mark ALL as deductible with basic merchant extraction
    const fallbackResults = transactions.map((t: TransactionToClassify) => ({
      id: t.id,
      status: "deductible", // GENEROUS fallback
      atoCategory: "Work Tools, Equipment & Technology", // Default category
      confidence: 60,
      reasoning: "AI failed, marked as deductible by default",
      merchantName: extractBasicMerchant(t.description), // Fallback merchant extraction
    }))

    return NextResponse.json({
      success: true,
      results: fallbackResults,
    })
  }
}

// Fallback merchant extraction function
function extractBasicMerchant(description: string): string {
  if (!description) return "unknown"

  // Basic patterns for merchant extraction
  const patterns = [
    // "Debit Card Purchase MERCHANT Location..."
    /(?:debit card purchase|card purchase|purchase)\s+([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)(?:\s+(?:sydney|melbourne|brisbane|perth|adelaide|australia|aus|nsw|vic|qld|wa|sa|nt|act))/i,
    
    // "EFTPOS MERCHANT Location"
    /^eftpos\s+([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)(?:\s+(?:sydney|melbourne|brisbane|perth|adelaide|australia|aus|nsw|vic|qld|wa|sa|nt|act))/i,
    
    // "MERCHANT *trip" (for Uber)
    /([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)\s*\*(?:trip|ride|delivery)/i,
    
    // "Direct Debit MERCHANT"
    /(?:direct debit|dd)\s+([a-zA-Z][a-zA-Z0-9\s&\-'.]{2,}?)(?:\s|$)/i,
  ]

  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match && match[1]) {
      let merchant = match[1].trim()
      
      // Clean up the merchant name
      merchant = merchant
        .toLowerCase()
        .replace(/[^\w\s&\-'.]/g, "")
        .replace(/\s+/g, " ")
        .trim()

      // Skip common words
      const skipWords = new Set([
        "card", "debit", "credit", "purchase", "payment", "transaction", 
        "eftpos", "transfer", "australia", "sydney", "melbourne", "brisbane"
      ])

      if (!skipWords.has(merchant) && merchant.length >= 3) {
        return merchant
      }
    }
  }

  // Fallback: first meaningful word
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3)

  const skipWords = new Set([
    "the", "and", "for", "are", "but", "not", "card", "debit", "credit", 
    "purchase", "payment", "transaction", "eftpos", "transfer", "australia"
  ])

  const meaningfulWord = words.find((word) => !skipWords.has(word))
  return meaningfulWord || "unknown"
}
