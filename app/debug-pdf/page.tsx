"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function DebugPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [processing, setProcessing] = useState(false)

  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedFile.type.includes("pdf")) {
      alert("Please upload a PDF file")
      return
    }

    setProcessing(true)
    setExtractedText("")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.textSample) {
        setExtractedText(result.textSample)
      } else if (result.error) {
        setExtractedText(`Error: ${result.error}`)
      } else {
        setExtractedText("No text extracted")
      }
    } catch (error) {
      setExtractedText(`Error: ${error}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  setFile(selectedFile)
                }
              }}
              className="mb-4"
            />

            {file && (
              <Button onClick={() => handleFileUpload(file)} disabled={processing}>
                {processing ? "Processing..." : "Extract Text"}
              </Button>
            )}
          </div>

          {extractedText && (
            <div>
              <h3 className="font-semibold mb-2">Extracted Text:</h3>
              <Textarea value={extractedText} readOnly className="h-96 font-mono text-sm" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
