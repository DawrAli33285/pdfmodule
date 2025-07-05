import { type NextRequest, NextResponse } from "next/server"
import pdfParse from "pdf-parse"
import { v4 as uuidv4 } from "uuid"
import { merchantModel } from "@/lib/models/merchant"
import { anzsicMappingModel } from "@/lib/models/anzsic-mapping"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type?: "debit" | "credit"
  balance?: number
  category?: string
  merchantName?: string
  anzsicCode?: string
  atoCategory?: string
  isDeductible?: boolean
  account?: string
  accountId?: string
  accountNumber?: string
  source?: string
  deductionType?: string
  isBusinessExpense?: boolean
  deductionAmount?: number
  autoClassified?: boolean
  classificationSource?: string
  potentialDeduction?: boolean
  enriched?: boolean
}

// OPTIMIZED: Pre-built merchant patterns for instant recognition
const MERCHANT_PATTERNS = [
  // Fuel & Transport (Deductible)
  {
    keywords: ["shell", "bp", "caltex", "7-eleven", "mobil", "ampol", "united petroleum", "puma energy"],
    merchantName: "Fuel Station",
    anzsicCode: "4613",
    atoCategory: "Vehicles, Travel & Transport",
    isDeductible: true,
    confidence: 90,
  },
  {
    keywords: ["uber", "taxi", "cabcharge", "rideshare", "transport"],
    merchantName: "Transport Service",
    anzsicCode: "4622",
    atoCategory: "Vehicles, Travel & Transport",
    isDeductible: true,
    confidence: 85,
  },

  // Work Equipment & Tools (Deductible)
  {
    keywords: ["bunnings", "masters", "mitre 10", "mitre10", "home depot", "hardware"],
    merchantName: "Hardware Store",
    anzsicCode: "4231",
    atoCategory: "Work Tools, Equipment & Technology",
    isDeductible: true,
    confidence: 85,
  },
  {
    keywords: ["jb hi-fi", "jb hifi", "jbhifi", "harvey norman", "officeworks", "dick smith", "electronics"],
    merchantName: "Electronics Store",
    anzsicCode: "4252",
    atoCategory: "Work Tools, Equipment & Technology",
    isDeductible: true,
    confidence: 80,
  },

  // Professional Services (Deductible)
  {
    keywords: ["accountant", "lawyer", "solicitor", "consultant", "professional"],
    merchantName: "Professional Services",
    anzsicCode: "6920",
    atoCategory: "Professional Memberships & Fees",
    isDeductible: true,
    confidence: 90,
  },

  // Telecommunications (Deductible)
  {
    keywords: ["telstra", "optus", "vodafone", "tpg", "iinet", "mobile", "internet"],
    merchantName: "Telecommunications",
    anzsicCode: "5910",
    atoCategory: "Home Office Expenses",
    isDeductible: true,
    confidence: 85,
  },

  // Banking & Fees (Deductible)
  {
    keywords: ["atm fee", "bank fee", "account fee", "transaction fee", "overdraft"],
    merchantName: "Banking Fees",
    anzsicCode: "6221",
    atoCategory: "Tax & Accounting Expenses",
    isDeductible: true,
    confidence: 95,
  },

  // Work Meals (Deductible)
  {
    keywords: [
      "mcdonalds",
      "mcdonald",
      "maccas",
      "kfc",
      "subway",
      "dominos",
      "pizza hut",
      "hungry jacks",
      "red rooster",
    ],
    merchantName: "Fast Food",
    anzsicCode: "5611",
    atoCategory: "Meals & Entertainment (Work-Related)",
    isDeductible: true,
    confidence: 75,
  },
  {
    keywords: ["starbucks", "gloria jeans", "coffee club", "cafe", "coffee"],
    merchantName: "Coffee Shop",
    anzsicCode: "5613",
    atoCategory: "Meals & Entertainment (Work-Related)",
    isDeductible: true,
    confidence: 70,
  },

  // Non-Deductible (Personal)
  {
    keywords: ["woolworths", "woolies", "coles", "aldi", "iga", "supermarket", "grocery"],
    merchantName: "Supermarket",
    anzsicCode: "4110",
    atoCategory: "Personal Expenses",
    isDeductible: false,
    confidence: 90,
  },
  {
    keywords: ["target", "kmart", "big w", "bigw", "myer", "david jones", "clothing", "fashion"],
    merchantName: "Retail Store",
    anzsicCode: "4251",
    atoCategory: "Personal Expenses",
    isDeductible: false,
    confidence: 85,
  },
]

// OPTIMIZED: Fast pattern matching using pre-compiled regex
class OptimizedMerchantMatcher {
  private patterns: Array<{
    regex: RegExp
    data: (typeof MERCHANT_PATTERNS)[0]
  }> = []

  constructor() {
    // Pre-compile all regex patterns for maximum speed
    this.patterns = MERCHANT_PATTERNS.map((pattern) => ({
      regex: new RegExp(pattern.keywords.join("|"), "i"),
      data: pattern,
    }))
  }

  match(description: string): (typeof MERCHANT_PATTERNS)[0] | null {
    const cleanDesc = description.toLowerCase()

    // Try exact pattern matches first (fastest)
    for (const pattern of this.patterns) {
      if (pattern.regex.test(cleanDesc)) {
        return pattern.data
      }
    }

    return null
  }
}

// OPTIMIZED: Bulk database operations
class OptimizedDatabaseService {
  private merchantCache = new Map<string, any>()
  private anzsicCache = new Map<string, any>()

  async preloadCaches() {
    console.log("🚀 Preloading database caches...")

    // Load all merchants into memory for fast lookup
    const merchants = await merchantModel.getAll()
    merchants.forEach((merchant) => {
      this.merchantCache.set(merchant.merchantName.toLowerCase(), merchant)
      // Also cache by keywords and aliases
      merchant.keywords?.forEach((keyword: string) => {
        this.merchantCache.set(keyword.toLowerCase(), merchant)
      })
      merchant.aliases?.forEach((alias: string) => {
        this.merchantCache.set(alias.toLowerCase(), merchant)
      })
    })

    // Load all ANZSIC mappings
    const anzsicMappings = await anzsicMappingModel.getAll()
    anzsicMappings.forEach((mapping) => {
      this.anzsicCache.set(mapping.anzsicCode, mapping)
    })

    console.log(`✅ Cached ${merchants.length} merchants and ${anzsicMappings.length} ANZSIC mappings`)
  }

  findMerchant(searchTerm: string): any | null {
    return this.merchantCache.get(searchTerm.toLowerCase()) || null
  }

  findAnzsicMapping(code: string): any | null {
    return this.anzsicCache.get(code) || null
  }

  async bulkSaveMerchants(merchants: Array<{ merchantName: string; anzsicCode: string }>): Promise<number> {
    let saved = 0
    const batch = []

    for (const merchant of merchants) {
      if (!this.merchantCache.has(merchant.merchantName.toLowerCase()) && merchant.merchantName !== "Unknown") {
        batch.push({
          merchantName: merchant.merchantName.toLowerCase(),
          displayName: merchant.merchantName,
          anzsicCode: merchant.anzsicCode,
          keywords: [merchant.merchantName.toLowerCase()],
          aliases: [],
          source: "ai" as const,
          confidence: 70,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    if (batch.length > 0) {
      try {
        await merchantModel.bulkCreate(batch)
        saved = batch.length

        // Update cache
        batch.forEach((merchant) => {
          this.merchantCache.set(merchant.merchantName, merchant)
        })

        console.log(`💾 Bulk saved ${saved} new merchants`)
      } catch (error) {
        console.error("❌ Bulk save failed:", error)
      }
    }

    return saved
  }
}

// OPTIMIZED: Smart merchant extraction without AI
function extractMerchantSmart(description: string): {
  merchantName: string
  anzsicCode: string
  anzsicDescription: string
  atoCategory: string
  isDeductible: boolean
  confidence: number
  source: string
} {
  const cleanDesc = description.toLowerCase()

  // Remove common banking terms to get cleaner merchant name
  const cleanedForExtraction = cleanDesc
    .replace(
      /\b(payment|purchase|withdrawal|deposit|transfer|fee|charge|atm|pos|eft|bpay|direct|debit|credit|card|visa|mastercard|amex)\b/g,
      "",
    )
    .replace(/\d+/g, "") // Remove numbers
    .replace(/[^\w\s]/g, " ") // Remove special chars
    .replace(/\s+/g, " ")
    .trim()

  // Extract the most likely merchant name (first meaningful word)
  const words = cleanedForExtraction.split(" ").filter((word) => word.length >= 3)
  const merchantName = words.length > 0 ? words[0] : "Unknown"

  // Smart categorization based on common patterns
  if (/\b(fuel|petrol|gas|station|shell|bp|caltex|mobil|ampol)\b/.test(cleanDesc)) {
    return {
      merchantName: merchantName,
      anzsicCode: "4613",
      anzsicDescription: "Motor Vehicle Fuel Retailing",
      atoCategory: "Vehicles, Travel & Transport",
      isDeductible: true,
      confidence: 80,
      source: "smart-extraction",
    }
  }

  if (/\b(food|restaurant|cafe|meal|lunch|dinner|mcdonalds|kfc|subway|starbucks)\b/.test(cleanDesc)) {
    return {
      merchantName: merchantName,
      anzsicCode: "5611",
      anzsicDescription: "Takeaway Food Services",
      atoCategory: "Meals & Entertainment (Work-Related)",
      isDeductible: true,
      confidence: 70,
      source: "smart-extraction",
    }
  }

  if (/\b(hardware|tools|equipment|supplies|bunnings|mitre)\b/.test(cleanDesc)) {
    return {
      merchantName: merchantName,
      anzsicCode: "4231",
      anzsicDescription: "Hardware and Building Supplies Retailing",
      atoCategory: "Work Tools, Equipment & Technology",
      isDeductible: true,
      confidence: 75,
      source: "smart-extraction",
    }
  }

  if (/\b(phone|mobile|internet|telco|telecommunications|telstra|optus|vodafone)\b/.test(cleanDesc)) {
    return {
      merchantName: merchantName,
      anzsicCode: "5910",
      anzsicDescription: "Telecommunications Services",
      atoCategory: "Home Office Expenses",
      isDeductible: true,
      confidence: 85,
      source: "smart-extraction",
    }
  }

  if (/\b(atm|bank|fee|account|service)\b/.test(cleanDesc)) {
    return {
      merchantName: merchantName,
      anzsicCode: "6221",
      anzsicDescription: "Banking Services",
      atoCategory: "Tax & Accounting Expenses",
      isDeductible: true,
      confidence: 90,
      source: "smart-extraction",
    }
  }

  // Default to non-deductible for unknown
  return {
    merchantName: merchantName,
    anzsicCode: "9999",
    anzsicDescription: "Other Services",
    atoCategory: "Personal Expenses",
    isDeductible: false,
    confidence: 30,
    source: "fallback",
  }
}

// OPTIMIZED: Streamlined parsers with better performance
function parseCBA(text: string): Transaction[] {
  const transactions: Transaction[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim())

  // Optimized regex for CBA format
  const transactionRegex = /^(\d{1,2})\s+([A-Za-z]+)\s*(\d{4})?\s+(.+?)\s+(-?\d+\.\d{2})$/

  for (const line of lines) {
    const match = transactionRegex.exec(line.trim())
    if (match) {
      const [, day, monthStr, year = "2024", description, amountStr] = match
      const amount = Number.parseFloat(amountStr)

      if (amount < 0) {
        // Only process expenses
        const monthMap: Record<string, string> = {
          Jan: "01",
          Feb: "02",
          Mar: "03",
          Apr: "04",
          May: "05",
          Jun: "06",
          Jul: "07",
          Aug: "08",
          Sep: "09",
          Oct: "10",
          Nov: "11",
          Dec: "12",
        }
        const month = monthMap[monthStr.substring(0, 3)] || "01"
        const date = `${year}-${month}-${day.padStart(2, "0")}`

        transactions.push({
          id: uuidv4(),
          date,
          description: description.trim(),
          amount,
        })
      }
    }
  }

  return transactions
}

function parseAmex(text: string): Transaction[] {
  const transactions: Transaction[] = []
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  // Optimized Amex parsing
  const monthMap: Record<string, string> = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  }

  for (let i = 0; i < lines.length - 2; i++) {
    const dateMatch = lines[i].match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})$/,
    )

    if (dateMatch) {
      const [, monthName, day] = dateMatch
      const description = lines[i + 1]
      const amountMatch = lines[i + 2]?.match(/^(\d+\.\d{2})$/)

      if (amountMatch) {
        const amount = -Number.parseFloat(amountMatch[1]) // Amex amounts are positive but represent expenses
        const date = `2024-${monthMap[monthName]}-${day.padStart(2, "0")}`

        transactions.push({
          id: uuidv4(),
          date,
          description,
          amount,
        })

        i += 2 // Skip processed lines
      }
    }
  }

  return transactions
}

function parseWestpac(text: string): Transaction[] {
  const transactions: Transaction[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim())

  // Optimized Westpac regex
  const transactionRegex =
    /^(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s+(\d{1,3}(?:,\d{3})*\.\d{2})$/

  for (const line of lines) {
    const match = transactionRegex.exec(line.trim())
    if (match) {
      const [, rawDate, description, amountStr, balanceStr] = match
      const amount = Number.parseFloat(amountStr.replace(/,/g, ""))

      // Convert date format
      const [day, month, year] = rawDate.split("/")
      const fullYear = year.length === 2 ? (Number.parseInt(year) > 50 ? "19" + year : "20" + year) : year
      const date = `${fullYear}-${month}-${day}`

      // Only process expenses (negative amounts)
      if (amount > 0 && description.toLowerCase().includes("payment")) {
        transactions.push({
          id: uuidv4(),
          date,
          description: description.trim(),
          amount: -amount,
          balance: Number.parseFloat(balanceStr.replace(/,/g, "")),
        })
      }
    }
  }

  return transactions
}

function parseANZ(text: string): Transaction[] {
  const transactions: Transaction[] = []

  // Optimized ANZ regex
  const transactionRegex =
    /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{4})\s+(.+?)\s+\$?([\d,]+\.\d{2})\s*(CR)?\s+\$?([\d,]+\.\d{2})/g

  let match
  while ((match = transactionRegex.exec(text)) !== null) {
    const [, , processDate, , description, amountStr, creditFlag] = match
    const amount = Number.parseFloat(amountStr.replace(/,/g, ""))

    // Convert date
    const [day, month, year] = processDate.split("/")
    const date = `${year}-${month}-${day}`

    // Only process debits (expenses)
    if (!creditFlag) {
      transactions.push({
        id: uuidv4(),
        date,
        description: description.trim(),
        amount: -amount,
      })
    }
  }

  return transactions
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check if the request has the correct content type
    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const bankType = formData.get("bankType") as string

    if (!file || !bankType) {
      return NextResponse.json({ error: "Missing file or bank type" }, { status: 400 })
    }

    console.log(`🚀 OPTIMIZED processing ${bankType} PDF: ${file.name}`)

    // Parse PDF - fix Buffer deprecation warning
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes) // This is the correct way, not Buffer()
    const data = await pdfParse(buffer)
    const text = data.text

    // Route to optimized parser
    let transactions: Transaction[] = []
    switch (bankType.toLowerCase()) {
      case "westpac":
        transactions = parseWestpac(text)
        break
      case "anz":
        transactions = parseANZ(text)
        break
      case "amex":
        transactions = parseAmex(text)
        break
      case "cba":
        transactions = parseCBA(text)
        break
      default:
        return NextResponse.json({ error: `Unsupported bank type: ${bankType}` }, { status: 400 })
    }

    console.log(`📊 Extracted ${transactions.length} transactions in ${Date.now() - startTime}ms`)

    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        transactions: [],
        stats: { total: 0, deductible: 0, totalDeductions: 0, newMerchants: 0 },
        message: "No transactions found in PDF",
      })
    }

    // Initialize optimized services
    const dbService = new OptimizedDatabaseService()
    const patternMatcher = new OptimizedMerchantMatcher()

    // Preload database caches for maximum speed
    await dbService.preloadCaches()

    const processedTransactions: Transaction[] = []
    const newMerchantsToSave: Array<{ merchantName: string; anzsicCode: string }> = []

    let dbHits = 0
    let patternHits = 0
    let smartExtractions = 0
    let deductibleCount = 0
    let totalDeductions = 0

    console.log("🔍 Starting transaction processing...")

    // OPTIMIZED: Single-pass processing
    for (const transaction of transactions) {
      let merchantData: any = null
      let classificationSource = "fallback"

      // STEP 1: Try database lookup (fastest)
      const keywords = transaction.description
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= 3)

      for (const keyword of keywords) {
        merchantData = dbService.findMerchant(keyword)
        if (merchantData) {
          dbHits++
          classificationSource = "database"
          console.log(`✅ DB Match: "${merchantData.displayName}" for "${transaction.description.substring(0, 30)}..."`)
          break
        }
      }

      // STEP 2: Try pattern matching (fast)
      if (!merchantData) {
        const patternMatch = patternMatcher.match(transaction.description)
        if (patternMatch) {
          merchantData = patternMatch
          patternHits++
          classificationSource = "pattern"
          console.log(
            `🎯 Pattern Match: "${patternMatch.merchantName}" for "${transaction.description.substring(0, 30)}..."`,
          )
        }
      }

      // STEP 3: Smart extraction (fallback)
      if (!merchantData) {
        merchantData = extractMerchantSmart(transaction.description)
        smartExtractions++
        classificationSource = "smart-extraction"
        console.log(
          `🧠 Smart Extract: "${merchantData.merchantName}" for "${transaction.description.substring(0, 30)}..."`,
        )

        // Queue for database save
        if (merchantData.merchantName !== "Unknown") {
          newMerchantsToSave.push({
            merchantName: merchantData.merchantName,
            anzsicCode: merchantData.anzsicCode,
          })
        }
      }

      // Get ANZSIC mapping for database merchants
      if (classificationSource === "database" && merchantData.anzsicCode) {
        const anzsicMapping = dbService.findAnzsicMapping(merchantData.anzsicCode)
        if (anzsicMapping) {
          merchantData.isDeductible = anzsicMapping.isDeductible
          merchantData.atoCategory = anzsicMapping.atoCategory
          console.log(
            `📋 ANZSIC Mapping: ${merchantData.anzsicCode} -> ${merchantData.atoCategory} (deductible: ${merchantData.isDeductible})`,
          )
        }
      }

      // Calculate deduction
      const isDeductible = merchantData.isDeductible || false
      const deductionAmount = isDeductible && transaction.amount < 0 ? Math.abs(transaction.amount) : 0

      if (isDeductible) {
        deductibleCount++
        totalDeductions += deductionAmount
        console.log(`💰 Deductible: $${deductionAmount.toFixed(2)} - ${transaction.description.substring(0, 50)}...`)
      }

      // Build processed transaction
      processedTransactions.push({
        ...transaction,
        account: `${bankType.toUpperCase()} Statement`,
        accountId: `pdf-${bankType.toLowerCase()}`,
        accountNumber: "****",
        type: transaction.amount < 0 ? "debit" : "credit",
        source: "pdf-upload",
        merchantName: merchantData.merchantName || "Unknown",
        anzsicCode: merchantData.anzsicCode,
        category: merchantData.atoCategory || "Other",
        deductionType: isDeductible ? merchantData.atoCategory : null,
        isBusinessExpense: isDeductible,
        deductionAmount,
        autoClassified: true,
        classificationSource,
        potentialDeduction: isDeductible,
        enriched: true,
        isDeductible: isDeductible,
        atoCategory: merchantData.atoCategory,
      })
    }

    // Bulk save new merchants
    const newMerchantsCreated = await dbService.bulkSaveMerchants(newMerchantsToSave)

    const processingTime = Date.now() - startTime

    console.log(`✅ OPTIMIZED processing complete in ${processingTime}ms:`)
    console.log(`- Total transactions: ${processedTransactions.length}`)
    console.log(`- Database hits: ${dbHits}`)
    console.log(`- Pattern matches: ${patternHits}`)
    console.log(`- Smart extractions: ${smartExtractions}`)
    console.log(`- Deductible transactions: ${deductibleCount}`)
    console.log(`- Total deductions: $${totalDeductions.toFixed(2)}`)
    console.log(`- New merchants created: ${newMerchantsCreated}`)

    return NextResponse.json({
      success: true,
      transactions: processedTransactions,
      stats: {
        total: processedTransactions.length,
        deductible: deductibleCount,
        totalDeductions,
        newMerchants: newMerchantsCreated,
        databaseHits: dbHits,
        patternHits: patternHits,
        smartExtractions: smartExtractions,
        processingTimeMs: processingTime,
        efficiency: `${(((dbHits + patternHits) / processedTransactions.length) * 100).toFixed(1)}% fast matches`,
      },
      message: `Processed ${processedTransactions.length} transactions in ${processingTime}ms, found ${deductibleCount} deductible transactions worth $${totalDeductions.toFixed(2)}`,
    })
  } catch (error) {
    console.error("❌ PDF processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
