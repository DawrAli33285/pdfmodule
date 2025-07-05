import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import pdfParse from "pdf-parse"
import { v4 as uuidv4 } from "uuid"
import moment from "moment"

const FOLDER = "/Users/yassineessabar/Downloads/bank statement"

export async function POST(req: NextRequest) {
  const { bank } = await req.json()
  const filename = `${bank}.pdf`
  const pdfPath = path.join(FOLDER, filename)

  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const buffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(buffer)
  const text = data.text

  let transactions: any[] = []

  if (bank === "westpac") transactions = await processWestpac(text)
  else if (bank === "cba") transactions = await processCBA(text)
  else if (bank === "anz") transactions = await processANZ(text)
  else if (bank === "amex") transactions = await processAmex(text)
  else return NextResponse.json({ error: "Unknown bank" }, { status: 400 })

  return NextResponse.json(transactions)
}

// --- WESTPAC ---
async function processWestpac(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
  const transactions = []
  const datePattern = /^(\d{2}\/\d{2}\/\d{2})\s+(.*)/

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(datePattern)
    if (m) {
      const dateISO = moment(m[1], "DD/MM/YY").format("YYYY-MM-DD")
      const descriptionParts = [m[2]]
      let amountsLine = ""

      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const amountsMatch = nextLine.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g)
        if (amountsMatch && amountsMatch.length >= 2) {
          amountsLine = nextLine
          i++
          break
        }
        descriptionParts.push(nextLine)
        i++
      }

      const fullDescription = descriptionParts.join(" ")
      const amounts = amountsLine.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g) || []
      let debit = ""
      let credit = ""

      if (amounts.length === 3) [debit, credit] = amounts
      else if (amounts.length === 2) {
        if (/Deposit|Refund/i.test(fullDescription)) credit = amounts[0]
        else debit = amounts[0]
      }

      let amount = 0
      if (debit) amount = -Number.parseFloat(debit.replace(/,/g, ""))
      if (credit) amount = Number.parseFloat(credit.replace(/,/g, ""))

      transactions.push({
        id: uuidv4(),
        date: dateISO,
        description: fullDescription,
        amount,
      })
    }
  }

  return transactions
}

// --- CBA ---
async function processCBA(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
  const transactions = []

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i]
    const nextLine = lines[i + 1]

    if (/OPENING BALANCE|CLOSING BALANCE/.test(line) && nextLine === "Nil") {
      const description = line.includes("OPENING") ? "OPENING BALANCE" : "CLOSING BALANCE"
      const dateStr = line.includes("OPENING") ? "22 Jan 2022" : line.split(" ").slice(0, 3).join(" ")

      const dateISO = moment(dateStr, "DD MMM YYYY").isValid()
        ? moment(dateStr, "DD MMM YYYY").format("YYYY-MM-DD")
        : ""

      transactions.push({
        id: uuidv4(),
        date: dateISO,
        description,
        amount: 0,
      })

      i++
    }
  }

  return transactions
}

// --- ANZ ---
async function processANZ(text: string) {
  const transactions = []
  const pattern = new RegExp(
    "(\\d{2}/\\d{2}/\\d{4})\\s+" +
      "(\\d{2}/\\d{2}/\\d{4})\\s+" +
      "(\\d{4})\\s+" +
      "(.*?)\\s+" +
      "\\$?([\\d,]+\\.\\d{2})\\s*(CR)?\\s+" +
      "\\$?([\\d,]+\\.\\d{2})",
    "g",
  )

  let m
  while ((m = pattern.exec(text)) !== null) {
    const dateISO = moment(m[2], "DD/MM/YYYY").format("YYYY-MM-DD")
    const amountValue = Number.parseFloat(m[5].replace(/,/g, ""))
    const amount = m[6] ? amountValue : -amountValue

    transactions.push({
      id: uuidv4(),
      date: dateISO,
      description: m[4].trim(),
      amount,
    })
  }

  return transactions
}

// --- AMEX ---
async function processAmex(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l)
  const transactions = []
  const datePattern =
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(.*)$/

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

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(datePattern)
    if (m) {
      const dateStr = `2025-${monthMap[m[1]]}-${m[2].padStart(2, "0")}`
      const merchant = m[3]

      if (i + 1 >= lines.length) continue

      const nextLine = lines[i + 1]

      if (/UNITED STATES DOLLAR/.test(nextLine)) {
        if (i + 2 >= lines.length) continue
        const parts = lines[i + 2].split(/\s+/)
        if (parts.length === 2) {
          transactions.push({
            id: uuidv4(),
            date: dateStr,
            description: `${merchant} (USD ${parts[0]})`,
            amount: -Number.parseFloat(parts[1].replace(/,/g, "")),
          })
        }
        i += 2
        continue
      }

      if (/Reference:/.test(nextLine)) {
        const tail = nextLine.split("Reference:")[1].trim()
        const dotIndex = tail.lastIndexOf(".")
        let amount = 0

        if (dotIndex !== -1) {
          const decimals = tail.slice(dotIndex + 1, dotIndex + 3)
          let j = dotIndex - 1
          let integer = ""
          let count = 0

          while (j >= 0 && /\d/.test(tail[j]) && count < 2) {
            integer = tail[j] + integer
            j--
            count++
          }

          amount = Number.parseFloat(`${integer || "0"}.${decimals}`)
        }

        transactions.push({
          id: uuidv4(),
          date: dateStr,
          description: `${merchant} Ref:${tail}`,
          amount: -amount,
        })

        i++
        continue
      }

      const amtMatch = merchant.match(/(\d+\.\d{2})$/)
      if (amtMatch) {
        const cleanMerchant = merchant.replace(/\s+\d+\.\d{2}$/, "")
        transactions.push({
          id: uuidv4(),
          date: dateStr,
          description: cleanMerchant,
          amount: -Number.parseFloat(amtMatch[1]),
        })
      }
    }
  }

  return transactions
}
