"use client"

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  ChevronRight,
  Shield,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  Landmark,
  Banknote,
  RefreshCw,
  History,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ExtractedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: "debit" | "credit"
  balance?: number
  category?: string
}

interface ProcessedFile {
  id: string
  bankName: string
  bankId: string
  progress: number
  status: "processing" | "completed" | "error"
  error?: string
  transactions?: ExtractedTransaction[]
  processingTime?: number
  file?: File
  uploadDate: string
  transactionCount?: number // Add this field
  metadata?: {
    pageCount: number
    textLength: number
    fileName: string
    fileSize: number
  }
}

interface BankOption {
  id: string
  name: string
  logo: string
  color: string
  gradient: string
  icon: React.ComponentType<any>
}

const BANK_OPTIONS: BankOption[] = [
  {
    id: "westpac",
    name: "Westpac",
    logo: "/logos/westpac.svg",
    color: "bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300",
    gradient: "from-red-500 to-red-600",
    icon: Building2,
  },
  {
    id: "amex",
    name: "American Express",
    logo: "/logos/amex.svg",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
    gradient: "from-blue-500 to-blue-600",
    icon: CreditCard,
  },
  {
    id: "cba",
    name: "CommBank",
    logo: "/logos/cba.svg",
    color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300",
    gradient: "from-yellow-500 to-yellow-600",
    icon: Banknote,
  },
  {
    id: "anz",
    name: "ANZ",
    logo: "/logos/anz.svg",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
    gradient: "from-blue-600 to-blue-700",
    icon: Landmark,
  },
]


// Helper functions
const trimDescription = (description: string, maxLength = 110): string => {
  if (!description) return "Unknown transaction"
  const trimmed = description.trim()
  if (trimmed.length <= maxLength) return trimmed.substring(0, maxLength)
  return trimmed.substring(0, maxLength - 3) + "..."
}

const formatTransactionAmount = (amount: number, type: string): number => {
  if (typeof amount !== "number" || isNaN(amount)) return 0
  if (type === "debit" && amount > 0) {
    return -Math.abs(amount)
  }
  if (type === "credit" && amount < 0) {
    return Math.abs(amount)
  }
  return amount
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

// Helper function to trigger transaction refresh across the app
const triggerTransactionRefresh = () => {
  console.log("🔄 Triggering transaction refresh across app...")

  // Clear all transaction-related caches
  localStorage.removeItem("transaction_cache")
  localStorage.removeItem("transaction_stats_cache")
  localStorage.removeItem("premium_status_cache")

  // Update timestamp to force reload
  localStorage.setItem("last_transaction_update", Date.now().toString())

  // Dispatch multiple events to ensure all components refresh
  window.dispatchEvent(new CustomEvent("transactionsUpdated"))
  window.dispatchEvent(
    new CustomEvent("storage", {
      detail: { key: "pdf_transactions", action: "update" },
    }),
  )

  // Force a small delay then trigger another event
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("transactionsUpdated"))
  }, 100)

  console.log("✅ Transaction refresh events dispatched")
}

export default function UploadStatementsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State management
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null)
  const [showBankSelection, setShowBankSelection] = useState(false)
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [fileHistory, setFileHistory] = useState<ProcessedFile[]>([])
  const [allTransactions, setAllTransactions] = useState<ExtractedTransaction[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Load file history on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("pdf_upload_history")
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setFileHistory(history)
      } catch (error) {
        console.error("Error loading file history:", error)
      }
    }
  }, [])

  // Auto-show bank selection on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const manageMode = urlParams.get("manage")

    if (manageMode === "true") {
      setShowHistory(true)
    } else if (!selectedBank) {
      setShowBankSelection(true)
    }
  }, [selectedBank])

  // Save file history whenever files change - with size limits
  useEffect(() => {
    const completedFiles = files.filter((f) => f.status === "completed")
    if (completedFiles.length > 0) {
      try {
        // Create lightweight history entries (remove heavy data)
        const lightweightFiles = completedFiles.map((file) => ({
          id: file.id,
          bankName: file.bankName,
          bankId: file.bankId,
          status: file.status,
          uploadDate: file.uploadDate,
          processingTime: file.processingTime,
          metadata: file.metadata
            ? {
                fileName: file.metadata.fileName,
                fileSize: file.metadata.fileSize,
                pageCount: file.metadata.pageCount,
                textLength: 0, // Don't store large text content
              }
            : undefined,
          transactionCount: file.transactions?.length || 0,
          // Don't store actual transactions in history - they're in pdf_transactions
        }))

        // Check if these files are already in history to prevent duplicates
        const existingIds = new Set(fileHistory.map((f) => f.id))
        const newFiles = lightweightFiles.filter((f) => !existingIds.has(f.id))

        if (newFiles.length > 0) {
          const updatedHistory = [...fileHistory, ...newFiles]

          // Limit history to last 50 files to prevent quota issues
          const limitedHistory = updatedHistory.slice(-50)

          const historyString = JSON.stringify(limitedHistory)

          // Check if we're approaching localStorage limit (5MB typical limit)
          if (historyString.length > 4 * 1024 * 1024) {
            // 4MB threshold
            // Keep only last 25 files if still too large
            const reducedHistory = limitedHistory.slice(-25)
            localStorage.setItem("pdf_upload_history", JSON.stringify(reducedHistory))
            setFileHistory(reducedHistory)
          } else {
            localStorage.setItem("pdf_upload_history", JSON.stringify(limitedHistory))
            setFileHistory(limitedHistory)
          }
        }
      } catch (error) {
        console.warn("Failed to save file history to localStorage:", error)
        // If localStorage fails, just keep in memory
        const lightweightFiles = completedFiles.map((file) => ({
          id: file.id,
          bankName: file.bankName,
          bankId: file.bankId,
          status: file.status,
          uploadDate: file.uploadDate,
          processingTime: file.processingTime,
          metadata: file.metadata
            ? {
                fileName: file.metadata.fileName,
                fileSize: file.metadata.fileSize,
                pageCount: file.metadata.pageCount,
                textLength: 0,
              }
            : undefined,
          transactionCount: file.transactions?.length || 0,
        }))

        const existingIds = new Set(fileHistory.map((f) => f.id))
        const newFiles = lightweightFiles.filter((f) => !existingIds.has(f.id))

        if (newFiles.length > 0) {
          setFileHistory((prev) => [...prev, ...newFiles].slice(-25))
        }
      }
    }
  }, [files]) // Remove fileHistory from dependencies to prevent infinite loop

  const handleBankSelection = (bank: BankOption) => {
    setSelectedBank(bank)
    setShowBankSelection(false)
    // Automatically trigger file selection after a short delay
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 300)
  }

  const handleChangeBankClick = () => {
    setShowBankSelection(true)
  }

  const handleFileSelect = () => {
    if (!selectedBank) {
      setShowBankSelection(true)
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!selectedBank) {
      setShowBankSelection(true)
      return
    }

    const file = e.dataTransfer.files[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const processUploadedFile = async (file: File) => {
    if (!selectedBank) return

    // Validate file
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.")
      return
    }

    const startTime = Date.now()
    const fileId = Math.random().toString(36).substr(2, 9)

    // Create processing file entry
    const processingFile: ProcessedFile = {
      id: fileId,
      bankName: selectedBank.name,
      bankId: selectedBank.id,
      progress: 0,
      status: "processing",
      file: file,
      uploadDate: new Date().toISOString(),
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        pageCount: 0,
        textLength: 0,
      },
    }

    setFiles((prev) => [...prev, processingFile])

    // Simulate progress
    const progressInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId && f.status === "processing") {
            const newProgress = Math.min(f.progress + Math.random() * 15 + 5, 95)
            return { ...f, progress: newProgress }
          }
          return f
        }),
      )
    }, 200)

    try {
      console.log(`🚀 Processing ${selectedBank.name} PDF: ${file.name}`)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("bank", selectedBank.id)

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process PDF")
      }

      const result = await response.json()
      console.log("📊 API Response:", result)

      clearInterval(progressInterval)

      if (result.success) {
        const extractedTransactions = result.transactions.map((t: any, index: number) => {
          const processedTransaction = {
            ...t,
            id: `${fileId}-${index}`,
            description: trimDescription(t.description || "Unknown transaction", 110),
            amount: formatTransactionAmount(t.amount || 0, t.type || "debit"),
          }
          return processedTransaction
        })

        const processingTime = Date.now() - startTime

        // Check if no transactions were found
        if (extractedTransactions.length === 0) {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === fileId) {
                return {
                  ...f,
                  status: "error",
                  error:
                    "No transactions found. Please ensure your PDF is in the correct format and contains transaction data.",
                }
              }
              return f
            }),
          )
          return
        }

        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileId) {
              return {
                ...f,
                status: "completed",
                progress: 100,
                transactions: extractedTransactions,
                processingTime,
                metadata: {
                  pageCount: result.pageCount || 1,
                  textLength: result.metadata?.textLength || 0,
                  fileName: file.name,
                  fileSize: file.size,
                },
              }
            }
            return f
          }),
        )

        setAllTransactions((prev) => [...prev, ...extractedTransactions])
        console.log(`✅ Successfully processed ${extractedTransactions.length} transactions`)
      } else {
        throw new Error(result.error || "Processing failed")
      }
    } catch (error) {
      console.error("❌ Error processing PDF:", error)
      clearInterval(progressInterval)

      const errorMessage = error instanceof Error ? error.message : "Processing failed"

      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId) {
            return {
              ...f,
              status: "error",
              error: errorMessage,
            }
          }
          return f
        }),
      )
    }
  }

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find((f) => f.id === fileId)
    if (fileToRemove?.transactions) {
      const transactionIds = fileToRemove.transactions.map((t) => t.id)
      setAllTransactions((prev) => prev.filter((t) => !transactionIds.includes(t.id)))
    }
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const clearHistory = () => {
    console.log("🗑️ Clearing all PDF history and transactions...")

    // Remove all PDF transactions from localStorage
    const existingTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
    const filteredTransactions = existingTransactions.filter((t: any) => {
      // Remove all PDF-related transactions
      return t.source !== "pdf-upload"
    })

    console.log(`📊 Removing ${existingTransactions.length - filteredTransactions.length} PDF transactions`)

    // Update localStorage
    localStorage.setItem("pdf_transactions", JSON.stringify(filteredTransactions))

    // Clear history
    setFileHistory([])
    localStorage.removeItem("pdf_upload_history")

    // Trigger comprehensive refresh
    triggerTransactionRefresh()

    console.log("✅ History cleared and transactions refreshed")
  }

  const handleContinue = () => {
    const completedFiles = files.filter((file) => file.status === "completed")
    if (completedFiles.length === 0) {
      alert("Please process at least one PDF statement before continuing.")
      return
    }

    console.log("💾 Saving transactions to localStorage...")

    try {
      const existingTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
      const newTransactions = allTransactions.map((t, index) => {
        // Find which file this transaction belongs to
        const sourceFile = files.find((f) => f.transactions?.some((ft) => ft.id === t.id))
        const uniqueId = `pdf-${selectedBank?.id}-${Date.now()}-${index}`
        const balance = typeof t.balance === "number" ? t.balance : typeof t.amount === "number" ? t.amount : 0
        const trimmedDescription = trimDescription(t.description || "Unknown transaction", 110)
        const formattedAmount = formatTransactionAmount(t.amount || 0, t.type || "debit")

        return {
          id: uniqueId,
          description: trimmedDescription,
          amount: formattedAmount,
          date: t.date || new Date().toISOString(),
          category: t.category || "Other",
          account: `${selectedBank?.name || "PDF"} Statement`,
          accountId: `pdf-${selectedBank?.id || "unknown"}`,
          accountNumber: "****",
          type: t.type || (formattedAmount < 0 ? "debit" : "credit"),
          balance: balance,
          source: "pdf-upload",
          bankType: selectedBank?.id,
          isBusinessExpense: undefined,
          deductionAmount: 0,
          deductionType: undefined,
          autoClassified: false,
          pdfFileId: sourceFile?.id,
          pdfFileName: sourceFile?.metadata?.fileName,
        }
      })

      const existingIds = new Set(existingTransactions.map((t: any) => t.id))
      const filteredNewTransactions = newTransactions.filter((t) => !existingIds.has(t.id))
      const allStoredTransactions = [...existingTransactions, ...filteredNewTransactions]

      localStorage.setItem("pdf_transactions", JSON.stringify(allStoredTransactions))

      // Trigger transaction refresh
      triggerTransactionRefresh()

      console.log(`✅ Saved ${filteredNewTransactions.length} new transactions`)

      // Force a small delay to ensure localStorage is written
      setTimeout(() => {
        router.push("/transactions?source=pdf-upload")
      }, 100)
    } catch (error) {
      console.error("Error saving transactions:", error)
      alert("Failed to save transactions. Please try again.")
    }
  }

  const completedFiles = files.filter((file) => file.status === "completed")
  const totalTransactions = allTransactions.length
  const canContinue = completedFiles.length > 0

  const formatProcessingTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`
  }

  const removeFileFromHistory = (fileId: string) => {
    const fileToRemove = fileHistory.find((f) => f.id === fileId)
    if (fileToRemove) {
      console.log(`🗑️ Removing PDF: ${fileToRemove.metadata?.fileName}`)

      // Remove transactions from localStorage that belong to this PDF file
      const existingTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")

      // Filter out transactions that match any of these criteria
      const filteredTransactions = existingTransactions.filter((t: any) => {
        const matchesFileId = t.pdfFileId === fileId
        const matchesFileName = t.pdfFileName === fileToRemove.metadata?.fileName
        const matchesAccount = t.account && t.account.includes(fileToRemove.bankName)
        const matchesAccountId = t.accountId && t.accountId.includes(fileToRemove.bankId)
        const matchesBankType = t.bankType === fileToRemove.bankId
        const matchesSource = t.source === "pdf-upload" && t.bankType === fileToRemove.bankId

        // Keep transactions that DON'T match any of these criteria
        return !(
          matchesFileId ||
          matchesFileName ||
          matchesAccount ||
          matchesAccountId ||
          matchesBankType ||
          matchesSource
        )
      })

      console.log(`📊 Transactions before: ${existingTransactions.length}, after: ${filteredTransactions.length}`)

      localStorage.setItem("pdf_transactions", JSON.stringify(filteredTransactions))

      // Trigger comprehensive refresh
      triggerTransactionRefresh()
    }

    // Remove from history
    const updatedHistory = fileHistory.filter((f) => f.id !== fileId)
    setFileHistory(updatedHistory)
    localStorage.setItem("pdf_upload_history", JSON.stringify(updatedHistory))

    console.log("✅ File removed and transactions refreshed")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div
          className="absolute rounded-full bg-gradient-to-r from-[#BEF397]/10 to-[#7DD3FC]/10 blur-xl animate-pulse"
          style={{ width: "200px", height: "200px", top: "20%", left: "10%" }}
        />
        <div
          className="absolute rounded-full bg-gradient-to-r from-[#7DD3FC]/10 to-[#BEF397]/10 blur-xl animate-pulse"
          style={{ width: "150px", height: "150px", top: "60%", right: "15%", animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-[#BEF397] text-3xl font-bold tracking-wide">moulai.</h1>
          </div>

          <Button
            onClick={() => setShowHistory(true)}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
          >
            <History className="w-4 h-4 mr-2" />
            Manage PDFs
          </Button>
        </div>

        {/* Security Notice */}
        <div className="max-w-2xl mx-auto w-full mb-8">
          <Alert className="border-green-800/50 bg-green-900/20 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 text-center">
              <strong>Your data stays secure.</strong> Files are processed securely and not permanently stored on our
              servers.
            </AlertDescription>
          </Alert>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-4xl mx-auto w-full">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              {selectedBank ? `Upload ${selectedBank.name} Statements` : "Upload Bank Statements"}
            </h2>
            <p className="text-zinc-400 text-lg">
              {selectedBank
                ? `Ready to process your ${selectedBank.name} PDF statements`
                : "Choose your bank and upload PDF statements to extract transactions"}
            </p>
          </div>

          {/* Bank Selection Section */}
          <div className="mb-8">
            <Card className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#BEF397]" />
                  Select Your Bank
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBank ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                        <img
                          src={selectedBank.logo || "/placeholder.svg"}
                          alt={`${selectedBank.name} logo`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{selectedBank.name}</h3>
                        <p className="text-zinc-400 text-sm">Ready to process PDF statements</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleChangeBankClick}
                      variant="outline"
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 bg-transparent"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Change Bank
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-[#BEF397]" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Choose Your Bank</h3>
                    <p className="text-zinc-400 mb-6">Select your bank to get started with PDF processing</p>
                    <Button
                      onClick={() => setShowBankSelection(true)}
                      className="bg-gradient-to-r from-[#BEF397] to-[#7DD397] text-black hover:shadow-lg"
                    >
                      Select Bank
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          {totalTransactions > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
              <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-xl px-4 py-3 text-center">
                <div className="text-xl font-bold text-[#BEF397]">{completedFiles.length}</div>
                <div className="text-xs text-zinc-400">Files Processed</div>
              </div>
              <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-xl px-4 py-3 text-center">
                <div className="text-xl font-bold text-[#7DD3FC]">{totalTransactions}</div>
                <div className="text-xs text-zinc-400">Transactions</div>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          {selectedBank && (
            <div className="mb-8">
              <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-2xl border border-zinc-700/50 shadow-2xl">
                <CardContent className="p-10">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer",
                      isDragOver
                        ? "border-[#BEF397] bg-[#BEF397]/10 scale-105"
                        : "border-zinc-600 hover:border-[#BEF397]/70 hover:bg-zinc-800/40",
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleFileSelect}
                  >
                    <div className="flex flex-col items-center gap-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#BEF397]/30 to-[#7DD3FC]/30 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                        <Upload className="w-12 h-12 text-[#BEF397]" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-semibold text-white mb-4">
                          Upload Your {selectedBank.name} Statement
                        </h3>
                        <p className="text-zinc-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                          Drag and drop your PDF file here, or click to browse your files
                        </p>
                        <Button
                          disabled={files.some((f) => f.status === "processing")}
                          size="lg"
                          className="h-16 px-12 text-lg font-semibold bg-gradient-to-r from-[#BEF397] to-[#7DD397] text-black hover:shadow-2xl hover:shadow-[#BEF397]/25 disabled:opacity-50 transform hover:scale-105 transition-all duration-300"
                        >
                          {files.some((f) => f.status === "processing") ? (
                            <>
                              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                              Processing PDF...
                            </>
                          ) : (
                            <>
                              <FileText className="w-6 h-6 mr-3" />
                              Choose PDF File
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-zinc-400 space-y-2">
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span>Secure processing - files are not stored permanently</span>
                        </div>
                        <p className="text-sm">Supported: PDF files up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Onboarding Section - Show when no bank selected */}
          {!selectedBank && (
            <div className="text-center mb-8">
              <Card className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 max-w-2xl mx-auto">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-[#BEF397]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Get Started in 3 Easy Steps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#BEF397]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#BEF397] font-bold text-lg">1</span>
                      </div>
                      <h4 className="text-white font-semibold mb-2">Choose Bank</h4>
                      <p className="text-zinc-400 text-sm">Select your bank from our supported list</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#7DD3FC]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#7DD3FC] font-bold text-lg">2</span>
                      </div>
                      <h4 className="text-white font-semibold mb-2">Upload PDF</h4>
                      <p className="text-zinc-400 text-sm">Drag & drop your bank statement</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#BEF397]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#BEF397] font-bold text-lg">3</span>
                      </div>
                      <h4 className="text-white font-semibold mb-2">Analyze</h4>
                      <p className="text-zinc-400 text-sm">Review extracted transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hidden File Input */}
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />

          {/* File List */}
          {files.map((file) => (
            <div key={file.id} className="mb-4">
              <Card className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {file.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : file.status === "error" ? (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <Loader2 className="w-6 h-6 text-[#BEF397] animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium truncate">
                          {file.metadata?.fileName || `${file.bankName} PDF Statement`}
                        </p>
                        <div className="flex items-center gap-2">
                          {file.status === "completed" && file.transactions && (
                            <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">
                              {file.transactions.length} transactions
                            </Badge>
                          )}
                          {file.metadata && (
                            <Badge className="bg-[#7DD3FC]/20 text-[#7DD3FC] border-[#7DD3FC]/30">
                              {formatFileSize(file.metadata.fileSize)}
                            </Badge>
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span>{file.bankName} PDF</span>
                        {file.status === "processing" && (
                          <>
                            <span>•</span>
                            <span className="text-[#BEF397]">Processing {Math.round(file.progress)}%</span>
                          </>
                        )}
                        {file.status === "completed" && (
                          <>
                            <span>•</span>
                            <span className="text-green-500">Complete</span>
                            {file.processingTime && (
                              <>
                                <span>•</span>
                                <span>{formatProcessingTime(file.processingTime)}</span>
                              </>
                            )}
                          </>
                        )}
                        {file.status === "error" && (
                          <>
                            <span>•</span>
                            <span className="text-red-400">Failed</span>
                          </>
                        )}
                      </div>
                      {file.status === "processing" && <Progress value={file.progress} className="mt-2 h-2" />}
                      {file.status === "error" && file.error && (
                        <p className="text-red-400 text-sm mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Success Message */}
          {completedFiles.length > 0 && (
            <div className="text-center mt-8 mb-24">
              <Card className="bg-green-900/20 border border-green-500/30 max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Processing Complete!</h3>
                  </div>
                  <p className="text-green-300 mb-4">
                    Successfully extracted {totalTransactions} transactions from {completedFiles.length} PDF
                    {completedFiles.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    Use the button below to review and categorize your transactions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Floating Proceed Button */}
          {canContinue && (
            <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
              <Button
                onClick={handleContinue}
                size="lg"
                className="h-16 px-12 text-lg font-semibold bg-gradient-to-r from-[#BEF397] to-[#7DD397] text-black hover:shadow-2xl shadow-lg transform hover:scale-105 transition-all duration-300 rounded-full"
              >
                <CheckCircle className="w-6 h-6 mr-3" />
                View {totalTransactions} Transactions
                <ChevronRight className="ml-3 w-6 h-6" />
              </Button>
            </div>
          )}
        </div>

        {/* Bank Selection Dialog */}
        <Dialog open={showBankSelection} onOpenChange={setShowBankSelection}>
          <DialogContent className="sm:max-w-lg bg-zinc-900/95 backdrop-blur-sm border-zinc-800 text-white">
            <DialogHeader className="text-center pb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 className="w-6 h-6 text-black" />
              </div>
              <DialogTitle className="text-xl font-bold text-white mb-2">Choose Your Bank</DialogTitle>
              <DialogDescription className="text-zinc-300 text-lg">
                Select your bank to get started with PDF statement processing
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-4">
              {BANK_OPTIONS.map((bank) => {
                return (
                  <div key={bank.id}>
                    <Card
                      className="cursor-pointer transition-all duration-300 bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50 hover:border-[#BEF397]/50 shadow-lg hover:shadow-xl hover:scale-105"
                      onClick={() => handleBankSelection(bank)}
                    >
                      <CardContent className="p-4 text-center flex items-center gap-4">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-zinc-900">
                            <img
                              src={bank.logo || "/placeholder.svg"}
                              alt={bank.name}
                              className="object-contain w-full h-full"
                            />
                          </div>

                          <div className="text-left">
                            <h3 className="font-bold text-lg text-white">{bank.name}</h3>
                            <p className="text-sm text-zinc-400">Click to select</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBankSelection(false)}
                className="px-8 py-2 border-zinc-600 text-zinc-300 hover:bg-zinc-800 bg-transparent"
              >
                Cancel
              </Button>

              <div className="text-center mt-2 text-sm text-zinc-400">
                Don't see your bank?{" "}
                <button
                  onClick={() => {
                    setShowBankSelection(false)
                    router.push("/contact-cpa")
                  }}
                  className="font-medium text-[#BEF397] hover:underline transition"
                >
                  Send us your statement
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* File History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="sm:max-w-4xl bg-zinc-900/95 backdrop-blur-sm border-zinc-800 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-xl flex items-center justify-center">
                    <History className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">Uploaded PDFs</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Manage your processed PDF statements
                    </DialogDescription>
                  </div>
                </div>
                <Button
                  onClick={() => setShowHistory(false)}
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            {/* Navigation Buttons - Show when in manage mode */}
            {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("manage") === "true" && (
              <div className="px-6 pb-4 border-b border-zinc-700">
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setShowHistory(false)
                      router.push("/dashboard")
                    }}
                    className="bg-gradient-to-r from-[#BEF397] to-[#7DD397] text-black hover:shadow-lg flex-1 max-w-[200px]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      setShowHistory(false)
                      setShowBankSelection(true)
                    }}
                    variant="outline"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 bg-transparent flex-1 max-w-[200px]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Statement
                  </Button>
                </div>
              </div>
            )}

            <div className="py-4">
              {fileHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-zinc-500" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">No PDFs Uploaded</h3>
                  <p className="text-zinc-400">Upload some PDF statements to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fileHistory.map((file) => (
                    <Card
                      key={file.id}
                      className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-white font-medium truncate">
                                {file.metadata?.fileName || `${file.bankName} Statement`}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 text-xs">
                                  {file.bankName}
                                </Badge>
                                {file.transactionCount && (
                                  <Badge className="bg-[#7DD3FC]/20 text-[#7DD3FC] border-[#7DD3FC]/30 text-xs">
                                    {file.transactionCount} transactions
                                  </Badge>
                                )}
                                <button
                                  onClick={() => removeFileFromHistory(file.id)}
                                  className="text-zinc-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-900/20"
                                  title="Remove PDF and its transactions"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(file.uploadDate)}</span>
                              {file.metadata && (
                                <>
                                  <span>•</span>
                                  <span>{formatFileSize(file.metadata.fileSize)}</span>
                                </>
                              )}
                              {file.processingTime && (
                                <>
                                  <span>•</span>
                                  <span>{formatProcessingTime(file.processingTime)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {fileHistory.length > 0 && (
                    <div className="pt-4 border-t border-zinc-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-400">
                          {fileHistory.length} PDF{fileHistory.length !== 1 ? "s" : ""} uploaded
                        </p>
                        <Button
                          onClick={clearHistory}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
                        >
                          Clear All History
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
