"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Zap, CheckCircle, Calculator, Receipt, Car, Home, Briefcase } from "lucide-react"

const PROCESSING_STAGES = [
  "Connecting to your bank accounts...",
  "Scanning transaction history...",
  "Identifying business expenses...",
  "Calculating tax deductions...",
  "Analyzing potential savings...",
  "Finalizing your report...",
]

const ATO_CATEGORIES = [
  { name: "Car and Travel Expenses", icon: Car, description: "Vehicle costs, fuel, parking, tolls" },
  { name: "Home Office Expenses", icon: Home, description: "Utilities, internet, phone bills" },
  { name: "Work Equipment", icon: Briefcase, description: "Tools, computers, software" },
  { name: "Professional Development", icon: Receipt, description: "Training, courses, conferences" },
  { name: "Clothing and Uniforms", icon: Receipt, description: "Work-specific clothing" },
  { name: "Phone and Internet", icon: Receipt, description: "Communication expenses" },
  { name: "Insurance Premiums", icon: Receipt, description: "Professional indemnity, income protection" },
  { name: "Bank Fees", icon: Calculator, description: "Account keeping, transaction fees" },
  { name: "Interest Deductions", icon: Calculator, description: "Investment loan interest" },
  { name: "Subscriptions", icon: Receipt, description: "Professional memberships, software" },
  { name: "Meals and Entertainment", icon: Receipt, description: "Business meals, client entertainment" },
  { name: "Other Work Expenses", icon: Briefcase, description: "Stationery, postage, repairs" },
]

export default function Loading() {
  const [currentStage, setCurrentStage] = useState(0)
  const [scannedCategories, setScannedCategories] = useState<number[]>([])
  const [currentScanning, setCurrentScanning] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)

  useEffect(() => {
    let stageTimer: NodeJS.Timeout
    let scanningTimer: NodeJS.Timeout

    // Stage progression (slower)
    const progressStages = () => {
      stageTimer = setTimeout(() => {
        setCurrentStage((prev) => {
          const next = (prev + 1) % PROCESSING_STAGES.length
          if (next === 0) {
            // Reset scanning when we complete a full cycle
            setScannedCategories([])
            setCurrentScanning(0)
            setCycleCount((prev) => prev + 1)
          }
          return next
        })
        progressStages()
      }, 4000) // Change stage every 4 seconds
    }

    // Category scanning (faster)
    const scanCategories = () => {
      scanningTimer = setTimeout(() => {
        setCurrentScanning((prev) => {
          const next = (prev + 1) % ATO_CATEGORIES.length

          // Mark previous category as scanned
          setScannedCategories((prevScanned) => {
            const newScanned = [...prevScanned, prev]

            // If we've scanned all categories, reset for next cycle
            if (newScanned.length >= ATO_CATEGORIES.length) {
              setTimeout(() => {
                setScannedCategories([])
              }, 1500)
              return []
            }

            return newScanned
          })

          return next
        })

        scanCategories()
      }, 1200) // Scan each category every 1.2 seconds
    }

    // Start both timers
    progressStages()
    scanCategories()

    return () => {
      clearTimeout(stageTimer)
      clearTimeout(scanningTimer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-[#BEF397]/8 to-[#7DD3FC]/8 blur-3xl"
          style={{ width: "400px", height: "400px", top: "15%", left: "10%" }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-purple-500/8 to-[#BEF397]/8 blur-3xl"
          style={{ width: "350px", height: "350px", bottom: "20%", right: "10%" }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.7, 0.3],
            x: [0, -40, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-[#7DD3FC]/6 to-purple-400/6 blur-2xl"
          style={{ width: "250px", height: "250px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* AI Scanner Icon with Enhanced Animation */}
        <motion.div
          className="mb-6 flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative w-24 h-24">
            {/* Outer rotating ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#BEF397]/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

            {/* Middle rotating ring - opposite direction */}
            <motion.div
              className="absolute inset-2 rounded-full border border-purple-400/40"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

            {/* Inner rotating ring */}
            <motion.div
              className="absolute inset-4 rounded-full border border-[#7DD3FC]/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

            {/* Main scanner body */}
            <motion.div
              className="absolute inset-5 bg-gradient-to-br from-purple-500 via-[#7DD3FC] to-[#BEF397] rounded-full flex items-center justify-center shadow-2xl"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(190, 243, 151, 0.4)",
                  "0 0 40px rgba(190, 243, 151, 1)",
                  "0 0 50px rgba(125, 211, 252, 0.8)",
                  "0 0 20px rgba(190, 243, 151, 0.4)",
                ],
              }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  scale: { duration: 2, repeat: Number.POSITIVE_INFINITY },
                  rotate: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                }}
              >
                <Calculator className="w-6 h-6 text-black" />
              </motion.div>
            </motion.div>

            {/* Enhanced scanning beams */}
            <motion.div className="absolute inset-5 rounded-full overflow-hidden" style={{ clipPath: "circle(50%)" }}>
              <motion.div
                className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[#BEF397] to-transparent top-1/2 -translate-y-1/2"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <motion.div className="absolute inset-5 rounded-full overflow-hidden" style={{ clipPath: "circle(50%)" }}>
              <motion.div
                className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-[#7DD3FC] to-transparent left-1/2 -translate-x-1/2"
                animate={{
                  y: ["-100%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 1.2,
                }}
              />
            </motion.div>

            {/* Enhanced radar sweep */}
            <motion.div className="absolute inset-5 rounded-full overflow-hidden" style={{ clipPath: "circle(50%)" }}>
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(190, 243, 151, 0.4) 20deg, rgba(125, 211, 252, 0.3) 40deg, transparent 60deg)",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
            </motion.div>

            {/* Enhanced pulsing scan rings */}
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="absolute inset-0 rounded-full border border-[#BEF397]/30"
                animate={{
                  scale: [0.7, 2],
                  opacity: [0.9, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 1,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Enhanced floating elements */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.4, 1],
                y: [0, -8, 0],
              }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
            >
              <Sparkles className="w-4 h-4 text-[#BEF397]" />
            </motion.div>

            <motion.div
              className="absolute -bottom-2 -left-2"
              animate={{
                rotate: [360, 0],
                scale: [1, 1.5, 1],
                x: [0, -6, 0],
              }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
            >
              <Zap className="w-4 h-4 text-purple-400" />
            </motion.div>

            <motion.div
              className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                rotate: [0, 180, 360],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            >
              <div className="w-2 h-2 bg-[#7DD3FC] rounded-full" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          A.I. is scanning for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BEF397] via-[#7DD3FC] to-purple-400">
            tax deductions
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-zinc-300 text-lg mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Analyzing your expenses across all ATO categories
        </motion.p>

        {/* ATO Category Scanning List */}
        <motion.div
          className="space-y-3 mb-8 max-h-80 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {ATO_CATEGORIES.slice(0, 6).map((category, index) => {
            const actualIndex = (currentScanning - 5 + index + ATO_CATEGORIES.length) % ATO_CATEGORIES.length
            const displayCategory = ATO_CATEGORIES[actualIndex]
            const isScanned = scannedCategories.includes(actualIndex)
            const isCurrentlyScanning = currentScanning === actualIndex
            const IconComponent = displayCategory.icon

            return (
              <motion.div
                key={`${cycleCount}-${actualIndex}`}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-700 ${
                  isScanned
                    ? "bg-gradient-to-r from-[#BEF397]/15 to-[#7DD3FC]/10 border-[#BEF397]/40 shadow-lg shadow-[#BEF397]/20"
                    : isCurrentlyScanning
                      ? "bg-gradient-to-r from-[#7DD3FC]/15 to-purple-500/10 border-[#7DD3FC]/40 shadow-lg shadow-[#7DD3FC]/20"
                      : "bg-zinc-800/40 border-zinc-700/40 backdrop-blur-sm"
                }`}
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {isScanned ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="relative"
                    >
                      <CheckCircle className="w-5 h-5 text-[#BEF397]" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#BEF397]/30"
                        animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                        transition={{ duration: 1, repeat: 2 }}
                      />
                    </motion.div>
                  ) : isCurrentlyScanning ? (
                    <motion.div className="relative">
                      <motion.div
                        className="w-5 h-5 border-2 border-[#7DD3FC] border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border border-[#7DD3FC]/20"
                        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      />
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-zinc-600 rounded-full" />
                  )}
                </div>

                {/* Category icon */}
                <div className="flex-shrink-0">
                  <motion.div
                    className={`p-2 rounded-lg transition-all duration-500 ${
                      isScanned
                        ? "bg-[#BEF397]/20 text-[#BEF397]"
                        : isCurrentlyScanning
                          ? "bg-[#7DD3FC]/20 text-[#7DD3FC]"
                          : "bg-zinc-700/50 text-zinc-400"
                    }`}
                    animate={isCurrentlyScanning ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </motion.div>
                </div>

                {/* Category details */}
                <div className="flex-1 text-left">
                  <motion.div
                    className={`font-semibold text-base transition-colors duration-500 ${
                      isScanned ? "text-[#BEF397]" : isCurrentlyScanning ? "text-[#7DD3FC]" : "text-white"
                    }`}
                  >
                    {displayCategory.name}
                  </motion.div>
                  <motion.div
                    className={`text-sm mt-1 transition-colors duration-500 ${
                      isScanned ? "text-[#BEF397]/70" : isCurrentlyScanning ? "text-[#7DD3FC]/70" : "text-zinc-400"
                    }`}
                  >
                    {displayCategory.description}
                  </motion.div>
                </div>

                {/* Scanning indicator */}
                {isCurrentlyScanning && (
                  <motion.div
                    className="flex-shrink-0 flex space-x-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  >
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        className="w-1.5 h-1.5 bg-[#7DD3FC] rounded-full"
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: dot * 0.2,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Current stage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-white font-medium text-lg mb-6"
          >
            {PROCESSING_STAGES[currentStage]}
          </motion.div>
        </AnimatePresence>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center"
        >
          <p className="text-zinc-400 text-base">
            Identifying potential savings across{" "}
            <span className="text-[#BEF397] font-semibold">{ATO_CATEGORIES.length} ATO categories</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
