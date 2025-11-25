import { NextResponse } from "next/server"

// ============================================
// MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
// ============================================

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // ** rest of code here **

    return NextResponse.json({
      success: true,
      message: "Withdrawal successful",
      newBalance: -amount,
    })
  } catch (error) {
    console.error("Withdrawal error:", error)
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 })
  }
}
