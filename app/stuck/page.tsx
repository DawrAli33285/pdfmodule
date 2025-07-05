"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function StuckPage() {
  const router = useRouter()
  const [userId, setUserId] = useState("")

  const handleContinue = () => {
    if (userId.trim()) {
      localStorage.setItem("basiq_user_id", userId)
      router.push(`/success?userId=${userId}`)
    } else {
      // Try to get from localStorage
      const storedUserId = localStorage.getItem("basiq_user_id")
      if (storedUserId) {
        router.push(`/success?userId=${storedUserId}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <span>Stuck on Consent Page?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">If you're stuck on consent.basiq.io/status:</h3>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Close that tab/window</li>
                <li>Come back to this page</li>
                <li>Click "Continue to My Accounts" below</li>
              </ol>
            </div>

            <div>
              <Label htmlFor="userId">User ID (Optional)</Label>
              <Input
                id="userId"
                placeholder="Enter your User ID if you have it"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if you don't know it - we'll try to find it automatically
              </p>
            </div>

            <Button onClick={handleContinue} className="w-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              Continue to My Accounts
            </Button>

            <div className="text-center">
              <Button onClick={() => router.push("/")} variant="outline" size="sm">
                Start Over Instead
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-1">Why does this happen?</h4>
              <p className="text-xs text-blue-700">
                Sometimes the Basiq consent page doesn't automatically redirect back to our app. This is a known issue
                with some browsers and security settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
