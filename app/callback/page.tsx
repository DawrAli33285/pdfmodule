"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function CallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState("processing")

  useEffect(() => {
    // Get userId from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const userId = urlParams.get("userId")

    console.log("Callback page loaded with userId:", userId)

    if (userId) {
      // Store userId in localStorage
      localStorage.setItem("basiq_user_id", userId)

      // Show success message briefly then redirect
      setStatus("success")

      setTimeout(() => {
        router.push(`/success?userId=${userId}`)
      }, 2000)
    } else {
      // No userId, redirect to home
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <Card className="bg-gray-900 border-gray-700 max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          {status === "processing" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-400" />
              <h2 className="text-xl font-bold mb-2">Processing Connection...</h2>
              <p className="text-gray-400">Please wait while we complete your bank connection.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <h2 className="text-xl font-bold mb-2 text-green-400">Connection Successful!</h2>
              <p className="text-gray-400">Redirecting you to view your accounts...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
