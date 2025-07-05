"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Search,
  BookOpen,
  HelpCircle,
  Zap,
  Shield,
  CreditCard,
  FileText,
  ChevronRight,
  Star,
  Clock,
  Users,
  MessageCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HelpCentrePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Getting Started",
      description: "Learn the basics and set up your account",
      articles: 12,
      color: "text-[#BEF397]",
      bgColor: "bg-[#BEF397]/10",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Account & Security",
      description: "Manage your account settings and security",
      articles: 8,
      color: "text-[#7DD3FC]",
      bgColor: "bg-[#7DD3FC]/10",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Billing & Payments",
      description: "Subscription, billing, and payment questions",
      articles: 6,
      color: "text-[#E5B1FD]",
      bgColor: "bg-[#E5B1FD]/10",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Tax & Deductions",
      description: "Understanding tax deductions and reports",
      articles: 15,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  const popularArticles = [
    {
      title: "How to connect your bank account",
      category: "Getting Started",
      readTime: "3 min read",
      views: "2.1k views",
    },
    {
      title: "Understanding tax deduction categories",
      category: "Tax & Deductions",
      readTime: "5 min read",
      views: "1.8k views",
    },
    {
      title: "Setting up two-factor authentication",
      category: "Account & Security",
      readTime: "2 min read",
      views: "1.5k views",
    },
    {
      title: "How to upgrade your subscription",
      category: "Billing & Payments",
      readTime: "2 min read",
      views: "1.2k views",
    },
    {
      title: "Exporting your tax report",
      category: "Tax & Deductions",
      readTime: "4 min read",
      views: "980 views",
    },
  ]

  const quickActions = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Contact Support",
      description: "Get help from our team",
      action: () => router.push("/support"),
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      action: () => {},
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Community Forum",
      description: "Connect with other users",
      action: () => {},
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Help Centre</h1>
            <p className="text-zinc-400">Find answers to your questions and get the help you need</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >

        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-white mb-6">Browse by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className={category.color}>{category.icon}</div>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{category.title}</h4>
                  <p className="text-zinc-400 text-sm mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-sm">{category.articles} articles</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#BEF397] transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Popular Articles */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#BEF397]" />
                  Popular Articles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {popularArticles.map((article, index) => (
                  <div
                    key={index}
                    className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2 group-hover:text-[#BEF397] transition-colors">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                            {article.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </div>
                          <span>{article.views}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-[#BEF397] transition-colors" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[#BEF397] group-hover:scale-110 transition-transform">{action.icon}</div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{action.title}</h4>
                        <p className="text-zinc-400 text-sm">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="bg-gradient-to-br from-[#BEF397]/10 to-[#7DD3FC]/10 border border-[#BEF397]/20">
              <CardContent className="p-6 text-center">
                <HelpCircle className="w-12 h-12 text-[#BEF397] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Still need help?</h3>
                <p className="text-zinc-300 text-sm mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Button
                  onClick={() => router.push("/support")}
                  className="w-full bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black hover:opacity-90"
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-bold text-white mb-6">Additional Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 text-[#BEF397] mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">User Guide</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Comprehensive guide covering all features and functionality
                </p>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 text-[#7DD3FC] mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">API Documentation</h4>
                <p className="text-zinc-400 text-sm mb-4">Technical documentation for developers and integrations</p>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Docs
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-[#E5B1FD] mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Community</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Join our community to connect with other users and share tips
                </p>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Community
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
