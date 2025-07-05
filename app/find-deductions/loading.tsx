"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sparkles,
  Search,
  FileText,
  Calculator,
  CheckCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  Receipt,
  Brain,
} from "lucide-react"

const SCANNING_STAGES = [
  {
    id: 1,
    title: "Loading Transactions",
    description: "Gathering your transaction data...",
    icon: FileText,
    duration: 2000,
    color: "text-blue-400",
  },
  {
    id: 2,
    title: "AI Analysis",
    description: "Analyzing transactions with AI...",
    icon: Brain,
    duration: 3000,
    color: "text-purple-400",
  },
  {
    id: 3,
    title: "Finding Deductions",
    description: "Identifying tax-deductible expenses...",
    icon: Search,
    duration: 2500,
    color: "text-[#BEF397]",
  },
  {
    id: 4,
    title: "Calculating Savings",
    description: "Computing your potential tax savings...",
    icon: Calculator,
    duration: 2000,
    color: "text-[#7DD3FC]",
  },
  {
    id: 5,
    title: "Finalizing Results",
    description: "Preparing your deduction summary...",
    icon: TrendingUp,
    duration: 1500,
    color: "text-green-400",
  },
]

export default function Loading() {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)
  const [completedStages, setCompletedStages] = useState<number[]>([])

  useEffect(() => {
    let stageTimer: NodeJS.Timeout
    let progressTimer: NodeJS.Timeout

    const runStage = (stageIndex: number) => {
      if (stageIndex >= SCANNING_STAGES.length) {
        setProgress(100)
        return
      }

      const stage = SCANNING_STAGES[stageIndex]
      setCurrentStage(stageIndex)
      setStageProgress(0)

      // Animate stage progress
      const stageProgressInterval = setInterval(() => {
        setStageProgress((prev) => {
          const increment = Math.random() * 15 + 5
          const newProgress = Math.min(prev + increment, 100)

          // Update overall progress
          const overallProgress = (stageIndex * 100 + newProgress) / SCANNING_STAGES.length
          setProgress(overallProgress)

          return newProgress
        })
      }, 100)

      // Complete stage after duration
      stageTimer = setTimeout(() => {
        clearInterval(stageProgressInterval)
        setStageProgress(100)
        setCompletedStages((prev) => [...prev, stageIndex])

        // Move to next stage after a brief pause
        setTimeout(() => {
          runStage(stageIndex + 1)
        }, 300)
      }, stage.duration)
    }

    // Start the scanning process
    const initialDelay = setTimeout(() => {
      runStage(0)
    }, 500)

    return () => {
      clearTimeout(initialDelay)
      clearTimeout(stageTimer)
      clearTimeout(progressTimer)
    }
  }, [])

  const currentStageData = SCANNING_STAGES[currentStage]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-[#BEF397]/10 to-[#7DD3FC]/10 blur-xl"
          style={{ width: "300px", height: "300px", top: "10%", left: "5%" }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-[#7DD3FC]/10 to-[#BEF397]/10 blur-xl"
          style={{ width: "200px", height: "200px", top: "60%", right: "10%" }}
          animate={{
            x: [0, -80, 60, 0],
            y: [0, 60, -40, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-xl flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-black" />
            </motion.div>
            <h1 className="text-[#BEF397] text-4xl font-bold tracking-wide">moulai.</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Analyzing Your Transactions</h2>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Our AI is scanning your transactions to find every possible tax deduction
          </p>
        </motion.div>

        {/* Main Loading Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl">
            <CardContent className="p-8">
              {/* Overall Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-semibold">Overall Progress</span>
                  <span className="text-[#BEF397] font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Current Stage */}
              <AnimatePresence mode="wait">
                {currentStageData && (
                  <motion.div
                    key={currentStage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="mb-8"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        className={`w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center ${currentStageData.color}`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <currentStageData.icon className="w-6 h-6" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{currentStageData.title}</h3>
                        <p className="text-zinc-400">{currentStageData.description}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5 text-[#BEF397]" />
                      </motion.div>
                    </div>

                    {/* Stage Progress */}
                    <div className="mb-2">
                      <Progress value={stageProgress} className="h-2" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stage List */}
              <div className="space-y-3">
                {SCANNING_STAGES.map((stage, index) => {
                  const isCompleted = completedStages.includes(index)
                  const isCurrent = currentStage === index
                  const isPending = index > currentStage

                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                        isCurrent
                          ? "bg-zinc-800/50 border border-[#BEF397]/30"
                          : isCompleted
                            ? "bg-green-900/20 border border-green-500/30"
                            : "bg-zinc-800/20 border border-zinc-700/30"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? "bg-green-500" : isCurrent ? "bg-[#BEF397]" : "bg-zinc-700"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : isCurrent ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <Loader2 className="w-4 h-4 text-black" />
                          </motion.div>
                        ) : (
                          <span className="text-xs font-bold text-zinc-400">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isCompleted ? "text-green-400" : isCurrent ? "text-white" : "text-zinc-500"
                          }`}
                        >
                          {stage.title}
                        </p>
                      </div>
                      {isCurrent && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                          className="w-2 h-2 bg-[#BEF397] rounded-full"
                        />
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Stats Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8 grid grid-cols-3 gap-4"
              >
                <div className="text-center p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                  >
                    <Receipt className="w-6 h-6 text-[#BEF397] mx-auto mb-2" />
                  </motion.div>
                  <div className="text-lg font-bold text-white">
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    >
                      ---
                    </motion.span>
                  </div>
                  <div className="text-xs text-zinc-400">Transactions</div>
                </div>

                <div className="text-center p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                  >
                    <DollarSign className="w-6 h-6 text-[#7DD3FC] mx-auto mb-2" />
                  </motion.div>
                  <div className="text-lg font-bold text-white">
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.3 }}
                    >
                      $---
                    </motion.span>
                  </div>
                  <div className="text-xs text-zinc-400">Deductions</div>
                </div>

                <div className="text-center p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                  >
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  </motion.div>
                  <div className="text-lg font-bold text-white">
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.6 }}
                    >
                      $---
                    </motion.span>
                  </div>
                  <div className="text-xs text-zinc-400">Tax Savings</div>
                </div>
              </motion.div>

              {/* Fun Facts */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-6 text-center"
              >
                <p className="text-zinc-500 text-sm">
                  💡 Did you know? The average Australian misses $2,000+ in tax deductions each year
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8 text-center"
        >
          <p className="text-zinc-400">This usually takes 10-30 seconds depending on your transaction volume</p>
        </motion.div>
      </div>
    </div>
  )
}
