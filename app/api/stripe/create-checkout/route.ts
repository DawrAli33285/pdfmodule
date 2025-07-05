import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { planType } = await request.json()

    console.log("🚀 Creating Stripe checkout for plan:", planType)

    // Define payment links for each plan
    const paymentLinks = {
      ai: process.env.STRIPE_AI_PAYMENT_LINK || "https://buy.stripe.com/test_4gM9AVakE1gzcE54Lvf3a00",
      cpa: process.env.STRIPE_CPA_PAYMENT_LINK || "https://buy.stripe.com/test_dRm28t3Wg4sLfQhcdXf3a01",
    }

    const paymentLink = paymentLinks[planType as keyof typeof paymentLinks]

    if (!paymentLink) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    console.log("💳 Redirecting to payment link:", paymentLink)

    // Store plan type in localStorage for success page
    const response = NextResponse.json({
      success: true,
      paymentUrl: paymentLink,
      planType,
    })

    return response
  } catch (error) {
    console.error("💥 Error creating checkout:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
