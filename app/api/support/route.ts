import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  console.log("🔧 Creating SMTP transporter with config:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER ? "***configured***" : "missing",
    pass: process.env.SMTP_PASS ? "***configured***" : "missing",
  })

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Add these for better Gmail compatibility
    tls: {
      rejectUnauthorized: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, message } = body

    console.log("📧 Processing support request:", { email, name: name || "Anonymous" })

    // Debug environment variables
    console.log("🔍 Environment variables check:")
    console.log("SMTP_HOST:", process.env.SMTP_HOST)
    console.log("SMTP_PORT:", process.env.SMTP_PORT)
    console.log("SMTP_USER:", process.env.SMTP_USER ? "configured" : "missing")
    console.log("SMTP_PASS:", process.env.SMTP_PASS ? "configured" : "missing")
    console.log("FROM_EMAIL:", process.env.FROM_EMAIL)

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json({ success: false, error: "Email and message are required" }, { status: 400 })
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("❌ SMTP not configured - missing SMTP_USER or SMTP_PASS")
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured. Please contact support directly.",
        },
        { status: 500 },
      )
    }

    // Create support request object
    const supportRequest = {
      id: Date.now().toString(),
      email: email.trim(),
      name: name?.trim() || "Anonymous",
      message: message.trim(),
      timestamp: new Date().toISOString(),
      status: "pending",
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    }

    console.log("=== SUPPORT REQUEST RECEIVED ===")
    console.log("Request ID:", supportRequest.id)
    console.log("Email:", supportRequest.email)
    console.log("Name:", supportRequest.name)
    console.log("Message length:", supportRequest.message.length)
    console.log("Timestamp:", supportRequest.timestamp)

    // Send email notification
    try {
      console.log("📤 Attempting to send emails...")
      const transporter = createTransporter()

      // Test the connection first
      await transporter.verify()
      console.log("✅ SMTP connection verified successfully")

      // Email to support team (essabar.yasssine@gmail.com)
      const supportEmailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: "essabar.yasssine@gmail.com",
        subject: `🆘 New Support Request - ${supportRequest.name} (ID: ${supportRequest.id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
            <div style="background: linear-gradient(135deg, #BEF397, #7DD3FC); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
              <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">🆘 New Support Request</h1>
              <p style="color: #333; margin: 10px 0 0 0; font-size: 16px;">Immediate attention required</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 5px solid #BEF397;">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">📋 Request Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Request ID:</td><td style="padding: 8px 0; color: #333;">${supportRequest.id}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px 0; color: #333;">${supportRequest.name}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0; color: #333;"><a href="mailto:${supportRequest.email}" style="color: #007bff;">${supportRequest.email}</a></td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Timestamp:</td><td style="padding: 8px 0; color: #333;">${new Date(supportRequest.timestamp).toLocaleString()}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">IP Address:</td><td style="padding: 8px 0; color: #333;">${supportRequest.ip}</td></tr>
                </table>
              </div>
              
              <div style="background: #fff; padding: 20px; border-radius: 10px; border: 2px solid #BEF397;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">💬 User Message</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 1.6; color: #333; font-size: 15px;">
                  ${supportRequest.message.replace(/\n/g, "<br>")}
                </div>
              </div>
              
              <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 10px; text-align: center;">
                <p style="margin: 0; color: #1976d2; font-size: 16px; font-weight: bold;">
                  ⏰ Action Required: Please respond within 24 hours
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                  Reply directly to this email to respond to the user
                </p>
              </div>
            </div>
          </div>
        `,
      }

      // Confirmation email to user
      const userEmailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: supportRequest.email,
        subject: `✅ Support Request Received - We'll Get Back to You Soon! (ID: ${supportRequest.id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
            <div style="background: linear-gradient(135deg, #BEF397, #7DD3FC); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
              <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">✅ Thanks for Contacting Us!</h1>
              <p style="color: #333; margin: 10px 0 0 0; font-size: 16px;">Your message has been received</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">Hi ${supportRequest.name}! 👋</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.5;">We've received your support request and our team will get back to you within 24 hours.</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #BEF397;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📋 Your Request Summary</h3>
                <p style="margin: 5px 0; color: #555;"><strong>Request ID:</strong> <span style="color: #007bff; font-family: monospace;">${supportRequest.id}</span></p>
                <p style="margin: 5px 0; color: #555;"><strong>Submitted:</strong> ${new Date(supportRequest.timestamp).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #555;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Received ✅</span></p>
              </div>
              
              <div style="background: #fff; padding: 20px; border-radius: 10px; border: 2px solid #e9ecef; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">💬 Your Message:</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; color: #333; line-height: 1.6; font-size: 15px;">
                  ${supportRequest.message.replace(/\n/g, "<br>")}
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, #e8f5e8, #f0f8f0); padding: 25px; border-radius: 10px; text-align: center; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 20px;">🚀 What's Next?</h3>
                <p style="margin: 0 0 10px 0; color: #2e7d32; font-size: 16px; line-height: 1.5;">
                  Our support team will review your request and respond directly to this email address.
                </p>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Please keep this email for your records and reference the Request ID if you need to follow up.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Need immediate assistance?</p>
                <p style="margin: 0; color: #666; font-size: 14px;">You can also reach us through the app's support chat or reply to this email.</p>
              </div>
            </div>
          </div>
        `,
      }

      console.log("📤 Sending support team email to essabar.yasssine@gmail.com...")
      const supportEmailResult = await transporter.sendMail(supportEmailOptions)
      console.log("✅ Support team email sent successfully:", supportEmailResult.messageId)

      console.log("📤 Sending confirmation email to user:", supportRequest.email)
      const userEmailResult = await transporter.sendMail(userEmailOptions)
      console.log("✅ User confirmation email sent successfully:", userEmailResult.messageId)

      console.log("🎉 All emails sent successfully!")
    } catch (emailError) {
      console.error("❌ Error sending support emails:", emailError)

      // Return error if email fails - this is important for support requests
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email notification. Please try again or contact support directly.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Support request submitted and emails sent successfully",
      requestId: supportRequest.id,
    })
  } catch (error) {
    console.error("❌ Error processing support request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit support request. Please try again.",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Support API is running",
    smtp_configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    smtp_host: process.env.SMTP_HOST,
    smtp_user: process.env.SMTP_USER ? "configured" : "missing",
    endpoints: {
      POST: "Submit a support request",
      GET: "View support requests (admin only)",
    },
  })
}
