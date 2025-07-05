import { NextResponse } from "next/server"

const BASIQ_BASE_URL = "https://au-api.basiq.io"
const BASIQ_TOKEN =
  process.env.BASIQ_TOKEN ||
  "OTExZjU2OTctYTI5NS00NTYzLTg4NzAtMGZhMmQ1MGMzZGYyOjMwYzhlYTViLTU0MDgtNDVlNS1hNThlLWJmYWI3Mzg1Y2VjOQ=="

export async function GET() {
  try {
    console.log("Testing Basiq authentication with official format...")
    console.log("Token (first 20 chars):", BASIQ_TOKEN.substring(0, 20))
    console.log("Token length:", BASIQ_TOKEN.length)

    // Test using the exact format from Basiq documentation
    const response = await fetch(`${BASIQ_BASE_URL}/token`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
        Authorization: `Basic ${BASIQ_TOKEN}`,
      },
      body: "scope=SERVER_ACCESS",
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("Response body:", responseText)

    if (response.ok) {
      const data = JSON.parse(responseText)
      return NextResponse.json({
        success: true,
        message: "Authentication successful!",
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
        accessTokenPreview: data.access_token?.substring(0, 20) + "...",
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        status: response.status,
        response: responseText,
      })
    }
  } catch (error) {
    console.error("Auth test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
    })
  }
}
