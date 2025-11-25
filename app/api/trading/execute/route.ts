import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { goldType, action, amount, currency } = body

    if (!goldType || !action || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Mock trade execution
    const price = 2000 + Math.random() * 100
    const total = price * amount

    // ============================================
    // MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
    // ============================================

    return NextResponse.json({
      success: true,
      trade: {
        id: `trade_${Date.now()}`,
        goldType,
        action,
        amount,
        currency,
        price: Number(price.toFixed(2)),
        total: Number(total.toFixed(2)),
        timestamp: Date.now(),
        status: "completed",
      },
    })
  } catch (error) {
    console.error("Trade execution error:", error)
    return NextResponse.json({ error: "Failed to execute trade" }, { status: 500 })
  }
}
