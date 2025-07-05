"use client"

import { useState, useEffect } from "react"
import { CreditCard, Calendar, CheckCircle, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function BillingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const handleRenew = () => {
    window.location.href = "/upgrade"
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <DashboardHeader />

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#BEF397]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Billing</h1>
              <p className="text-zinc-400 mt-1">Your annual license information</p>
            </div>
          </div>

          {/* Current Plan */}
          <Card className="bg-zinc-900/80 border-zinc-700/50">
            <CardHeader>
              <CardTitle className="text-white">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Premium Plan</h3>
                  <p className="text-zinc-400">Annual License - Valid until Jan 15, 2025</p>
                </div>
                <Badge className="bg-[#BEF397]/20 text-[#BEF397] border-[#BEF397]/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                  <p className="text-sm text-zinc-400">Unlimited</p>
                  <p className="font-semibold text-[#BEF397]">Transactions</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                  <p className="text-sm text-zinc-400">AI</p>
                  <p className="font-semibold text-[#BEF397]">Analysis</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
                  <p className="text-sm text-zinc-400">Export</p>
                  <p className="font-semibold text-[#BEF397]">Reports</p>
                </div>
              </div>

              <Button
                onClick={handleRenew}
                className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-semibold"
              >
                Renew License
              </Button>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="bg-zinc-900/80 border-zinc-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#E5B1FD]" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-5 h-5 text-[#BEF397]" />
                    <div>
                      <p className="font-medium text-white">Annual License 2024</p>
                      <p className="text-sm text-zinc-400">Jan 15, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-white">$199</p>
                      <Badge variant="outline" className="text-xs border-[#BEF397]/30 text-[#BEF397]">
                        Paid
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Alert className="border-[#BEF397]/30 bg-[#BEF397]/10">
            <CheckCircle className="h-4 w-4 text-[#BEF397]" />
            <AlertDescription className="text-[#BEF397]">
              Your license is active until Jan 15, 2025. One-time annual payment - no recurring charges.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
