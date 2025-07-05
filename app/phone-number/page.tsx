"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Smartphone, Shield, Zap, AlertCircle, Loader2, ArrowLeft, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const countries = [
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
]

export default function PhoneNumberPage() {
  const router = useRouter()
  const [mobile, setMobile] = useState("")
  const [selectedCountry, setSelectedCountry] = useState(countries[0]) // Australia by default
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load saved mobile number from localStorage
    const savedMobile = localStorage.getItem("user_phone") || localStorage.getItem("onboarding_phone")
    if (savedMobile) {
      // Extract country code and number
      const country = countries.find((c) => savedMobile.startsWith(c.code))
      if (country) {
        setSelectedCountry(country)
        setMobile(savedMobile.replace(country.code, ""))
      } else {
        setMobile(savedMobile)
      }
    }
  }, [])

  const handleContinue = async () => {
    if (!mobile.trim()) {
      setError("Please enter your mobile number")
      return
    }

    // Basic mobile number validation (without country code)
    const mobileRegex = /^[0-9]{8,15}$/
    if (!mobileRegex.test(mobile.trim().replace(/\s/g, ""))) {
      setError("Please enter a valid mobile number")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Combine country code with mobile number
      const fullNumber = selectedCountry.code + mobile.trim().replace(/\s/g, "")

      // Store the phone number
      localStorage.setItem("user_phone", fullNumber)
      localStorage.setItem("onboarding_phone", fullNumber)

      console.log("Phone number saved:", fullNumber)

      // Navigate to connect bank page
      router.push("/connect-bank")
    } catch (error) {
      console.error("Error saving phone number:", error)
      setError("There was an error saving your phone number. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
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
              <Smartphone className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-[#BEF397] text-3xl font-bold tracking-wide">moulai.</h1>
          </div>
          <p className="text-zinc-400 mt-2">Secure mobile verification</p>
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
                  <Smartphone className="w-10 h-10 text-[#BEF397]" />
                </div>
                <CardTitle className="text-3xl font-bold text-white mb-3">Verify Your Mobile</CardTitle>
                <p className="text-zinc-400 text-lg">
                  We need your mobile number to securely connect your bank accounts and send important notifications.
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
                    <h3 className="font-semibold text-white mb-1">Secure Verification</h3>
                    <p className="text-zinc-400 text-sm">SMS-based identity verification</p>
                  </div>
                  <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <Zap className="w-8 h-8 text-[#7DD3FC] mx-auto mb-2" />
                    <h3 className="font-semibold text-white mb-1">Quick Setup</h3>
                    <p className="text-zinc-400 text-sm">Fast account creation process</p>
                  </div>
                  <div className="text-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    <Smartphone className="w-8 h-8 text-[#E5B1FD] mx-auto mb-2" />
                    <h3 className="font-semibold text-white mb-1">Stay Informed</h3>
                    <p className="text-zinc-400 text-sm">Important updates & notifications</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mobile" className="text-white text-base font-medium">
                      Mobile Number
                    </Label>
                    <div className="mt-2 flex">
                      {/* Country Code Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="h-12 px-3 bg-zinc-800/50 border border-zinc-700 border-r-0 rounded-l-xl text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 min-w-[100px]"
                        >
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm">{selectedCountry.code}</span>
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        </button>

                        {showDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                            {countries.map((country) => (
                              <button
                                key={country.code}
                                onClick={() => {
                                  setSelectedCountry(country)
                                  setShowDropdown(false)
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors flex items-center gap-3",
                                  selectedCountry.code === country.code && "bg-zinc-700",
                                )}
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm text-zinc-300">{country.code}</span>
                                <span className="text-sm text-zinc-400">{country.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Phone Number Input */}
                      <Input
                        id="mobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Enter your mobile number"
                        className="h-12 bg-zinc-800/50 border-zinc-700 border-l-0 text-white placeholder:text-zinc-500 rounded-r-xl rounded-l-none focus:border-[#BEF397] focus:ring-[#BEF397] flex-1"
                      />
                    </div>
                    <p className="text-zinc-500 text-sm mt-1">Enter your mobile number without the country code</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                  <h3 className="font-semibold text-white text-sm mb-2">Why do we need your mobile number?</h3>
                  <ul className="space-y-1 text-zinc-400 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#BEF397] rounded-full" />
                      Required by Basiq for secure bank account connection
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#BEF397] rounded-full" />
                      SMS verification for account security
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#BEF397] rounded-full" />
                      Important notifications about your tax deductions
                    </li>
                  </ul>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={handleContinue}
                    disabled={loading || !mobile.trim()}
                    className="flex-1 h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue to Bank Connection
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="text-center pt-4 border-t border-zinc-800">
                  <p className="text-zinc-400 text-sm">
                    🔒 Your mobile number is encrypted and never shared with third parties. We use it only for account
                    verification and important notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
