"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Shield, Upload } from "lucide-react"

interface Bank {
  id: string
  name: string
  logo: string
  color: string
  description: string
}

const BANKS: Bank[] = [
  {
    id: "westpac",
    name: "Westpac",
    logo: "🏦",
    color: "bg-red-50 border-red-200 hover:bg-red-100",
    description: "Upload your Westpac PDF statement",
  },
  {
    id: "anz",
    name: "ANZ",
    logo: "🏛️",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    description: "Upload your ANZ credit card statement",
  },
  {
    id: "cba",
    name: "Commonwealth Bank",
    logo: "🏪",
    color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    description: "Upload your CBA PDF statement",
  },
  {
    id: "amex",
    name: "American Express",
    logo: "💳",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    description: "Upload your Amex PDF statement",
  },
]

interface BankSelectionPopupProps {
  isOpen: boolean
  onClose: () => void
  onBankSelect: (bankId: string) => void
  mode?: "connect" | "upload"
}

export function BankSelectionPopup({ isOpen, onClose, onBankSelect, mode = "connect" }: BankSelectionPopupProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredBanks = BANKS.filter((bank) => bank.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleBankSelect = (bankId: string) => {
    onBankSelect(bankId)
    setSearchTerm("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Select Your Bank
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Security Message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Secure Upload</p>
              <p className="text-blue-700">Your PDF statements are processed securely and never stored permanently.</p>
            </div>
          </div>

          {/* Bank List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredBanks.map((bank) => (
              <Button
                key={bank.id}
                variant="outline"
                className={`w-full justify-start h-auto p-4 ${bank.color}`}
                onClick={() => handleBankSelect(bank.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl">{bank.logo}</span>
                  <div className="text-left">
                    <p className="font-medium">{bank.name}</p>
                    <p className="text-sm text-gray-600">{bank.description}</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {filteredBanks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No banks found matching "{searchTerm}"</p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Select your bank to open the file picker</p>
            <p>• Choose a PDF statement from your computer</p>
            <p>• We'll automatically extract and categorize your transactions</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
