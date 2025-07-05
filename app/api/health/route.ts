import { NextResponse } from "next/server"

export async function GET() {
  console.log("🔍 Health check: API route working")
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      message: "API routes are working correctly",
      environment: process.env.NODE_ENV,
    },
    { status: 200 },
  )
}

export async function POST() {
  console.log("🔍 Health check: POST method working")
  return NextResponse.json(
    {
      status: "healthy",
      method: "POST",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
