"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Sparkles, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  // Password strength validation
  const getPasswordStrength = (pwd: string) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
    }

    const score = Object.values(checks).filter(Boolean).length
    return { checks, score }
  }

  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        setValidatingToken(false)
        return
      }

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: "validate-only" }),
        })

        const data = await response.json()

        if (response.status === 400 && data.error?.includes("token")) {
          setTokenValid(false)
        } else {
          setTokenValid(true)
        }
      } catch (err) {
        console.error("Token validation error:", err)
        setTokenValid(false)
      } finally {
        setValidatingToken(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (passwordStrength.score < 3) {
      setError("Password must contain at least 8 characters with uppercase, lowercase, and numbers")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/onboarding/welcome")
        }, 3000)
      } else {
        setError(data.error || "Failed to reset password")
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BEF397] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Validating reset link...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl">
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                  This password reset link is invalid or has expired. Reset links are only valid for 1 hour.
                </p>

                <div className="space-y-4">
                  <Link href="/forgot-password">
                    <Button className="w-full h-12 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-2xl hover:shadow-[#BEF397]/20 transition-all duration-300 rounded-xl">
                      Request New Reset Link
                    </Button>
                  </Link>

                  <Link href="/onboarding/welcome">
                    <Button
                      variant="outline"
                      className="w-full h-12 bg-zinc-800/50 border-zinc-700/50 text-white hover:bg-zinc-700/50 rounded-xl"
                    >
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
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
                {success ? "Password Reset!" : "Create New Password"}
              </CardTitle>
              <p className="text-zinc-400 mt-2">
                {success ? "Your password has been successfully reset" : "Enter your new secure password"}
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
                      {/* New Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-12 pr-12 h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-[#BEF397] focus:ring-[#BEF397]/20 rounded-xl text-base"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {password && (
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded-full transition-colors ${
                                    passwordStrength.score >= level
                                      ? passwordStrength.score === 4
                                        ? "bg-green-500"
                                        : passwordStrength.score === 3
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      : "bg-zinc-700"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="text-xs space-y-1">
                              {Object.entries(passwordStrength.checks).map(([key, valid]) => (
                                <div
                                  key={key}
                                  className={`flex items-center gap-2 ${valid ? "text-green-400" : "text-zinc-500"}`}
                                >
                                  <div className={`w-1 h-1 rounded-full ${valid ? "bg-green-400" : "bg-zinc-500"}`} />
                                  {key === "length" && "At least 8 characters"}
                                  {key === "uppercase" && "One uppercase letter"}
                                  {key === "lowercase" && "One lowercase letter"}
                                  {key === "number" && "One number"}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="pl-12 pr-12 h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-[#BEF397] focus:ring-[#BEF397]/20 rounded-xl text-base"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Password Match Indicator */}
                        {confirmPassword && (
                          <div
                            className={`text-xs flex items-center gap-2 ${
                              password === confirmPassword ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${
                                password === confirmPassword ? "bg-green-400" : "bg-red-400"
                              }`}
                            />
                            {password === confirmPassword ? "Passwords match" : "Passwords don't match"}
                          </div>
                        )}
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
                        disabled={loading || passwordStrength.score < 3 || password !== confirmPassword}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-2xl hover:shadow-[#BEF397]/20 transition-all duration-300 disabled:opacity-50 rounded-xl group"
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Resetting Password...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            Reset Password
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </Button>
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
                      <h3 className="text-xl font-bold text-white">Password Reset Successfully!</h3>
                      <p className="text-zinc-400 leading-relaxed">
                        Your password has been updated. You can now sign in with your new password.
                      </p>
                      <p className="text-sm text-zinc-500">Redirecting to sign in page in 3 seconds...</p>
                    </div>

                    {/* Sign In Button */}
                    <Link href="/onboarding/welcome">
                      <Button className="w-full h-12 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:shadow-2xl hover:shadow-[#BEF397]/20 transition-all duration-300 rounded-xl">
                        Sign In Now
                      </Button>
                    </Link>
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
