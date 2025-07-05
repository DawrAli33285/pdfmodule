import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form fields
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const message = formData.get("message") as string
    const service = formData.get("service") as string // Declare the service variable

    console.log("📧 Processing CPA contact request:", { name, email })

    // Validate required fields
    if (!name || !email || !message ) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, message, and service are required",
        },
        { status: 400 },
      )
    }

    // Extract attachments
    const attachments: { filename: string; content: Buffer; contentType: string }[] = []
    let attachmentIndex = 0

    while (formData.has(`attachment_${attachmentIndex}`)) {
      const file = formData.get(`attachment_${attachmentIndex}`) as File
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type || "application/octet-stream",
        })
      }
      attachmentIndex++
    }

    console.log(`📎 Found ${attachments.length} attachments`)

    // Check SMTP configuration
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const fromEmail = process.env.FROM_EMAIL

    if (!smtpUser || !smtpPass) {
      console.log("❌ SMTP not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured",
        },
        { status: 500 },
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number.parseInt(smtpPort || "587"),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // Verify SMTP connection
    try {
      await transporter.verify()
      console.log("✅ SMTP connection verified")
    } catch (verifyError) {
      console.error("❌ SMTP verification failed:", verifyError)
      return NextResponse.json(
        {
          success: false,
          error: "Email service connection failed",
        },
        { status: 500 },
      )
    }

    // Generate request ID
    const requestId = `CPA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })

    // Get service details
    const serviceDetails = {
      basic: { name: "Basic Tax Return", price: "$199" },
      comprehensive: { name: "Comprehensive Tax Service", price: "$399" },
      business: { name: "Business Tax Package", price: "$599" },
      consultation: { name: "Tax Consultation", price: "$150/hour" },
      audit: { name: "Audit Support", price: "$250/hour" },
    }[service] || { name: service, price: "Custom" }

    // Email to CPA team
    const cpaEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #BEF397, #7DD3FC); padding: 20px; text-align: center; }
            .header h1 { color: #000; margin: 0; }
            .content { padding: 20px; background: #f9f9f9; }
            .info-box { background: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #BEF397; }
            .urgent { border-left-color: #ff4444; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎯 New CPA Service Request</h1>
          </div>
          <div class="content">
            <div class="info-box">
              <h3>📋 Request Details</h3>
              <p><strong>Request ID:</strong> ${requestId}</p>
              <p><strong>Timestamp:</strong> ${timestamp}</p>
              <p><strong>Service:</strong> ${serviceDetails.name} (${serviceDetails.price})</p>
            </div>
            
            <div class="info-box">
              <h3>👤 Client Information</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            </div>
            
            <div class="info-box">
              <h3>💬 Message</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            
            ${
              attachments.length > 0
                ? `
            <div class="info-box">
              <h3>📎 Attachments (${attachments.length})</h3>
              <ul>
                ${attachments.map((att) => `<li>${att.filename} (${att.contentType})</li>`).join("")}
              </ul>
            </div>
            `
                : ""
            }
            
            <div class="info-box">
              <h3>🔧 Technical Details</h3>
              <p><strong>User Agent:</strong> ${request.headers.get("user-agent") || "Not available"}</p>
              <p><strong>IP Address:</strong> ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Not available"}</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from the Tax Deduction Tracker CPA service system.</p>
          </div>
        </body>
      </html>
    `

    // Email to client (confirmation)
    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #BEF397, #7DD3FC); padding: 20px; text-align: center; }
            .header h1 { color: #000; margin: 0; }
            .content { padding: 20px; background: #f9f9f9; }
            .info-box { background: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #7DD3FC; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ CPA Service Request Received</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>Thank you for your interest in our professional tax services! We've received your request and one of our certified CPAs will contact you soon.</p>
            
            <div class="info-box">
              <h3>📋 Your Request Summary</h3>
              <p><strong>Request ID:</strong> ${requestId}</p>
              <p><strong>Submitted:</strong> ${timestamp}</p>
              <p><strong>Contact Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
              <p><strong>Service:</strong> ${serviceDetails.name} (${serviceDetails.price})</p>
            </div>
            
            <div class="info-box">
              <h3>⏰ What Happens Next?</h3>
              <ul>
                <li>A certified CPA will review your request within 1-2 business days</li>
                <li>We'll contact you via email or phone</li>
                <li>We'll discuss your specific tax situation and provide a detailed quote</li>
                <li>You can schedule a consultation at your convenience</li>
              </ul>
            </div>
            
            ${
              attachments.length > 0
                ? `
            <div class="info-box">
              <h3>📎 Uploaded Documents</h3>
              <p>We received ${attachments.length} document(s) with your request:</p>
              <ul>
                ${attachments.map((att) => `<li>${att.filename}</li>`).join("")}
              </ul>
            </div>
            `
                : ""
            }
            
            <div class="info-box">
              <h3>💡 In the Meantime</h3>
              <p>Feel free to continue using our Tax Deduction Tracker to identify more potential savings. The more organized your financial information, the better we can help you!</p>
            </div>
            
            <p>We look forward to helping you maximize your tax savings!</p>
            <p>Best regards,<br>The CPA Team<br>Tax Deduction Tracker</p>
          </div>
          <div class="footer">
            <p>Please keep this email for your records. Reference ID: ${requestId}</p>
            <p>Questions? Reply to this email or call 1300 TAX HELP</p>
          </div>
        </body>
      </html>
    `

    try {
      // Send email to CPA team
      console.log("📤 Sending CPA team email...")
      const cpaEmailResult = await transporter.sendMail({
        from: fromEmail || smtpUser,
        to: "essabar.yasssine@gmail.com",
        subject: `🎯 CPA Service Request - ${requestId}`,
        html: cpaEmailHtml,
        attachments: attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
        text: `New CPA Service Request\n\nRequest ID: ${requestId}\nClient: ${name} (${email})\nPhone: ${phone || "Not provided"}\nService: ${serviceDetails.name} (${serviceDetails.price})\n\nTimestamp: ${timestamp}\n\nMessage:\n${message}\n\nAttachments: ${attachments.length} file(s)`,
      })
      console.log("✅ CPA team email sent:", cpaEmailResult.messageId)

      // Send confirmation email to client
      console.log("📤 Sending client confirmation email...")
      const clientEmailResult = await transporter.sendMail({
        from: fromEmail || smtpUser,
        to: email,
        subject: `✅ CPA Service Request Received - ${requestId}`,
        html: clientEmailHtml,
        text: `Hi ${name},\n\nThank you for your interest in our professional tax services! We've received your request and one of our certified CPAs will contact you soon.\n\nRequest ID: ${requestId}\nSubmitted: ${timestamp}\nService: ${serviceDetails.name} (${serviceDetails.price})\n\nWe'll contact you within 1-2 business days via email or phone.\n\nBest regards,\nThe CPA Team`,
      })
      console.log("✅ Client confirmation email sent:", clientEmailResult.messageId)

      console.log("🎉 All CPA emails sent successfully!")

      return NextResponse.json({
        success: true,
        requestId,
        message: "CPA service request submitted successfully",
      })
    } catch (emailError) {
      console.error("❌ Error sending CPA emails:", emailError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email notification",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ CPA contact API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Health check endpoint
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS)

  return NextResponse.json({
    status: "CPA Contact API is running",
    smtpConfigured,
    timestamp: new Date().toISOString(),
  })
}
