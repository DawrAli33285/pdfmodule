"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Shield,
  Users,
  Award,
  CheckCircle,
  FileText,
  TrendingUp,
  Send,
  Loader2,
  Upload,
  X,
  Paperclip,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ContactForm {
  name: string
  email: string
  phone: string
  message: string
  attachments: File[]
}

export default function ContactCPAPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    message: "",
    attachments: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadError(null)

    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      submitData.append("name", formData.name)
      submitData.append("email", formData.email)
      submitData.append("phone", formData.phone)
      submitData.append("message", formData.message)

      // Add attachments
      formData.attachments.forEach((file, index) => {
        submitData.append(`attachment_${index}`, file)
      })

      const response = await fetch("/api/contact-cpa", {
        method: "POST",
        body: submitData,
      })

      const result = await response.json()

      if (result.success) {
        setShowSuccess(true)
        // Clear form
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          attachments: [],
        })
      } else {
        throw new Error(result.error || "Failed to submit inquiry")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to submit inquiry")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        setUploadError(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`File ${file.name} is not a supported format.`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles].slice(0, 5), // Max 5 files
      }))
      setUploadError(null)
    }
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const services = [
    {
      id: "basic",
      name: "Basic Tax Return",
      price: "$199",
      description: "Individual tax return with standard deductions",
      features: ["Individual tax return", "Standard deductions", "Basic review", "Email support"],
      popular: false,
    },
    {
      id: "comprehensive",
      name: "Comprehensive Tax Service",
      price: "$399",
      description: "Complete tax service with deduction optimization",
      features: [
        "Individual tax return",
        "Deduction optimization",
        "Investment advice",
        "Phone consultation",
        "Audit protection",
      ],
      popular: true,
    },
    {
      id: "business",
      name: "Business Tax Package",
      price: "$599",
      description: "Complete business and personal tax service",
      features: [
        "Business tax return",
        "Personal tax return",
        "GST/BAS lodgment",
        "Quarterly reviews",
        "Priority support",
      ],
      popular: false,
    },
  ]

  const testimonials = [
    {
      name: "Sarah Mitchell",
      rating: 5,
      comment: "Found an extra $3,200 in deductions I missed. Excellent service!",
    },
    {
      name: "David Chen",
      rating: 5,
      comment: "Professional, fast, and saved me hours of paperwork. Highly recommend!",
    },
    {
      name: "Emma Thompson",
      rating: 5,
      comment: "Best tax service I've used. They explained everything clearly.",
    },
  ]

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
            <p className="text-zinc-300 mb-6">
              Your inquiry has been submitted successfully. Our CPA team will contact you within 24 hours.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#BEF397] text-black hover:bg-[#BEF397]/90"
              >
                Return to Dashboard
              </Button>
              <Button
                onClick={() => setShowSuccess(false)}
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
              >
                Submit Another Inquiry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 lg:mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Contact a CPA</h1>
            <p className="text-zinc-400">Get professional tax help from certified accountants</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#BEF397]" />
                  Get Professional Tax Help
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-white">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="0400 000 000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white">
                      Additional Information
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      rows={4}
                      placeholder="Tell us about your tax situation, specific needs, or any questions you have..."
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <Label className="text-white">Attachments (Optional)</Label>
                    <p className="text-sm text-zinc-400 mb-3">
                      Upload tax documents, bank statements, or other relevant files (PDF, DOC, images)
                    </p>

                    {/* Drag and Drop Area */}
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                        dragActive ? "border-[#BEF397] bg-[#BEF397]/5" : "border-zinc-700 hover:border-zinc-600",
                      )}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                      <p className="text-zinc-300 mb-2">
                        Drag and drop files here, or{" "}
                        <label className="text-[#BEF397] hover:text-[#BEF397]/80 cursor-pointer underline">
                          browse
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                        </label>
                      </p>
                      <p className="text-xs text-zinc-500">
                        Maximum 5 files, 10MB each. Supported: PDF, DOC, DOCX, JPG, PNG, GIF, TXT
                      </p>
                    </div>

                    {/* File List */}
                    {formData.attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Paperclip className="w-4 h-4 text-[#BEF397]" />
                              <div>
                                <p className="text-sm text-white font-medium">{file.name}</p>
                                <p className="text-xs text-zinc-400">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-zinc-400 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{uploadError}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
                    className="w-full bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information & Services */}
          <div className="space-y-6">
            {/* Contact Details */}
            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#BEF397]" />
                  <div>
                    <p className="text-white font-medium">1300 TAX HELP</p>
                    <p className="text-sm text-zinc-400">Mon-Fri 8AM-6PM AEST</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#7DD3FC]" />
                  <div>
                    <p className="text-white font-medium">cpa@moulai.com</p>
                    <p className="text-sm text-zinc-400">24hr response guarantee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-white font-medium">Australia Wide</p>
                    <p className="text-sm text-zinc-400">Remote & in-person available</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-white font-medium">Quick Response</p>
                    <p className="text-sm text-zinc-400">Usually within 2-4 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us */}
            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Why Choose Our CPAs?</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#BEF397] mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Certified Professionals</p>
                    <p className="text-sm text-zinc-400">All CPAs are fully certified and registered</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-[#7DD3FC] mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Maximize Your Refund</p>
                    <p className="text-sm text-zinc-400">Average client saves $2,500+ extra</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">100% Guarantee</p>
                    <p className="text-sm text-zinc-400">Money-back if not satisfied</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Personal Service</p>
                    <p className="text-sm text-zinc-400">Dedicated CPA for your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Testimonials */}
            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">What Clients Say</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="p-4 bg-zinc-800/30 rounded-lg">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-zinc-300 mb-2">"{testimonial.comment}"</p>
                    <p className="text-xs text-zinc-500">- {testimonial.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Service Packages */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Our Tax Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className={cn(
                  "bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 relative",
                  service.popular && "border-[#BEF397]/50",
                )}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#BEF397] text-black">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{service.name}</span>
                    <span className="text-[#BEF397]">{service.price}</span>
                  </CardTitle>
                  <p className="text-zinc-400 text-sm">{service.description}</p>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                        <CheckCircle className="w-4 h-4 text-[#BEF397]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
                    variant="outline"
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
