"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AuthLinkPage() {
  const params = useParams()
  const router = useRouter()
  const authId = params.authId as string
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showManualOptions, setShowManualOptions] = useState(false)

  useEffect(() => {
    console.log("Auth Link Page - Auth ID from URL:", authId)

    // Get userId from localStorage
    const storedUserId = localStorage.getItem("basiq_user_id")
    if (storedUserId) {
      setUserId(storedUserId)
    }

    if (!authId) {
      setError("Auth ID is required")
      setRedirecting(false)
      return
    }

    // Validate auth ID format (should be a UUID-like string)
    if (authId.length < 10) {
      setError("Invalid Auth ID format")
      setRedirecting(false)
      return
    }

    // Start polling for consent completion
    if (storedUserId) {
      startConsentPolling(storedUserId)
    }

    // Redirect to the actual Basiq Connect URL
    const basiqConnectUrl = `https://connect.basiq.io/${authId}?action=connect`
    console.log("Redirecting to Basiq Connect:", basiqConnectUrl)

    // Small delay to show the redirect message
    setTimeout(() => {
      window.location.href = basiqConnectUrl
    }, 2000)

    // Show manual options after 30 seconds
    setTimeout(() => {
      setShowManualOptions(true)
    }, 30000)
  }, [authId])

  const startConsentPolling = (userId: string) => {
    console.log("Starting consent polling for user:", userId)

    const pollInterval = setInterval(async () => {
      try {
        console.log("Checking consent status...")
        const response = await fetch(`/api/users/${userId}/consents`)

        if (response.ok) {
          const data = await response.json()
          console.log("Consent data:", data)

          // Check if we have any active consents
          if (data.data && data.data.length > 0) {
            const activeConsents = data.data.filter(
              (consent: any) => consent.status === "active" || consent.status === "granted",
            )

            if (activeConsents.length > 0) {
              console.log("Active consent found! Redirecting to success page...")
              clearInterval(pollInterval)

              // Redirect to success page
              setTimeout(() => {
                window.location.href = `/success?userId=${userId}`
              }, 1000)
            }
          }
        }
      } catch (error) {
        console.error("Error checking consent status:", error)
      }
    }, 5000) // Check every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      console.log("Stopped consent polling after timeout")
    }, 600000)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Auth ID: {authId || "Not provided"}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting to Basiq Connect</h2>
          <p className="text-gray-600 mb-4">You will be redirected to the Basiq Connect interface...</p>
          <p className="text-sm text-gray-500 mb-4">Auth ID: {authId}</p>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next:</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>📱 You'll receive an SMS with a verification code</li>
              <li>🏦 Select your bank from the list</li>
              <li>🔐 Complete the consent process</li>
              <li>✅ You'll be automatically redirected back here</li>
            </ul>
          </div>

          <div className="space-y-2">
            <a
              href={`https://connect.basiq.io/${authId}?action=connect`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Continue to Basiq Connect →
            </a>

            {showManualOptions && (
              <Card className="mt-6 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Stuck on the consent page?</h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    If you've completed the bank connection but are stuck on the Basiq consent page, you can manually
                    continue:
                  </p>
                  <div className="space-y-2">
                    {userId && (
                      <Button
                        onClick={() => router.push(`/success?userId=${userId}`)}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        I've completed the connection - Show my accounts
                      </Button>
                    )}
                    <Button
                      onClick={() => router.push("/")}
                      variant="outline"
                      className="w-full border-yellow-300 text-yellow-700"
                    >
                      Start over
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
