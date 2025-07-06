import { NextResponse } from "next/server"

export async function POST(req: Request) {
  console.log("🚀 PDF Parser API: POST request received at", new Date().toISOString())

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const bank = formData.get("bank") as string

    console.log("📋 Processing file:", file?.name, "for bank:", bank)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!bank) {
      return NextResponse.json({ error: "No bank specified" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    console.log(`🔄 Processing ${bank} PDF: ${file.name}`)

    // Read PDF and extract text using pdf-parse
    const dataBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(dataBuffer)
    console.log(`📦 Read ${buffer.length} bytes from PDF`)

    // Safety check - ensure we're only working with the uploaded buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("Invalid PDF file - no data received")
    }

    // Verify it's actually a PDF by checking magic bytes
    const pdfHeader = buffer.slice(0, 4).toString()
    if (!pdfHeader.startsWith("%PDF")) {
      throw new Error("Invalid PDF file - not a valid PDF format")
    }

    // Import pdf-parse with explicit options to prevent test file access
    let pdfData
    try {
      const pdfParse = (await import("pdf-parse")).default

      // Explicitly pass only the buffer with strict options
      pdfData = await pdfParse(buffer, {
        // Disable any file system access
        max: 0, // Parse all pages
        version: "v1.10.100", // Specify version to avoid auto-detection
        // Ensure no external file references
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      })
    } catch (parseError) {
      console.error("PDF Parse Error:", parseError)
      throw new Error("Failed to parse PDF file. Please ensure it's a valid PDF.")
    }

    const fullText = pdfData.text
    console.log(`📊 Extracted ${fullText.length} characters from ${pdfData.numpages} pages`)

    // Parse transactions based on bank
    let transactions: any[] = []
    let accountInfo = {}

    switch (bank.toLowerCase()) {
      case "amex":
        console.log("🏦 Using AMEX parser")
        ;({ transactions, accountInfo } = parseAmex(fullText))
        break
      case "anz":
        console.log("🏦 Using ANZ parser")
        ;({ transactions, accountInfo } = parseAnz(fullText))
        break
      case "cba":
        console.log("🏦 Using CBA parser")
        ;({ transactions, accountInfo } = parseCba(fullText))
        break
      case "westpac":
        console.log("🏦 Using WESTPAC parser")
        ;({ transactions, accountInfo } = parseWestpac(fullText))
        break
      default:
        console.log("❌ No parser for bank:", bank)
        return NextResponse.json({ error: `No parser available for bank: ${bank}` }, { status: 400 })
    }

    console.log(`✅ Parsed ${transactions.length} transactions`)

    const responseData = {
      success: true,
      bank: bank.toUpperCase(),
      pageCount: pdfData.numpages,
      transactionCount: transactions.length,
      accountInfo,
      transactions,
      rawTextPreview: fullText.substring(0, 1000) + (fullText.length > 1000 ? "..." : ""),
      metadata: {
        processingDate: new Date().toISOString(),
        fileName: file.name,
        textLength: fullText.length,
        fileSize: file.size,
      },
    }

    console.log("🎉 Sending successful response")
    return NextResponse.json(responseData, { status: 200 })
  } catch (err) {
    console.error("💥 PDF extraction error:", err)
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message,
        stack: process.env.NODE_ENV === "development" ? (err as Error).stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Test GET method to verify route is working
export async function GET() {
  console.log("🔍 PDF Parser API: GET request received at", new Date().toISOString())

  const response = {
    message: "PDF Parser API is working",
    timestamp: new Date().toISOString(),
    methods: ["GET", "POST"],
    status: "ready",
    supportedBanks: ["amex", "anz", "cba", "westpac"],
    usage: {
      endpoint: "/api/process-pdf",
      method: "POST",
      contentType: "multipart/form-data",
      fields: {
        file: "PDF file",
        bank: "amex|anz|cba|westpac",
      },
    },
  }

  console.log("📊 GET response:", response)
  return NextResponse.json(response, { status: 200 })
}

// --- Amex parser ---
function parseAmex(text: string): { transactions: any[]; accountInfo: any } {
  console.log("🔍 AMEX Parser: Starting...")
  const transactions: any[] = []
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  console.log(`📄 AMEX Parser: Processing ${lines.length} lines`)

  const monthRegex = "(January|February|March|April|May|June|July|August|September|October|November|December)"
  const dateLinePattern = new RegExp(`^${monthRegex}\\s+(\\d{1,2})$`)

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

  let i = 0
  let transactionCount = 0

  while (i < lines.length) {
    const line = lines[i]
    const mDate = dateLinePattern.exec(line)

    if (mDate) {
      console.log(`📅 AMEX Parser: Found date line: "${line}"`)
      const monthName = mDate[1]
      const day = mDate[2].padStart(2, "0")
      const dateStr = `2025-${monthMap[monthName]}-${day}`

      i++
      if (i >= lines.length) break
      const descriptionLine = lines[i]
      console.log(`📝 AMEX Parser: Description: "${descriptionLine}"`)

      let amount = 0
      const description = descriptionLine

      // Look ahead up to 3 lines for amount
      const lookaheadLines = Math.min(3, lines.length - i - 1)
      for (let j = 1; j <= lookaheadLines; j++) {
        const nextLine = lines[i + j]
        const amountMatch = nextLine.match(/^(-?\d+\.\d{2})$/)
        if (amountMatch) {
          amount = Math.abs(Number.parseFloat(amountMatch[1]))
          console.log(`💰 AMEX Parser: Found amount: ${amountMatch[1]} -> ${amount}`)
          i += j
          break
        }
      }

      if (amount > 0) {
        transactionCount++
        console.log(`✅ AMEX Parser: Adding transaction ${transactionCount}`)
        transactions.push({
          id: `amex-${Date.now()}-${transactionCount}`,
          date: dateStr,
          description,
          amount,
          type: "debit",
        })
      }
    }
    i++
  }

  console.log(`✅ AMEX Parser: Completed. Found ${transactions.length} transactions`)
  return { transactions, accountInfo: {} }
}

// --- ANZ parser ---
function parseAnz(text: string): { transactions: any[]; accountInfo: any } {
  console.log("🔍 ANZ Parser: Starting...")
  const transactions: any[] = []
  const accountInfo = {}

  const pattern = new RegExp(
    [
      "(",
      "(\\d{2}/\\d{2}/\\d{4})\\s+",
      "(\\d{2}/\\d{2}/\\d{4})\\s+",
      "(\\d{4})\\s+",
      "(.*?)\\s+",
      "\\$?([\\d,]+\\.\\d{2})\\s*",
      "(CR)?\\s+",
      "\\$?([\\d,]+\\.\\d{2})",
      ")",
    ].join(""),
    "g",
  )

  console.log("🔍 ANZ Parser: Using regex pattern to find transactions...")
  let match
  let matchCount = 0

  while ((match = pattern.exec(text)) !== null) {
    matchCount++
    console.log(`📋 ANZ Parser: Match ${matchCount} found`)

    const rawDate = match[2]
    const [day, month, year] = rawDate.split("/")
    const dateIso = `${year}-${month}-${day}`

    const amountStr = match[6].replace(/,/g, "")
    const amount = Number.parseFloat(amountStr)

    const creditLabel = match[7]
    const description = match[5].trim()

    const signedAmount = creditLabel ? -amount : amount

    transactions.push({
      id: `anz-${Date.now()}-${matchCount}`,
      date: dateIso,
      description,
      amount: signedAmount,
    })
  }

  console.log(`✅ ANZ Parser: Completed. Found ${transactions.length} transactions`)
  return { transactions, accountInfo }
}

// --- CBA parser ---
function parseCba(text: string): { transactions: any[]; accountInfo: any } {
  console.log("🔍 CBA Parser: Starting...")
  const transactions: any[] = []
  const accountInfo = {}

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  console.log(`📄 CBA Parser: Processing ${lines.length} lines`)

  for (const line of lines) {
    let date = ""
    let description = ""
    let amount = 0

    if (line.includes("OPENING BALANCE") || line.includes("CLOSING BALANCE")) {
      console.log(`📋 CBA Parser: Found balance line: "${line}"`)

      const dateMatch = line.match(/^(\d{1,2})\s+([A-Za-z]+)\s*(\d{4})?/)
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, "0")
        const monthStr = dateMatch[2]
        const year = dateMatch[3] || "2022"

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
        const month = monthMap[monthStr] || "01"
        date = `${year}-${month}-${day}`
      }
      description = line.includes("OPENING") ? "OPENING BALANCE" : "CLOSING BALANCE"
      amount = 0

      console.log(`✅ CBA Parser: Adding balance transaction`)
      transactions.push({
        id: `cba-${Date.now()}-${Math.random()}`,
        date,
        description,
        amount,
      })
    }
  }

  console.log(`✅ CBA Parser: Completed. Found ${transactions.length} transactions`)
  return { transactions, accountInfo }
}

// --- Westpac parser ---
function parseWestpac(text: string): { transactions: any[]; accountInfo: any } {
  console.log("🔍 Westpac Parser: Starting...")
  const transactions: any[] = []
  const accountInfo = {}

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  console.log(`📄 Westpac Parser: Processing ${lines.length} lines`)

  const dateRegex = /^(\d{2}\/\d{2}\/\d{2,4})/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const dateMatch = line.match(dateRegex)

    if (dateMatch) {
      const rawDate = dateMatch[1]

      let description = line.substring(rawDate.length).trim()

      // Collect multiline description
      let nextIndex = i + 1
      while (nextIndex < lines.length && !dateRegex.test(lines[nextIndex])) {
        description += " " + lines[nextIndex]
        nextIndex++
      }
      i = nextIndex - 1

      const descLower = description.toLowerCase()

      const amountMatches = description.match(/[\d,]+\.\d{2}/g)

      if (!amountMatches || amountMatches.length < 2) {
        continue
      }

      const parsedNumbers = amountMatches.map((s) => Number.parseFloat(s.replace(/,/g, "")))

      const transactionAmount = parsedNumbers[0]

      let type: "debit" | "credit" = "debit"

      if (
        descLower.includes("deposit") ||
        descLower.includes("salary") ||
        descLower.includes("transfer") ||
        descLower.includes("refund")
      ) {
        type = "credit"
      }

      const date = normalizeDate(rawDate)

      // Make debit negative
      let signedAmount = transactionAmount
      if (type === "debit") {
        signedAmount = -Math.abs(transactionAmount)
      } else {
        signedAmount = Math.abs(transactionAmount)
      }

      transactions.push({
        id: `westpac-${Date.now()}-${i}`,
        date,
        description: cleanDescription(description),
        amount: signedAmount,
        type,
      })
    }
  }

  console.log(`✅ Westpac Parser: Completed. Found ${transactions.length} transactions`)
  return { transactions, accountInfo }
}

// Utility functions
function normalizeDate(dateStr: string): string {
  try {
    const parts = dateStr.split("/")
    let year = parts[2]
    if (year.length === 2) {
      year = "20" + year
    }
    const month = parts[1].padStart(2, "0")
    const day = parts[0].padStart(2, "0")
    return `${year}-${month}-${day}`
  } catch {
    return dateStr
  }
}

function cleanDescription(text: string): string {
  return text
    .replace(/[\d,]+\.\d{2}/g, "")
    .replace(/\b\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
