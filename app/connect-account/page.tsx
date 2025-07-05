"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Bug } from "lucide-react"
import { BankSelectionPopup } from "@/components/bank-selection-popup"

interface ProcessingResult {
  success: boolean
  bank?: string
  transactionCount?: number
  transactions?: any[]
  metadata?: {
    fileName: string
    textLength: number
    processingDate: string
  }
  error?: string
  debugInfo?: any
}

export default function ConnectAccountPage() {
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [showBankPopup, setShowBankPopup] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBankSelect = (bank: string) => {
    console.log("🏦 Frontend: Bank selected:", bank)
    setSelectedBank(bank)
    setShowBankPopup(false)

    // Automatically trigger file upload after bank selection
    setTimeout(() => {
      if (fileInputRef.current) {
        console.log("📁 Frontend: Triggering file input...")
        fileInputRef.current.click()
      }
    }, 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log("📁 Frontend: File selected:")
    console.log("  - Name:", file?.name)
    console.log("  - Size:", file?.size, "bytes")
    console.log("  - Type:", file?.type)
    console.log("  - Last modified:", file?.lastModified ? new Date(file.lastModified).toISOString() : "Unknown")

    if (file && selectedBank) {
      setUploadedFile(file)
      handleFileUpload(file, selectedBank)
    } else {
      console.log("❌ Frontend: Missing file or bank selection")
      console.log("  - File:", !!file)
      console.log("  - Bank:", selectedBank)
    }
  }

  const handleFileUpload = async (file: File, bankType: string) => {
    console.log("🚀 Frontend: Starting file upload process...")
    console.log("  - File:", file.name)
    console.log("  - Size:", (file.size / 1024 / 1024).toFixed(2), "MB")
    console.log("  - Bank:", bankType)
    console.log("  - Timestamp:", new Date().toISOString())

    setIsProcessing(true)
    setProcessingResult(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bankType", bankType)

      console.log("📤 Frontend: FormData created, sending request to /api/parse-pdf...")
      console.log("  - FormData entries:")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`    ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
        } else {
          console.log(`    ${key}: ${value}`)
        }
      }

      // Make the API call
      const startTime = Date.now()
      console.log("⏱️ Frontend: Request started at", new Date(startTime).toISOString())

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      })

      const endTime = Date.now()
      const duration = endTime - startTime
      console.log("📥 Frontend: Response received:")
      console.log("  - Status:", response.status)
      console.log("  - Status Text:", response.statusText)
      console.log("  - OK:", response.ok)
      console.log("  - Duration:", duration, "ms")
      console.log("  - Headers:", Object.fromEntries(response.headers.entries()))

      // Parse response - FIX: Read response text only once
      let result: ProcessingResult
      let responseText: string

      try {
        responseText = await response.text()
        console.log("📄 Frontend: Raw response text length:", responseText.length)
        console.log("📄 Frontend: Raw response preview:", responseText.substring(0, 500))

        result = JSON.parse(responseText)
        console.log("📊 Frontend: Parsed response:")
        console.log("  - Success:", result.success)
        console.log("  - Transaction count:", result.transactionCount)
        console.log("  - Error:", result.error)
        console.log("  - Debug info:", result.debugInfo)
      } catch (parseError) {
        console.error("❌ Frontend: Failed to parse response JSON:", parseError)
        result = {
          success: false,
          error: "Failed to parse server response",
          debugInfo: {
            step: "response_parsing",
            parseError: (parseError as Error).message,
            responseStatus: response.status,
            responseText: responseText || "Unable to read response", // Use already read text
          },
        }
      }

      if (result.transactions && result.transactions.length > 0) {
        console.log("💰 Frontend: Sample transactions:")
        result.transactions.slice(0, 3).forEach((tx: any, i: number) => {
          console.log(`  ${i + 1}. ${tx.date} | ${tx.description?.substring(0, 30)}... | $${tx.amount}`)
        })
      }

      setProcessingResult(result)

      if (result.success) {
        console.log("✅ Frontend: Storing results in localStorage...")
        try {
          localStorage.setItem("extractedTransactions", JSON.stringify(result.transactions))
          localStorage.setItem("processingMetadata", JSON.stringify(result.metadata))
          console.log("💾 Frontend: Results stored successfully")
        } catch (storageError) {
          console.error("❌ Frontend: Failed to store in localStorage:", storageError)
        }
      } else {
        console.log("❌ Frontend: Processing failed:", result.error)
      }
    } catch (error) {
      console.error("💥 Frontend: Network/fetch error:", error)
      console.error("Error type:", typeof error)
      console.error("Error name:", (error as Error)?.name)
      console.error("Error message:", (error as Error)?.message)
      console.error("Error stack:", (error as Error)?.stack)

      setProcessingResult({
        success: false,
        error: `Network error: ${(error as Error).message}`,
        debugInfo: {
          step: "network_error",
          errorType: typeof error,
          errorName: (error as Error)?.name,
          errorMessage: (error as Error)?.message,
        },
      })
    } finally {
      setIsProcessing(false)
      console.log("🏁 Frontend: File upload process completed")
    }
  }

  const handleRetry = () => {
    console.log("🔄 Frontend: Retrying - resetting state...")
    setProcessingResult(null)
    setUploadedFile(null)
    setSelectedBank("")
    setShowDebugInfo(false)
  }

  const handleViewTransactions = () => {
    console.log("👀 Frontend: Navigating to transactions page...")
    window.location.href = "/transactions"
  }

  const handleUploadAnother = () => {
    console.log("📁 Frontend: Triggering another file upload...")
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Bank Account</h1>
          <p className="text-gray-600">
            Upload your bank statement to automatically extract and categorize transactions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Section */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Upload className="h-6 w-6" />
                Upload Bank Statement
              </CardTitle>
              <CardDescription>Select your bank and upload a PDF statement to get started</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {!selectedBank ? (
                <Button onClick={() => setShowBankPopup(true)} className="w-full" size="lg">
                  Select Your Bank
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Selected: <span className="font-semibold">{selectedBank.toUpperCase()}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUploadAnother} className="flex-1">
                      Upload PDF
                    </Button>
                    <Button onClick={() => setShowBankPopup(true)} variant="outline">
                      Change Bank
                    </Button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />

              {uploadedFile && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  File: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Processing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isProcessing && !processingResult && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a bank and upload your statement to begin</p>
                  <p className="text-xs text-gray-400 mt-2">Open browser console (F12) for detailed logs</p>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-blue-600 font-medium">Processing your statement...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Using {selectedBank.toUpperCase()} parser to extract transactions
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Check browser console for detailed logs</p>
                </div>
              )}

              {processingResult && (
                <div className="space-y-4">
                  {processingResult.success ? (
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-semibold text-green-700 mb-2">Processing Complete!</h3>
                      <div className="bg-green-50 p-4 rounded-lg text-left">
                        <p className="text-sm text-green-700">
                          <strong>Bank:</strong> {processingResult.bank}
                        </p>
                        <p className="text-sm text-green-700">
                          <strong>Transactions:</strong> {processingResult.transactionCount}
                        </p>
                        <p className="text-sm text-green-700">
                          <strong>File:</strong> {processingResult.metadata?.fileName}
                        </p>
                        <p className="text-sm text-green-700">
                          <strong>Text Length:</strong> {processingResult.metadata?.textLength} characters
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleViewTransactions} className="flex-1">
                          View Transactions
                        </Button>
                        <Button onClick={handleRetry} variant="outline" className="flex-1 bg-transparent">
                          Upload Another
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                      <h3 className="text-lg font-semibold text-red-700 mb-2">Processing Failed</h3>
                      <div className="bg-red-50 p-4 rounded-lg text-left">
                        <p className="text-sm text-red-700 mb-2">{processingResult.error}</p>
                        {processingResult.debugInfo && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDebugInfo(!showDebugInfo)}
                              className="flex items-center gap-1"
                            >
                              <Bug className="h-3 w-3" />
                              {showDebugInfo ? "Hide" : "Show"} Debug Info
                            </Button>
                            {showDebugInfo && (
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(processingResult.debugInfo, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                      <Button onClick={handleRetry} className="mt-4 w-full">
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supported Banks */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Supported Banks</CardTitle>
            <CardDescription>We support automatic parsing for these major Australian banks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Westpac", "ANZ", "CBA", "Amex"].map((bank) => (
                <div key={bank} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center border">
                    <span className="text-xs font-bold text-gray-600">{bank}</span>
                  </div>
                  <p className="text-sm font-medium">{bank}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Selection Popup */}
      <BankSelectionPopup
        isOpen={showBankPopup}
        onClose={() => setShowBankPopup(false)}
        onBankSelect={handleBankSelect}
      />
    </div>
  )
}
