import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { connectToDatabase } from "@/lib/mongodb"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("🎯 Received Stripe webhook event:", event.type)

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session

        console.log("💳 Payment successful:", {
          sessionId: session.id,
          amount: session.amount_total,
          customerEmail: session.customer_details?.email,
          paymentStatus: session.payment_status,
        })

        // Update user subscription in database ONLY if payment is successful
        if (session.customer_details?.email && session.payment_status === "paid") {
          try {
            console.log("🔌 Connecting to database to update subscription...")
            const { db } = await connectToDatabase()
            const users = db.collection("users")

            // Find user by email
            const user = await users.findOne({
              email: session.customer_details.email.toLowerCase(),
            })

            if (user) {
              console.log("👤 Found user to update:", user.email)
              console.log("📊 Current subscription before update:", JSON.stringify(user.subscription, null, 2))

              // Determine plan type based on amount
              let planType = "ai" // Default to AI plan
              if (session.amount_total === 39900) {
                // $399.00 in cents
                planType = "cpa"
              }

              console.log("💰 Detected plan type based on amount:", {
                amount: session.amount_total,
                planType,
              })

              // CRITICAL: Update subscription plan to "premium"
              const updateData = {
                "subscription.plan": "premium", // THIS IS THE KEY UPDATE
                "subscription.planType": planType,
                "subscription.status": "active",
                "subscription.upgradeDate": new Date(),
                "subscription.startDate": new Date(),
                "subscription.stripeSessionId": session.id,
                "subscription.paymentMethod": "stripe_checkout",
                "subscription.amount": session.amount_total,
                updatedAt: new Date(),
              }

              console.log("🔄 Updating user subscription with data:", JSON.stringify(updateData, null, 2))

              const result = await users.updateOne({ _id: user._id }, { $set: updateData })

              console.log("📈 Database update result:", {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                acknowledged: result.acknowledged,
              })

              if (result.modifiedCount > 0) {
                // Verify the update worked
                const updatedUser = await users.findOne({ _id: user._id })
                console.log(
                  "✅ VERIFICATION - User subscription after update:",
                  JSON.stringify(updatedUser?.subscription, null, 2),
                )

                if (updatedUser?.subscription?.plan === "premium") {
                  console.log("🎉 SUCCESS! User subscription updated to PREMIUM:", {
                    email: user.email,
                    planType,
                    plan: updatedUser.subscription.plan,
                  })
                } else {
                  console.error("❌ FAILED! Subscription plan is still:", updatedUser?.subscription?.plan)
                }
              } else {
                console.error("❌ No documents were modified in the update")
              }
            } else {
              console.error("❌ User not found for email:", session.customer_details.email)
            }
          } catch (dbError) {
            console.error("💥 Database error updating subscription:", dbError)
          }
        } else {
          console.log("⚠️ Skipping database update - payment not completed or no email")
        }
        break

      case "payment_intent.payment_failed":
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("❌ Payment failed:", paymentIntent.id)
        break

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("💥 Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
