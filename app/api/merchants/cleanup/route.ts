import { NextResponse } from "next/server"
import { merchantModel } from "@/lib/models/merchant"

export async function POST() {
  try {
    console.log("🧹 Starting merchant cleanup...")

    const removedCount = await merchantModel.removeDuplicates()

    return NextResponse.json({
      success: true,
      message: `Removed ${removedCount} duplicate merchants`,
      removedCount,
    })
  } catch (error) {
    console.error("Error cleaning up merchants:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
