import { NextResponse } from "next/server"

// Mock current gold prices
const generateMockPrices = () => {
  const basePrice = 2000 + Math.random() * 100

  return {
    timestamp: Date.now(),
    prices: {
      gold96_5: {
        buy: Number((basePrice * 0.965).toFixed(2)),
        sell: Number((basePrice * 0.965 * 1.02).toFixed(2)),
        status: "active",
      },
      gold99_99: {
        buy: Number(basePrice.toFixed(2)),
        sell: Number((basePrice * 1.02).toFixed(2)),
        status: "active",
      },
      goldBar: {
        buy: Number((basePrice * 0.98).toFixed(2)),
        sell: Number((basePrice * 0.98 * 1.02).toFixed(2)),
        status: "active",
      },
      goldOrnament: {
        buy: Number((basePrice * 0.95).toFixed(2)),
        sell: Number((basePrice * 0.95 * 1.02).toFixed(2)),
        status: "active",
      },
    },
  }
}

// ============================================
// MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
// ============================================

export async function GET() {
  try {
    const prices = generateMockPrices()
    return NextResponse.json(prices)
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
}
