"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Clock, Shield } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface Consent {
  id: string
  status: string
  institution?: {
    id?: string
    name?: string
    shortName?: string
  }
  permissions?: string[]
  createdDate?: string
  updatedDate?: string
  expiryDate?: string
}

export default function ConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchConsents()
  }, [])

  const fetchConsents = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const userId = urlParams.get("userId") || localStorage.getItem("basiq_user_id")

      if (!userId) {
        setError("No user ID found. Please start the connection process again.")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/basiq/consents?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        // Safely handle the consents data with proper null checks
        const safeConsents = (data.consents || []).map((consent: any) => ({
          id: consent?.id || `consent_${Date.now()}_${Math.random()}`,
          status: consent?.status || "unknown",
          institution: {
            id: consent?.institution?.id || "",
            name: consent?.institution?.name || "Unknown Institution",
            shortName: consent?.institution?.shortName || consent?.institution?.name || "Unknown",
          },
          permissions: Array.isArray(consent?.permissions) ? consent.permissions : [],
          createdDate: consent?.createdDate || consent?.created_at || new Date().toISOString(),
          updatedDate: consent?.updatedDate || consent?.updated_at || new Date().toISOString(),
          expiryDate:
            consent?.expiryDate ||
            consent?.expiry_date ||
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }))

        setConsents(safeConsents)
      } else {
        console.error("Failed to fetch consents:", data.error)
        setError(data.error || "Failed to fetch consents")
      }
    } catch (error) {
      console.error("Error fetching consents:", error)
      setError("An error occurred while fetching consents")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "granted":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "expired":
      case "revoked":
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Clock className="h-5 w-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "granted":
        return "bg-green-400 text-black"
      case "expired":
      case "revoked":
        return "bg-red-400 text-white"
      default:
        return "bg-yellow-400 text-black"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    try {
      return new Date(dateString).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-black text-white">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading your consents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2">Your Bank Consents</h2>
            <p className="text-zinc-400 text-lg">Manage your connected bank account permissions</p>
          </div>

          {error && (
            <Card className="bg-red-900 border-red-700 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-200">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4 mb-8">
            {consents.map((consent) => (
              <Card key={consent.id} className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-green-400" />
                      <div>
                        <CardTitle className="text-white">
                          {consent.institution?.name || "Unknown Institution"}
                        </CardTitle>
                        <p className="text-sm text-zinc-400">
                          {consent.institution?.shortName || consent.institution?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(consent.status)}
                      <Badge className={getStatusColor(consent.status)}>{consent.status || "unknown"}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-zinc-400">Created</p>
                      <p className="text-white">{formatDate(consent.createdDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Updated</p>
                      <p className="text-white">{formatDate(consent.updatedDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Expires</p>
                      <p className="text-white">{formatDate(consent.expiryDate)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-400 mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {consent.permissions && consent.permissions.length > 0 ? (
                        consent.permissions.map((permission, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No permissions listed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {consents.length === 0 && !error && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No consents found</h3>
                <p className="text-zinc-400 mb-4">
                  You haven't connected any bank accounts yet. Start by connecting your first account.
                </p>
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="bg-[#BEF397] text-black hover:bg-[#BEF397]/90"
                >
                  Connect Bank Account
                </Button>
              </CardContent>
            </Card>
          )}

          {consents.length > 0 && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => (window.location.href = "/accounts")}
                className="bg-[#BEF397] text-black hover:bg-[#BEF397]/90 font-bold"
              >
                View Accounts
              </Button>
              <Button onClick={() => (window.location.href = "/")} className="bg-zinc-800 text-white hover:bg-zinc-700">
                Connect Another Bank
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
