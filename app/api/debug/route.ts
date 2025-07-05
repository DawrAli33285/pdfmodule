import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Checking onboarding data storage...")

    const client = await clientPromise
    const db = client.db("taxapp")

    // Check all collections for user data
    const collections = await db.listCollections().toArray()
    console.log(
      "📁 Available collections:",
      collections.map((c) => c.name),
    )

    const debugInfo: any = {
      collections: collections.map((c) => c.name),
      userProfiles: null,
      onboardingData: null,
      deductionSettings: null,
      keywordMappings: null,
    }

    // Check users collection
    const usersCollection = db.collection("users")
    const userCount = await usersCollection.countDocuments()
    const sampleUser = await usersCollection.findOne({}, { limit: 1 })

    debugInfo.userProfiles = {
      count: userCount,
      sampleStructure: sampleUser ? Object.keys(sampleUser) : null,
      sampleData: sampleUser
        ? {
            id: sampleUser._id,
            email: sampleUser.email || "N/A",
            hasOnboardingData: !!sampleUser.onboarding,
            hasDeductionSettings: !!sampleUser.deductionSettings,
            hasEnabledDeductions: !!sampleUser.enabledDeductions,
          }
        : null,
    }

    // Check for onboarding-specific collections
    const onboardingCollection = db.collection("onboarding")
    const onboardingCount = await onboardingCollection.countDocuments()
    const sampleOnboarding = await onboardingCollection.findOne({}, { limit: 1 })

    debugInfo.onboardingData = {
      count: onboardingCount,
      sampleStructure: sampleOnboarding ? Object.keys(sampleOnboarding) : null,
      sampleData: sampleOnboarding,
    }

    // Check deduction settings
    const deductionSettingsCollection = db.collection("deduction_settings")
    const deductionCount = await deductionSettingsCollection.countDocuments()
    const sampleDeduction = await deductionSettingsCollection.findOne({}, { limit: 1 })

    debugInfo.deductionSettings = {
      count: deductionCount,
      sampleStructure: sampleDeduction ? Object.keys(sampleDeduction) : null,
      sampleData: sampleDeduction,
    }

    // Check keyword mappings
    const keywordCollection = db.collection("keyword_mappings")
    const keywordCount = await keywordCollection.countDocuments()
    const keywordStats = await keywordCollection
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    debugInfo.keywordMappings = {
      count: keywordCount,
      statusBreakdown: keywordStats,
      sampleKeywords: await keywordCollection.find({}).limit(5).toArray(),
    }

    // Check for user-specific deduction data
    if (sampleUser) {
      const userId = sampleUser._id.toString()

      // Check transactions collection for this user
      const transactionsCollection = db.collection("transactions")
      const userTransactions = await transactionsCollection.countDocuments({ userId })

      debugInfo.userTransactions = {
        count: userTransactions,
        sampleTransaction: await transactionsCollection.findOne({ userId }),
      }
    }

    console.log("✅ DEBUG: Onboarding data analysis complete")

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      debugInfo,
      recommendations: [
        "Check users.onboarding field for onboarding selections",
        "Check users.enabledDeductions array for selected deduction types",
        "Check users.deductionSettings object for detailed settings",
        "Verify keyword_mappings collection has been seeded",
        "Ensure transaction classification uses enabledDeductions filter",
      ],
    })
  } catch (error: any) {
    console.error("❌ DEBUG: Error analyzing onboarding data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
