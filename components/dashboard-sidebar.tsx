"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Upload,
  User,
  Crown,
  LogOut,
  Sparkles,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  subscription?: {
    plan: "free" | "premium"
    status: string
  }
}

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    description: "Tax deduction details",
  },
  {
    title: "Transactions",
    icon: Receipt,
    href: "/transactions",
    description: "View all transactions",
  },
]

const settingsItems = [
  {
    title: "Profile",
    icon: User,
    href: "/profile",
    description: "Personal information",
  },
  {
    title: "Calculator",
    icon: Calculator,
    href: "/calculator",
    description: "Tax calculator",
  },
]

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
        }
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      sessionStorage.setItem("logout_redirect", "true")
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        localStorage.removeItem("user_authenticated")
        localStorage.removeItem("user_id")
        localStorage.removeItem("user_email")
        router.push("/")
      }
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { collapsed: newCollapsed } }))
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleUploadStatements = () => {
    router.push("/upload-statements")
  }

  const handleUpgrade = () => {
    router.push("/upgrade")
  }

  const isPremium = user?.subscription?.plan === "premium"

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-full bg-black border-r border-zinc-800/50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-[#BEF397] text-2xl font-bold tracking-tight"
              >
                moulai.
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* User Status & Upgrade Section */}
      {!loading && user && (
        <div className="p-4 border-b border-zinc-800/50">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {isPremium ? (
                      <Badge className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black font-semibold text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                        Free Plan
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Upgrade Button for Non-Premium Users */}
              {!isPremium && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    <span>Upgrade to Premium</span>
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-zinc-500 text-center mt-2">Unlock unlimited features</p>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
              {!isPremium && (
                <Button
                  onClick={handleUpgrade}
                  size="sm"
                  className="w-10 h-10 p-0 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black rounded-xl"
                  title="Upgrade to Premium"
                >
                  <Crown className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Statements Button */}
      <div className="p-4 border-b border-zinc-800/50">
        <Button
          onClick={handleUploadStatements}
          className={cn(
            "w-full bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] hover:from-[#BEF397]/90 hover:to-[#7DD3FC]/90 text-black font-semibold rounded-xl transition-all duration-200",
            isCollapsed ? "px-0" : "px-4",
          )}
        >
          <Upload className="w-5 h-5" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-2"
              >
                Upload Statements
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <motion.button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-[#BEF397]/20 to-[#7DD3FC]/20 text-white border border-[#BEF397]/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-[#BEF397]" : "text-zinc-400 group-hover:text-white")} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1"
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-zinc-500 group-hover:text-zinc-400">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>

        {/* Settings */}
        <div className="pt-6 border-t border-zinc-800/50">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Settings
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <motion.button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-[#BEF397]/20 to-[#7DD3FC]/20 text-white border border-[#BEF397]/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon
                    className={cn("w-5 h-5", isActive ? "text-[#BEF397]" : "text-zinc-400 group-hover:text-white")}
                  />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1"
                      >
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-zinc-500 group-hover:text-zinc-400">{item.description}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800/50">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10",
            isCollapsed && "justify-center px-2",
          )}
        >
          <LogOut className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </motion.div>
  )
}
