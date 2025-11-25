import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
    const transactions = []
    const goldTypes = ["gold96_5", "gold99_99", "goldBar", "goldOrnament"]
    const actions = ["BUY", "SELL"]

    for (let i = 0; i < 10; i++) {
      const goldType = goldTypes[Math.floor(Math.random() * goldTypes.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const amount = Number((Math.random() * 5 + 0.1).toFixed(4))
      const price = 2000 + Math.random() * 100

      transactions.push({
        id: `tx_${Date.now()}_${i}`,
        goldType,
        action,
        amount,
        price: Number(price.toFixed(2)),
        total: Number((price * amount).toFixed(2)),
        currency: "THB",
        timestamp: Date.now() - i * 3600000,
        status: "completed",
      })
    }

    return NextResponse.json({
      transactions,
    })
  } catch (error) {
    console.error("Error fetching transaction history:", error)
    return NextResponse.json({ error: "Failed to fetch transaction history" }, { status: 500 })
  }
}
