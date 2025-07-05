"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, FileText, Sparkles, TrendingUp, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

export default function FindDeductionsPage() {
  const router = useRouter()

  const handleUploadClick = () => {
    console.log("Upload button clicked - navigating to /upload-statements")
    router.push("/upload-statements")
  }

  const handleBackClick = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Top Gradient Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#BEF397] via-[#7DD3FC] to-[#E5B1FD] z-10" />

      {/* Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            onClick={handleBackClick}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#BEF397] to-[#7DD3FC] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-[#BEF397] text-3xl font-bold tracking-wide">moulai.</h1>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
              <div className="relative mb-8">
                {/* AI Illustration */}
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#BEF397]/20 to-[#7DD3FC]/20 rounded-full animate-pulse" />
                  <div className="absolute inset-2 bg-gradient-to-br from-[#7DD3FC]/30 to-[#E5B1FD]/30 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-[#BEF397]" />
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#7DD3FC] rounded-full animate-bounce" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#E5B1FD] rounded-full animate-bounce delay-300" />
                  <div className="absolute top-1/2 -left-4 w-3 h-3 bg-[#BEF397] rounded-full animate-bounce delay-150" />
                </div>
              </div>

              <h2 className="text-5xl font-bold text-white mb-6">
                Find Your Tax
                <span className="bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] bg-clip-text text-transparent">
                  {" "}
                  Deductions
                </span>
              </h2>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Upload your bank statements and let our AI automatically identify potential tax deductions. Maximize
                your refund with intelligent transaction analysis.
              </p>
            </motion.div>

            {/* Upload Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl max-w-2xl mx-auto">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-[#7DD3FC]" />
                    Upload Bank Statements
                  </CardTitle>
                  <p className="text-zinc-400 mt-2">
                    Securely upload your PDF bank statements to start finding deductions
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload Button */}
                  <div className="relative">
                    <Button
                      onClick={handleUploadClick}
                      type="button"
                      className="w-full h-16 bg-gradient-to-r from-[#BEF397] to-[#7DD3FC] text-black text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative z-10"
                    >
                      <Upload className="w-6 h-6 mr-3" />
                      Upload PDF Statements
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 rounded-lg bg-zinc-800/30">
                      <Sparkles className="w-8 h-8 text-[#BEF397] mx-auto mb-2" />
                      <h4 className="font-semibold text-white text-sm">AI Analysis</h4>
                      <p className="text-xs text-zinc-400 mt-1">Smart categorization</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-zinc-800/30">
                      <TrendingUp className="w-8 h-8 text-[#7DD3FC] mx-auto mb-2" />
                      <h4 className="font-semibold text-white text-sm">Tax Optimization</h4>
                      <p className="text-xs text-zinc-400 mt-1">Maximize deductions</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-zinc-800/30">
                      <Calculator className="w-8 h-8 text-[#E5B1FD] mx-auto mb-2" />
                      <h4 className="font-semibold text-white text-sm">Instant Reports</h4>
                      <p className="text-xs text-zinc-400 mt-1">Ready for tax time</p>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm text-center">
                      🔒 <strong>Secure Processing:</strong> Your statements are processed locally and never stored on
                      our servers
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-[#BEF397]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#BEF397]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Easy Upload</h3>
                <p className="text-zinc-400">
                  Simply drag and drop your PDF bank statements. Our system automatically extracts and categorizes
                  transactions.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7DD3FC]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[#7DD3FC]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Detection</h3>
                <p className="text-zinc-400">
                  AI-powered analysis identifies business expenses and potential tax deductions automatically.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#E5B1FD]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-[#E5B1FD]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Maximize Savings</h3>
                <p className="text-zinc-400">
                  Get detailed reports showing your potential tax savings and deduction opportunities.
                </p>
              </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <p className="text-zinc-500 text-sm">
                Ready to find your deductions? Upload your first statement to get started.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
