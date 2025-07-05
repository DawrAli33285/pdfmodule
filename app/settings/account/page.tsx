"use client"

import { useState, useEffect } from "react"
import {
  User,
  Key,
  Shield,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

interface UserProfileState {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
  business?: {
    name?: string
    abn?: string
    industry?: string
    structure?: string
  }
  tax?: {
    tfn?: string
    residencyStatus?: string
    financialYear?: string
  }
}

export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<Partial<UserProfileState>>({})
  const [tempProfile, setTempProfile] = useState<Partial<UserProfileState>>({})
  const [editMode, setEditMode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          const user = data.user

          const profileData: Partial<UserProfileState> = {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: user.dateOfBirth || "",
          }

          if (user.address) {
            profileData.address = {
              street: user.address.street || "",
              city: user.address.city || "",
              state: user.address.state || "",
              postcode: user.address.postcode || "",
              country: user.address.country || "",
            }
          }

          if (user.business) {
            profileData.business = {
              name: user.business.name || "",
              abn: user.business.abn || "",
              industry: user.business.industry || "",
              structure: user.business.structure || "",
            }
          }

          if (user.tax) {
            profileData.tax = {
              tfn: user.tax.tfn || "",
              residencyStatus: user.tax.residencyStatus || "",
              financialYear: user.tax.financialYear || "",
            }
          }

          setProfile(profileData)
          setTempProfile(profileData)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
      }
    }

    fetchProfile()

    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    }
  }, [])

  const handleEdit = (section: string) => {
    setEditMode(section)
    setTempProfile({ ...profile })
    setMessage(null)
  }

  const handleSave = async (section: string) => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setProfile({ ...tempProfile })
    setEditMode(null)
    setLoading(false)
    setMessage({ type: "success", text: "Profile updated successfully!" })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleCancel = () => {
    setTempProfile({ ...profile })
    setEditMode(null)
    setMessage(null)
  }

  const handleInputChange = (
    section: keyof UserProfileState,
    field: string,
    value: string,
  ) => {
    setTempProfile((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object"
          ? { ...prev[section], [field]: value }
          : value,
    }))
  }

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      alert(
        "Account deletion requested. You will receive a confirmation email.",
      )
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all password fields." })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." })
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setLoading(false)
    setMessage({ type: "success", text: "Password updated successfully!" })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <DashboardSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-80"}`}>
        <DashboardHeader />
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <User className="w-8 h-8 text-[#BEF397]" />
                Account Settings
              </h1>
              <p className="text-zinc-400 mt-1">Manage your personal information and preferences</p>
            </div>
          </div>

          {message && (
            <Alert
              className={`border-${message.type === "success" ? "green" : "red"}-800 bg-${message.type === "success" ? "green" : "red"}-900/20`}
            >
              <AlertDescription
                className={`text-${message.type === "success" ? "green" : "red"}-300`}
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#BEF397]" />
                    Personal Information
                  </CardTitle>
                  <p className="text-zinc-400 text-sm mt-1">Basic details about your account</p>
                </div>
                {editMode !== "personal" ? (
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => handleEdit("personal")}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave("personal")}
                      disabled={loading}
                      className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  {editMode === "personal" ? (
                    <Input
                      id="firstName"
                      value={tempProfile.firstName || ""}
                      onChange={(e) => handleInputChange("firstName", "", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-zinc-300">{profile.firstName || "—"}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  {editMode === "personal" ? (
                    <Input
                      id="lastName"
                      value={tempProfile.lastName || ""}
                      onChange={(e) => handleInputChange("lastName", "", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-zinc-300">{profile.lastName || "—"}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  {editMode === "personal" ? (
                    <Input
                      id="email"
                      type="email"
                      value={tempProfile.email || ""}
                      onChange={(e) => handleInputChange("email", "", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-zinc-300">{profile.email || "—"}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  {editMode === "personal" ? (
                    <Input
                      id="phone"
                      value={tempProfile.phone || ""}
                      onChange={(e) => handleInputChange("phone", "", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-zinc-300">{profile.phone || "—"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#BEF397]" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="currentPassword" className="text-zinc-300">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-zinc-300">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      loading ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword
                    }
                    className="bg-[#BEF397] text-black hover:bg-[#BEF397]/90"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>


        </div>
      </div>
    </div>
  )
}
