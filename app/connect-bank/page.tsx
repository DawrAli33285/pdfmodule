"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Download,
  Sparkles,
  File,
  Zap,
  TrendingUp,
  Shield,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { TransactionUtils } from "@/lib/transaction-utils"
import { BankSelectionPopup } from "@/components/bank-selection-popup"

interface BankOption {
  id: string
  name: string
  logo: string
  color: string
  searchTerms: string[]
}

interface ExtractedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: "debit" | "credit"
  balance?: number
  category?: string
}

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: "uploading" | "processing" | "completed" | "error"
  error?: string
  transactions?: ExtractedTransaction[]
  processingTime?: number
  bankType?: string
}

interface PreviousStatement {
  id: string
  name: string
  size: number
  uploadedAt: string
  transactionCount: number
  processingTime?: number
  bankType?: string
}

export default function ConnectAccountPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showBankPopup, setShowBankPopup] = useState(true)
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [allTransactions, setAllTransactions] = useState<ExtractedTransaction[]>([])
  const [previousStatements, setPreviousStatements] = useState<PreviousStatement[]>([])
  const [processedTransactions, setProcessedTransactions] = useState<any[]>([])

  // Load previously uploaded statements on component mount
  useEffect(() => {
    const loadPreviousStatements = async () => {
      try {
        const statements = JSON.parse(localStorage.getItem("uploaded_statements") || "[]")
        setPreviousStatements(statements)

        // Load and process transactions using the centralized method
        const transactions = await TransactionUtils.loadAllTransactions()
        setProcessedTransactions(transactions)

        // Also set raw transactions for display
        const rawTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
        const extractedTransactions = rawTransactions.map((t: any) => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: Number.parseFloat(t.amount),
          type: t.type,
          balance: t.balance,
          category: t.category,
        }))
        setAllTransactions(extractedTransactions)
      } catch (error) {
        console.error("Error loading previous statements:", error)
      }
    }

    loadPreviousStatements()
  }, [])

  const handleBankSelect = (bank: BankOption) => {
    setSelectedBank(bank)
    setShowBankPopup(false)
    // Trigger file input immediately after bank selection
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 100)
  }

  const handleUploadStatements = (bank: BankOption) => {
    setSelectedBank(bank)
    setShowBankPopup(false)
    // Trigger file input immediately after bank selection
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 100)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (file.type !== "application/pdf") {
        alert(`${file.name} is not a PDF file. Please upload PDF files only.`)
        return false
      }
      if (file.size > 15 * 1024 * 1024) {
        alert(`${file.name} is too large. Please upload files smaller than 15MB.`)
        return false
      }
      return true
    })

    const uploadFiles: UploadedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "uploading",
      bankType: selectedBank?.id,
    }))

    setFiles((prev) => [...prev, ...uploadFiles])

    uploadFiles.forEach((uploadFile) => {
      processFile(uploadFile)
    })
  }

  const processFile = async (uploadFile: UploadedFile) => {
    const startTime = Date.now()
    const fileId = uploadFile.id

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "uploading") {
            const newProgress = Math.min(file.progress + Math.random() * 15 + 5, 100)
            if (newProgress >= 100) {
              clearInterval(uploadInterval)
              return { ...file, progress: 100, status: "processing" }
            }
            return { ...file, progress: newProgress }
          }
          return file
        }),
      )
    }, 200)

    // Wait for upload to complete, then start processing
    setTimeout(async () => {
      try {
        const formData = new FormData()
        formData.append("file", uploadFile.file)
        if (selectedBank) {
          formData.append("bankType", selectedBank.id)
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 60000) // 60 second timeout

        const response = await fetch("/api/upload-statements/process", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()

        if (result.success) {
          const extractedTransactions = result.transactions.map((t: any, index: number) => ({
            ...t,
            id: `${fileId}-${index}`,
          }))

          const processingTime = Date.now() - startTime

          setFiles((prev) =>
            prev.map((file) => {
              if (file.id === fileId) {
                return {
                  ...file,
                  status: "completed",
                  transactions: extractedTransactions,
                  processingTime,
                }
              }
              return file
            }),
          )

          setAllTransactions((prev) => [...prev, ...extractedTransactions])

          // Save to localStorage
          const existingTransactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
          const newTransactions = extractedTransactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount.toString(),
            date: t.date,
            category: t.category || "Other",
            account: `${selectedBank?.name || "PDF"} Statement`,
            accountId: "pdf-upload",
            accountNumber: "****",
            type: t.type,
            potentialDeduction: t.amount < 0,
            enriched: false,
            source: "pdf-upload",
            balance: t.balance,
            bankType: selectedBank?.id,
          }))

          localStorage.setItem("pdf_transactions", JSON.stringify([...existingTransactions, ...newTransactions]))

          // Save statement metadata
          const uploadedStatements = JSON.parse(localStorage.getItem("uploaded_statements") || "[]")
          const newStatement = {
            id: fileId,
            name: uploadFile.file.name,
            size: uploadFile.file.size,
            uploadedAt: new Date().toISOString(),
            transactionCount: extractedTransactions.length,
            processingTime,
            bankType: selectedBank?.id,
          }

          localStorage.setItem("uploaded_statements", JSON.stringify([...uploadedStatements, newStatement]))
          setPreviousStatements((prev) => [...prev, newStatement])

          // Reload processed transactions to get updated deduction count
          const updatedTransactions = await TransactionUtils.loadAllTransactions()
          setProcessedTransactions(updatedTransactions)
        } else {
          throw new Error(result.error || "Failed to process PDF")
        }
      } catch (error) {
        console.error("Error processing file:", error)
        const errorMessage = error instanceof Error ? error.message : "Processing failed"

        setFiles((prev) =>
          prev.map((file) => {
            if (file.id === fileId) {
              return {
                ...file,
                status: "error",
                error: errorMessage,
              }
            }
            return file
          }),
        )
      }
    }, 1500)
  }

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find((f) => f.id === fileId)
    if (fileToRemove?.transactions) {
      const transactionIds = fileToRemove.transactions.map((t) => t.id)
      setAllTransactions((prev) => prev.filter((t) => !transactionIds.includes(t.id)))
    }
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const removePreviousStatement = async (statementId: string) => {
    // Remove from localStorage
    const statements = JSON.parse(localStorage.getItem("uploaded_statements") || "[]")
    const updatedStatements = statements.filter((s: PreviousStatement) => s.id !== statementId)
    localStorage.setItem("uploaded_statements", JSON.stringify(updatedStatements))

    // Remove transactions associated with this statement
    const transactions = JSON.parse(localStorage.getItem("pdf_transactions") || "[]")
    const updatedTransactions = transactions.filter((t: any) => !t.id.startsWith(statementId))
    localStorage.setItem("pdf_transactions", JSON.stringify(updatedTransactions))

    // Update state
    setPreviousStatements(updatedStatements)
    setAllTransactions((prev) => prev.filter((t) => !t.id.startsWith(statementId)))

    // Reload processed transactions to get updated deduction count
    const reloadedTransactions = await TransactionUtils.loadAllTransactions()
    setProcessedTransactions(reloadedTransactions)
  }

  const retryFile = (fileId: string) => {
    const fileToRetry = files.find((f) => f.id === fileId)
    if (!fileToRetry) return

    setFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId) {
          return { ...file, status: "uploading", progress: 0, error: undefined }
        }
        return file
      }),
    )
    processFile(fileToRetry)
  }

  const exportTransactions = () => {
    if (allTransactions.length === 0) return

    const csvContent = [
      ["Date", "Description", "Amount", "Type", "Category", "Balance"].join(","),
      ...allTransactions.map((t) =>
        [t.date, `"${t.description.replace(/"/g, '""')}"`, t.amount, t.type, t.category || "", t.balance || ""].join(
          ",",
        ),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `extracted-transactions-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatProcessingTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`
  }

  const handleContinue = () => {
    const completedFiles = files.filter((file) => file.status === "completed")
    if (completedFiles.length === 0 && previousStatements.length === 0) {
      alert("Please upload and process at least one PDF statement before continuing.")
      return
    }

    router.push("/dashboard?from=upload")
  }

  const handleChangeBank = () => {
    setShowBankPopup(true)
    setSelectedBank(null)
  }

  const completedFiles = files.filter((file) => file.status === "completed")
  const processingFiles = files.filter((file) => file.status === "processing")
  const errorFiles = files.filter((file) => file.status === "error")
  const totalTransactions = allTransactions.length
  const canContinue = completedFiles.length > 0 || previousStatements.length > 0
  const totalFiles = files.length + previousStatements.length

  // Calculate actual deductions using the same logic as transaction tab
  const actualDeductions = processedTransactions.filter((t) => t.isBusinessExpense && t.deductionAmount > 0).length
  const totalDeductionAmount = processedTransactions
    .filter((t) => t.isBusinessExpense && t.deductionAmount)
    .reduce((sum, t) => sum + (t.deductionAmount || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative">
      {/* Bank Selection Popup */}
      <BankSelectionPopup
        isOpen={showBankPopup}
        onClose={() => setShowBankPopup(false)}
        onBankSelect={handleBankSelect}
        onUploadStatements={handleUploadStatements}
      />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple accept=".pdf" onChange={handleFileInput} className="hidden" />

      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-[#BEF397]/5 to-[#7DD3FC]/5 blur-2xl"
            style={{
              width: `${150 + Math.random() * 100}px`,
              height: `${150 + Math.random() * 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.1, 0.9, 1],
              opacity: [0.3, 0.5, 0.3, 0.3],
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm transition-all duration-300 hover:border-zinc-600 h-9 px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-[#BEF397] text-2xl font-bold tracking-wide">moulai.</h1>
          </div>
          <div className="w-20" />
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
            {selectedBank ? (
              <>
                Upload Your{" "}
                <span className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] bg-clip-text text-transparent">
                  {selectedBank.name} Statements
                </span>
              </>
            ) : (
              <>
                Upload Your{" "}
                <span className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] bg-clip-text text-transparent">
                  Bank Statements
                </span>
              </>
            )}
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
            {selectedBank
              ? `AI-powered analysis optimized for ${selectedBank.name} statement format`
              : "Our AI will analyze your PDF statements and automatically identify tax deductions"}
          </p>
          {selectedBank && (
            <Button
              onClick={handleChangeBank}
              variant="outline"
              size="sm"
              className="mt-3 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 bg-transparent"
            >
              Change Bank
            </Button>
          )}
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-6"
        >
          <Alert className="border-green-800/50 bg-gradient-to-r from-green-900/20 to-green-800/10 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 text-sm">
              <strong>100% Secure & Private</strong> • All data processed locally on your device • Never stored on our
              servers
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Progress Stats */}
        {(totalTransactions > 0 || processingFiles.length > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/30 rounded-xl px-3 py-2 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#BEF397]/10 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-[#BEF397]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-[#BEF397]">{totalFiles}</div>
                  <div className="text-xs text-zinc-400">Files Uploaded</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/30 rounded-xl px-3 py-2 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#7DD3FC]/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#7DD3FC]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-[#7DD3FC]">{totalTransactions}</div>
                  <div className="text-xs text-zinc-400">Transactions</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/30 rounded-xl px-3 py-2 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">{actualDeductions}</div>
                  <div className="text-xs text-zinc-400">Deductions Found</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/30 rounded-xl px-3 py-2 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">${totalDeductionAmount.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400">Potential Savings</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Area - More Prominent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/70 backdrop-blur-2xl border border-zinc-700/40 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#BEF397]/10 rounded-lg flex items-center justify-center">
                        <Upload className="w-4 h-4 text-[#BEF397]" />
                      </div>
                      {selectedBank ? `Upload ${selectedBank.name} Statements` : "Upload Bank Statements"}
                    </CardTitle>
                    {totalTransactions > 0 && (
                      <Button
                        onClick={exportTransactions}
                        variant="outline"
                        size="sm"
                        className="border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50 bg-transparent backdrop-blur-sm transition-all duration-300 h-8 px-3 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enhanced Upload Area */}
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group cursor-pointer",
                      dragActive
                        ? "border-[#BEF397] bg-gradient-to-br from-[#BEF397]/10 to-[#7DD3FC]/5 scale-[1.02]"
                        : "border-zinc-600/50 hover:border-zinc-500 hover:bg-zinc-800/20",
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                          dragActive
                            ? "bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] scale-110"
                            : "bg-zinc-800/50 group-hover:bg-zinc-700/50",
                        )}
                        animate={dragActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Upload className={cn("w-8 h-8", dragActive ? "text-black" : "text-zinc-400")} />
                      </motion.div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">
                          {dragActive
                            ? "Drop your PDF files here"
                            : selectedBank
                              ? `Drop your ${selectedBank.name} statements here`
                              : "Drag & drop your bank statements"}
                        </h3>
                        <p className="text-zinc-400 text-sm">or click to browse files</p>
                        <div className="inline-flex items-center justify-center rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-6 py-2 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-lg hover:scale-105 cursor-pointer">
                          <Plus className="w-4 h-4 mr-2" />
                          Choose PDF Files
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>PDF files only</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Max 15MB each</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>100% secure</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Continue Button - Right below drag and drop */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                  >
                    <Button
                      onClick={handleContinue}
                      disabled={!canContinue}
                      className={cn(
                        "h-12 px-8 text-base font-semibold transition-all duration-500 rounded-xl",
                        canContinue
                          ? "bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-xl hover:shadow-[#BEF397]/20 transform hover:scale-105"
                          : "bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-700/30",
                      )}
                    >
                      {canContinue ? (
                        <>
                          Continue to Dashboard
                          <CheckCircle className="ml-2 w-5 h-5" />
                        </>
                      ) : (
                        <>
                          Upload statements to continue
                          <Upload className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                    {canContinue && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-zinc-400 text-sm mt-3"
                      >
                        {totalTransactions} transactions • {actualDeductions} deductions found • $
                        {totalDeductionAmount.toLocaleString()} potential savings
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Current Upload Progress - Scrollable */}
                  {files.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#BEF397]/10 rounded flex items-center justify-center">
                          <Upload className="w-3 h-3 text-[#BEF397]" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Processing Files</h3>
                        <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 text-xs h-4">
                          {files.length}
                        </Badge>
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        <div className="space-y-3">
                          <AnimatePresence>
                            {files.map((file, index) => (
                              <motion.div
                                key={file.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className="group flex items-center gap-3 p-4 bg-gradient-to-r from-zinc-800/40 to-zinc-800/20 rounded-lg border border-zinc-700/40 hover:border-zinc-600/50 transition-all duration-300"
                              >
                                <div className="flex-shrink-0">
                                  {file.status === "completed" ? (
                                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                    </div>
                                  ) : file.status === "error" ? (
                                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                      <AlertCircle className="w-4 h-4 text-red-400" />
                                    </div>
                                  ) : file.status === "processing" ? (
                                    <div className="w-8 h-8 bg-[#BEF397]/10 rounded-lg flex items-center justify-center">
                                      <Loader2 className="w-4 h-4 text-[#BEF397] animate-spin" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 bg-[#7DD3FC]/10 rounded-lg flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-[#7DD3FC]" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-white font-medium truncate text-sm">{file.file.name}</p>
                                    <div className="flex items-center gap-2">
                                      {file.status === "completed" && file.transactions && (
                                        <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30 text-xs">
                                          {file.transactions.length} transactions
                                        </Badge>
                                      )}
                                      {file.bankType && (
                                        <Badge className="bg-[#7DD3FC]/20 text-[#7DD3FC] border-[#7DD3FC]/30 text-xs">
                                          {file.bankType.toUpperCase()}
                                        </Badge>
                                      )}
                                      {file.status === "error" && (
                                        <Button
                                          onClick={() => retryFile(file.id)}
                                          size="sm"
                                          variant="outline"
                                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 bg-transparent h-6 px-2 text-xs"
                                        >
                                          Retry
                                        </Button>
                                      )}
                                      <button
                                        onClick={() => removeFile(file.id)}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-all duration-300 p-1 hover:bg-red-500/10 rounded"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                                    <span>{formatFileSize(file.file.size)}</span>
                                    {file.status === "uploading" && (
                                      <>
                                        <span>•</span>
                                        <span className="text-[#7DD3FC]">Uploading {Math.round(file.progress)}%</span>
                                      </>
                                    )}
                                    {file.status === "processing" && (
                                      <>
                                        <span>•</span>
                                        <span className="text-[#BEF397] flex items-center gap-1">
                                          <Zap className="w-2 h-2" />
                                          AI Processing...
                                        </span>
                                      </>
                                    )}
                                    {file.status === "completed" && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-400">Complete</span>
                                      </>
                                    )}
                                    {file.status === "error" && (
                                      <>
                                        <span>•</span>
                                        <span className="text-red-400">Failed</span>
                                      </>
                                    )}
                                  </div>
                                  {file.status === "uploading" && <Progress value={file.progress} className="h-1" />}
                                  {file.status === "error" && file.error && (
                                    <p className="text-red-400 text-xs mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                                      {file.error}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* File History Sidebar - Scrollable */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-1"
            >
              <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/70 backdrop-blur-2xl border border-zinc-700/40 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#7DD3FC]/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#7DD3FC]" />
                    </div>
                    File History
                    {previousStatements.length > 0 && (
                      <Badge className="bg-[#7DD3FC]/20 text-[#7DD3FC] border-[#7DD3FC]/30 text-xs">
                        {previousStatements.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {previousStatements.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-zinc-800/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-6 h-6 text-zinc-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-2">No Files Yet</h3>
                      <p className="text-zinc-400 text-xs max-w-xs mx-auto">
                        Previously uploaded files will appear here for easy management.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto custom-scrollbar pr-2">
                      <div className="space-y-3">
                        {previousStatements.map((statement, index) => (
                          <motion.div
                            key={statement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex items-start gap-3 p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:border-zinc-600/50 transition-all duration-300"
                          >
                            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate mb-2">{statement.name}</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-2 h-2" />
                                    <span>{new Date(statement.uploadedAt).toLocaleDateString("en-AU")}</span>
                                  </div>
                                  {statement.bankType && (
                                    <>
                                      <span>•</span>
                                      <Badge className="bg-[#7DD3FC]/20 text-[#7DD3FC] border-[#7DD3FC]/30 text-xs h-3 px-1">
                                        {statement.bankType.toUpperCase()}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <span>{statement.transactionCount} transactions</span>
                                  <span>•</span>
                                  <span>{formatFileSize(statement.size)}</span>
                                </div>
                                {statement.processingTime && (
                                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                                    <Clock className="w-2 h-2" />
                                    <span>Processed in {formatProcessingTime(statement.processingTime)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removePreviousStatement(statement.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-all duration-300 p-1 hover:bg-red-500/10 rounded flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Error Summary */}
        {errorFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 max-w-6xl mx-auto"
          >
            <Alert className="border-red-800/50 bg-gradient-to-r from-red-900/20 to-red-800/10 backdrop-blur-sm rounded-xl py-3">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">
                <strong>{errorFiles.length} file(s) failed to process.</strong> Please check the files and try again, or
                contact support if the issue persists.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(161, 161, 170, 0.4) rgba(39, 39, 42, 0.2);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.2);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(161, 161, 170, 0.4);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 161, 170, 0.6);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: rgba(161, 161, 170, 0.8);
        }
      `}</style>
    </div>
  )
}
