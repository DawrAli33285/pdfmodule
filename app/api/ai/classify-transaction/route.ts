import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { description, enabledDeductions, amount } = await request.json()

    if (!description) {
      return NextResponse.json({ success: false, error: "Transaction description is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not configured, falling back to non-deductible")
      return NextResponse.json({
        success: true,
        classification: "AI non-deductible",
        confidence: 0,
        reasoning: "OpenAI API not configured",
      })
    }

    // Only classify expenses (negative amounts) as potential deductions
    const transactionAmount = Number.parseFloat(amount?.toString() || "0")
    if (transactionAmount >= 0) {
      return NextResponse.json({
        success: true,
        classification: "AI non-deductible",
        confidence: 100,
        reasoning: "Income transactions are not tax deductible",
      })
    }

    const enabledCategories = enabledDeductions || []
    const categoriesList =
      enabledCategories.length > 0 ? enabledCategories.join(", ") : "No specific categories enabled"

    const prompt = `You are an Australian tax expert AI. Analyze this transaction and determine if it could be a tax-deductible business expense.

Transaction Description: "${description}"
Transaction Amount: $${Math.abs(transactionAmount).toFixed(2)} (expense)

Enabled Deduction Categories: ${categoriesList}

Australian Tax Deduction Categories:
1. Vehicles, Travel & Transport - Car expenses, fuel, parking, public transport, flights, accommodation
2. Work Tools, Equipment & Technology - Computers, software, tools, machinery, subscriptions
3. Work Clothing & Uniforms - Uniforms, protective clothing, safety equipment
4. Home Office Expenses - Utilities, internet, phone, office supplies, rent portion
5. Education & Training - Courses, conferences, books, professional development
6. Professional Memberships & Fees - Association fees, licenses, certifications
7. Meals & Entertainment (Work-Related) - Client meals, business entertainment, work functions
8. Personal Grooming & Wellbeing - Haircuts, gym memberships (if work-related)
9. Gifts & Donations - Corporate gifts, charitable donations, sponsorships
10. Investments, Insurance & Superannuation - Investment fees, insurance premiums, super contributions
11. Tax & Accounting Expenses - Accountant fees, tax preparation, bookkeeping

Rules:
- Only expenses (negative amounts) can be deductible
- Must be directly related to earning income or business activities
- Personal expenses are generally not deductible
- Consider Australian Tax Office (ATO) guidelines

Respond with EXACTLY one of these classifications:
- "AI possible deduction" - if this could reasonably be a tax-deductible business expense
- "AI non-deductible" - if this is clearly a personal expense or not deductible

Also provide:
- confidence: number from 0-100
- reasoning: brief explanation (max 50 words)
- category: which deduction category it fits (if deductible)

Format your response as JSON:
{
  "classification": "AI possible deduction" or "AI non-deductible",
  "confidence": number,
  "reasoning": "brief explanation",
  "category": "category name if deductible, null if not"
}`

    console.log("🤖 Sending transaction to OpenAI for classification:", {
      description: description.substring(0, 50),
      amount: transactionAmount,
      enabledCategories: enabledCategories.length,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the faster, cheaper model for classification
      messages: [
        {
          role: "system",
          content:
            "You are an expert Australian tax advisor AI. Analyze transactions for tax deductibility with high accuracy.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 200,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error("No response from OpenAI")
    }

    console.log("🤖 OpenAI raw response:", response)

    // Parse the JSON response
    let aiResult
    try {
      aiResult = JSON.parse(response)
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", response)
      // Fallback parsing for non-JSON responses
      const isDeductible = response.toLowerCase().includes("possible deduction")
      aiResult = {
        classification: isDeductible ? "AI possible deduction" : "AI non-deductible",
        confidence: 50,
        reasoning: "AI response parsing fallback",
        category: null,
      }
    }

    // Validate the classification
    if (!["AI possible deduction", "AI non-deductible"].includes(aiResult.classification)) {
      console.warn("Invalid classification from AI:", aiResult.classification)
      aiResult.classification = "AI non-deductible"
      aiResult.confidence = 0
      aiResult.reasoning = "Invalid AI response format"
    }

    console.log("✅ AI Classification result:", {
      description: description.substring(0, 30),
      classification: aiResult.classification,
      confidence: aiResult.confidence,
      category: aiResult.category,
    })

    return NextResponse.json({
      success: true,
      ...aiResult,
    })
  } catch (error) {
    console.error("❌ OpenAI classification error:", error)

    // Fallback to non-deductible on error
    return NextResponse.json({
      success: true,
      classification: "AI non-deductible",
      confidence: 0,
      reasoning: "AI classification failed",
      category: null,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
