"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Mail,
  User,
  MessageSquare,
  Send,
  CheckCircle,
  ArrowLeft,
  Clock,
  HelpCircle,
  MessageCircle,
  FileText,
  Zap,
  Shield,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

const supportFeatures = [
  {
    icon: MessageCircle,
    title: "Live Chat Support",
    description: "Get instant help through our support chatbox",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us detailed questions and get comprehensive answers",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Browse our comprehensive guides and tutorials",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Priority Support",
    description: "Premium users get faster response times",
    color: "from-orange-500 to-red-500",
  },
]

const faqItems = [
  {
    question: "How do I connect my bank account?",
    answer: "Go to 'Connect Account' in your dashboard and follow the secure Basiq integration process.",
  },
  {
    question: "Are my transactions secure?",
    answer: "Yes, we use bank-level encryption and never store your banking credentials.",
  },
  {
    question: "How does AI categorization work?",
    answer: "Our AI analyzes transaction descriptions and amounts to suggest tax-deductible categories.",
  },
  {
    question: "Can I export my data?",
    answer: "Premium users can export transactions and reports in CSV format.",
  },
]

const helpLinks = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of using our tax deduction tracker",
    href: "/help/getting-started",
    icon: FileText,
  },
  {
    title: "Bank Connection Help",
    description: "Step-by-step guide to connecting your bank accounts",
    href: "/help/bank-connection",
    icon: Shield,
  },
  {
    title: "Transaction Categories",
    description: "Understanding ATO categories and tax deductions",
    href: "/help/categories",
    icon: HelpCircle,
  },
  {
    title: "Contact Support",
    description: "Get in touch with our support team directly",
    href: "mailto:essabar.yasssine@gmail.com",
    icon: Mail,
    external: true,
  },
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "normal",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.trim() || !formData.message.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim() || "Anonymous",
          message: `Subject: ${formData.subject}\nPriority: ${formData.priority}\n\n${formData.message.trim()}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          priority: "normal",
        })
      } else {
        throw new Error(data.error || "Failed to submit support request")
      }
    } catch (error) {
      console.error("Error submitting support request:", error)
      setError(error instanceof Error ? error.message : "Failed to submit support request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">Support Center</Badge>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">Get Help & Support</h1>
                <p className="text-zinc-400">We're here to help you make the most of your tax deduction tracking</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Response time: 24 hours</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Secure & confidential</span>
                </div>
              </div>
            </div>

            {/* Help Links Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Help Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {helpLinks.map((link, index) => (
                  <Card
                    key={index}
                    className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/60 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#BEF397]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <link.icon className="w-5 h-5 text-[#BEF397]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm mb-1">{link.title}</h3>
                          <p className="text-zinc-400 text-xs mb-2">{link.description}</p>
                          {link.external ? (
                            <a
                              href={link.href}
                              className="text-[#7DD3FC] text-xs hover:underline flex items-center gap-1"
                            >
                              Contact Now
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <Button
                              onClick={() => (window.location.href = link.href)}
                              variant="ghost"
                              size="sm"
                              className="text-[#7DD3FC] text-xs p-0 h-auto hover:underline"
                            >
                              Learn More →
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Alert className="border-green-800 bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    <strong>Message sent successfully!</strong> We'll get back to you within 24 hours at your email
                    address.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="bg-zinc-900/60 border border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#BEF397]" />
                      Send us a Message
                    </CardTitle>
                    <p className="text-zinc-400 text-sm">
                      Fill out the form below and we'll respond to your inquiry as soon as possible
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {error && (
                      <Alert className="mb-6 border-red-800 bg-red-900/20">
                        <AlertDescription className="text-red-300">{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-white text-sm font-medium">
                            Name (Optional)
                          </Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Your full name"
                              className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#BEF397]"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-white text-sm font-medium">
                            Email Address *
                          </Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="your@email.com"
                              className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#BEF397]"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="subject" className="text-white text-sm font-medium">
                            Subject
                          </Label>
                          <div className="relative mt-1">
                            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                              id="subject"
                              name="subject"
                              type="text"
                              value={formData.subject}
                              onChange={handleInputChange}
                              placeholder="Brief description of your inquiry"
                              className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#BEF397]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-white text-sm font-medium">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Please describe your issue or question in detail. Include any error messages, steps you've taken, and what you were trying to accomplish."
                          className="mt-1 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#BEF397] resize-none"
                          rows={6}
                          required
                        />
                        <p className="text-xs text-zinc-500 mt-1">
                          The more details you provide, the better we can help you
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !formData.email.trim() || !formData.message.trim()}
                        className="w-full bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Contact Info */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#BEF397]/20 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#BEF397]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Email Support</p>
                        <a
                          href="mailto:essabar.yasssine@gmail.com"
                          className="text-zinc-400 text-sm hover:text-[#BEF397] transition-colors"
                        >
                          essabar.yasssine@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#7DD3FC]/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#7DD3FC]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Response Time</p>
                        <p className="text-zinc-400 text-sm">Within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Privacy</p>
                        <p className="text-zinc-400 text-sm">Secure & confidential</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Support Features */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">How We Can Help</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {supportFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <feature.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{feature.title}</p>
                          <p className="text-zinc-400 text-xs">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12">
              <Card className="bg-zinc-900/60 border border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#BEF397]" />
                    Frequently Asked Questions
                  </CardTitle>
                  <p className="text-zinc-400 text-sm">Quick answers to common questions</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {faqItems.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="text-white font-medium">{item.question}</h4>
                        <p className="text-zinc-400 text-sm">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
