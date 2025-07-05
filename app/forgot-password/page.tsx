"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, ArrowLeft, Sparkles, Clock, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [resendCountdown, setResendCountdown] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setCanResend(false)
        setResendCountdown(60)

        // Start countdown timer
        const timer = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              setCanResend(true)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || "Failed to send reset email")
      }
    } catch (err) {
      console.error("Forgot password error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    if (canResend) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
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

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-xl flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-[#BEF397] text-4xl font-bold tracking-wide">moulai.</h1>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold text-white">
                {success ? "Check Your Email" : "Reset Password"}
              </CardTitle>
              <p className="text-zinc-400 mt-2">
                {success ? "We've sent you a password reset link" : "Enter your email to receive a reset link"}
              </p>
            </CardHeader>

            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                {!success ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white">Email address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-12 h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-[#BEF397] focus:ring-[#BEF397]/20 rounded-xl text-base"
                          />
                        </div>
                      </div>

                      {/* Error Message */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <Alert className="border-red-500/50 bg-red-500/10 rounded-xl">
                              <AlertDescription className="text-red-400">{error}</AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-2xl hover:shadow-[#BEF397]/20 transition-all duration-300 disabled:opacity-50 rounded-xl group"
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Sending Reset Link...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            Send Reset Link
                            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </Button>

                      {/* Back to Login */}
                      <div className="text-center">
                        <Link
                          href="/onboarding/welcome"
                          className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#BEF397] transition-colors text-sm font-medium"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Sign In
                        </Link>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center space-y-6"
                  >
                    {/* Success Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle className="w-10 h-10 text-black" />
                    </motion.div>

                    {/* Success Message */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white">Email Sent Successfully!</h3>
                      <p className="text-zinc-400 leading-relaxed">
                        We've sent a password reset link to <span className="text-[#BEF397] font-medium">{email}</span>
                      </p>
                      <p className="text-sm text-zinc-500">
                        Check your inbox and click the link to reset your password. The link will expire in 1 hour.
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50">
                      <h4 className="text-white font-semibold mb-2">What's next?</h4>
                      <ul className="text-sm text-zinc-400 space-y-1 text-left">
                        <li>• Check your email inbox (and spam folder)</li>
                        <li>• Click the "Reset Password" link</li>
                        <li>• Create a new secure password</li>
                        <li>• Sign in with your new password</li>
                      </ul>
                    </div>

                    {/* Resend Button */}
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-500">Didn't receive the email?</p>
                      <Button
                        onClick={handleResend}
                        disabled={!canResend || loading}
                        variant="outline"
                        className="w-full h-12 bg-zinc-800/50 border-zinc-700/50 text-white hover:bg-zinc-700/50 disabled:opacity-50 rounded-xl"
                      >
                        {!canResend ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Resend in {resendCountdown}s
                          </div>
                        ) : (
                          "Resend Email"
                        )}
                      </Button>
                    </div>

                    {/* Back to Login */}
                    <div className="pt-4">
                      <Link
                        href="/onboarding/welcome"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#BEF397] transition-colors text-sm font-medium"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
