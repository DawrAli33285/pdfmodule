import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupportChatbox } from "@/components/support-chatbox"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Moulai - Tax Deduction Tracker",
  description: "Automatically track and categorize your tax deductions with AI-powered transaction analysis",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <SupportChatbox />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
