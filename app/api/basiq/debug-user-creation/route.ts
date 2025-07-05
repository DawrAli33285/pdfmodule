import { NextResponse } from "next/server"

const BASIQ_BASE_URL = "https://au-api.basiq.io"
const BASIQ_TOKEN =
  process.env.BASIQ_TOKEN ||
  "OTExZjU2OTctYTI5NS00NTYzLTg4NzAtMGZhMmQ1MGMzZGYyOjMwYzhlYTViLTU0MDgtNDVlNS1hNThlLWJmYWI3Mzg1Y2VjOQ=="

export async function GET() {
  try {
    console.log("=== DEBUGGING USER CREATION PROCESS ===")

    // Step 1: Get SERVER_ACCESS token
    console.log("Step 1: Getting SERVER_ACCESS token...")
    const tokenResponse = await fetch(`${BASIQ_BASE_URL}/token`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
        Authorization: `Basic ${BASIQ_TOKEN}`,
      },
      body: "scope=SERVER_ACCESS",
    })

    console.log("Token response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error("Token error:", tokenError)
      return NextResponse.json({
        success: false,
        step: "token_generation",
        error: tokenError,
      })
    }

    const tokenData = await tokenResponse.json()
    console.log("Token obtained successfully")
    console.log("Token type:", tokenData.token_type)
    console.log("Token preview:", tokenData.access_token?.substring(0, 20) + "...")

    // Step 2: Try to create a test user
    console.log("Step 2: Creating test user...")
    const testUserPayload = {
      email: "test@example.com",
      mobile: "+61400000000",
    }

    console.log("User payload:", testUserPayload)
    console.log("Using token:", tokenData.access_token?.substring(0, 20) + "...")

    const userResponse = await fetch(`${BASIQ_BASE_URL}/users`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "basiq-version": "3.0",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify(testUserPayload),
    })

    console.log("User creation response status:", userResponse.status)
    console.log("User creation response headers:", Object.fromEntries(userResponse.headers.entries()))

    const userResponseText = await userResponse.text()
    console.log("User creation response body:", userResponseText)

    if (userResponse.ok) {
      const userData = JSON.parse(userResponseText)
      return NextResponse.json({
        success: true,
        message: "User creation successful!",
        userId: userData.id,
        userEmail: userData.email,
        userMobile: userData.mobile,
      })
    } else {
      return NextResponse.json({
        success: false,
        step: "user_creation",
        status: userResponse.status,
        error: userResponseText,
        tokenUsed: tokenData.access_token?.substring(0, 20) + "...",
      })
    }
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Debug failed",
    })
  }
}
