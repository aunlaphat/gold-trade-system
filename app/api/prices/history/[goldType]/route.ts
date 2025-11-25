import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { goldType: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const goldType = params.goldType

    // ============================================
    // MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
    // ============================================
    // Generate mock historical data
    const basePrice = 2000
    const dataPoints = 100
    const history = []

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = Date.now() - (dataPoints - i) * 3600000 // Hourly data
      const variation = Math.sin(i / 10) * 50 + Math.random() * 20
      const price = basePrice + variation

      history.push({
        timestamp,
        price: Number(price.toFixed(2)),
        buy: Number((price * 0.99).toFixed(2)),
        sell: Number((price * 1.01).toFixed(2)),
      })
    }

    return NextResponse.json({
      goldType,
      history,
    })
  } catch (error) {
    console.error("Error fetching price history:", error)
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 })
  }
}
