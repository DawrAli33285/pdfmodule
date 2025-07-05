"use client"

import { useState } from "react"
import { BasiqConsentPopup } from "@/app/components/basiq-consent-popup"
// ... your existing imports

export default function YourLoginPage() {
  // ... your existing state
  const [showBasiqPopup, setShowBasiqPopup] = useState(false)
  const [basiqResult, setBasiqResult] = useState<any>(null)
  const [userEmail, setUserEmail] = useState("")
  const [userMobile, setUserMobile] = useState("")

  // Add Basiq connection function
  const handleBasiqConnection = async (email: string, mobile: string) => {
    try {
      const response = await fetch("/api/complete-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mobile }),
      })

      if (!response.ok) throw new Error("Failed to create Basiq connection")

      const data = await response.json()
      localStorage.setItem("basiq_user_id", data.user.id)
      setBasiqResult(data)
      setShowBasiqPopup(true)
    } catch (error) {
      console.error("Basiq connection error:", error)
    }
  }

  const handleBasiqSuccess = () => {
    // Redirect to accounts page or your desired flow
    window.location.href = `/accounts?userId=${basiqResult.user.id}`
  }

  return (
    <div>
      {/* Your existing login form */}

      {/* Add Basiq connection button */}
      <button
        onClick={() => handleBasiqConnection(userEmail, userMobile)}
        className="bg-green-400 text-black px-4 py-2 rounded"
      >
        Connect Bank Account
      </button>

      {/* Basiq Popup */}
      {showBasiqPopup && basiqResult && (
        <BasiqConsentPopup
          isOpen={showBasiqPopup}
          onClose={() => setShowBasiqPopup(false)}
          authUrl={basiqResult.frontend_url}
          userId={basiqResult.user.id}
          onSuccess={handleBasiqSuccess}
        />
      )}
    </div>
  )
}
