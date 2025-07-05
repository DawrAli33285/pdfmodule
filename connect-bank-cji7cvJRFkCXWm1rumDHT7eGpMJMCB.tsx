"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Smartphone, Shield, Zap, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BasiqConsentPopup } from "@/app/components/basiq-consent-popup"
import { motion } from "framer-motion"

export default function ConnectBankPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConsentPopup, setShowConsentPopup] = useState(false)
  const [authUrl, setAuthUrl] = useState("")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    // Load saved data from localStorage
    const savedEmail = localStorage.getItem("onboarding_email") || localStorage.getItem("basiq_user_email")
    const savedMobile = localStorage.getItem("onboarding_phone") || localStorage.getItem("basiq_user_mobile")

    if (savedEmail) setEmail(savedEmail)
    if (savedMobile) setMobile(savedMobile)

    console.log("ConnectBank - Loaded saved data:", { email: savedEmail, mobile: savedMobile })
  }, [])

  const handleConnect = async () => {
    if (!email.trim() || !mobile.trim()) {
      setError("Please enter both email and mobile number")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("=== CONNECTING BANK ACCOUNT ===")
      console.log("Email:", email)
      console.log("Mobile:", mobile)

      const response = await fetch("/api/basiq/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          mobile: mobile.trim(),
        }),
      })

      const data = await response.json()
      console.log("Connect response:", data)

      if (data.success) {
        // Store user details in localStorage with multiple keys for compatibility
        localStorage.setItem("basiq_user_id", data.userId)
        localStorage.setItem("basiqUserId", data.userId) // Alternative key
        localStorage.setItem("userId", data.userId) // Alternative key
        localStorage.setItem("user_id", data.userId) // Alternative key

        localStorage.setItem("basiq_user_email", email.trim())
        localStorage.setItem("basiq_user_mobile", mobile.trim())
        localStorage.setItem("onboarding_email", email.trim())
        localStorage.setItem("onboarding_phone", mobile.trim())

        console.log("=== STORED USER DATA ===")
        console.log("User ID:", data.userId)
        console.log("Auth URL:", data.authUrl)

        // Set up consent popup
        setUserId(data.userId)
        setAuthUrl(data.authUrl)
        setShowConsentPopup(true)
      } else {
        throw new Error(data.error || "Failed to connect bank account")
      }
    } catch (error) {
      console.error("Error connecting bank:", error)
      setError(error instanceof Error ? error.message : "Failed to connect bank account")
    } finally {
      setLoading(false)
    }
  }

  const handleConsentSuccess = () => {
    console.log("=== CONSENT SUCCESS ===")
    localStorage.setItem("bank_connected", "true")
    localStorage.setItem("onboarding_complete", "true")

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent("bankConnected", { detail: { userId } }))

    router.push("/select-accounts")
  }

  const handleConsentClose = () => {
    setShowConsentPopup(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-[#BEF397]/10 to-[#7DD3FC]/10 blur-xl"
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
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-[#BEF397] text-3xl font-bold tracking-wide">moulai.</h1>
          </div>
          <p className="text-zinc-400 mt-2">Secure bank account connection</p>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <Card className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl shadow-black/20">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#BEF397]/30">
                  <Shield className="w-10 h-10 text-[#BEF397]" />
                </div>
                <CardTitle className="text-3xl font-bold text-white mb-3">Connect Your Bank</CardTitle>
                <p className="text-zinc-400 text-lg">
                  Securely connect your bank accounts to automatically categorize your transactions and find tax
                  deductions.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <Alert className="border-red-800 bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <Shield className="w-8 h-8 text-[#BEF397] mx-auto mb-2" />
                    <h3 className="font-semibold text-white mb-1">Bank-Grade Security</h3>
                    <p className="text-zinc-400 text-sm">256-bit encryption & read-only access</p>
                  </div>
                  <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <Zap className="w-8 h-8 text-[#7DD3FC] mx-auto mb-2" />
                    <h3 className="font-semibold text-white mb-1">Instant Analysis</h3>
                    <p className="text-zinc-400 text-sm">AI-powered transaction categorization</p>
                  </div>
                  <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <Smartphone className="w-8 h-8 text-[#E5B1FD] mx-auto mb-2" />
                    <h3 className="font-semibold text-white mb-1">Mobile Verified</h3>
                    <p className="text-zinc-400 text-sm">SMS verification for extra security</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-white text-base font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="mt-2 h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl focus:border-[#BEF397] focus:ring-[#BEF397]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile" className="text-white text-base font-medium">
                      Mobile Number
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter your mobile number (e.g., +61400000000)"
                      className="mt-2 h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl focus:border-[#BEF397] focus:ring-[#BEF397]"
                    />
                    <p className="text-zinc-500 text-sm mt-1">Include country code (e.g., +61 for Australia)</p>
                  </div>
                </div>

                {/* Connect Button */}
                <Button
                  onClick={handleConnect}
                  disabled={loading || !email.trim() || !mobile.trim()}
                  className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Bank Account
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="text-center pt-4 border-t border-zinc-800">
                  <p className="text-zinc-400 text-sm">
                    🔒 Your banking credentials are never stored. We use Basiq's secure API for read-only access to your
                    transaction data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Basiq Consent Popup */}
      <BasiqConsentPopup
        isOpen={showConsentPopup}
        onClose={handleConsentClose}
        authUrl={authUrl}
        userId={userId}
        onSuccess={handleConsentSuccess}
      />
    </div>
  )
}
