// ============================================
// MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
// ============================================
import { NextResponse } from "next/server"

// Mock wallet data (ในการใช้งานจริงต้องดึงจาก database ตาม user ที่ login)
const generateMockWallet = () => ({
  balances: {
    THB: Number((50000 + Math.random() * 10000).toFixed(2)),
    USD: Number((2000 + Math.random() * 500).toFixed(2)),
  },
  goldHoldings: {
    gold96_5: Number((10 + Math.random() * 5).toFixed(4)),
    gold99_99: Number((5 + Math.random() * 3).toFixed(4)),
    goldBar: Number((2 + Math.random() * 1).toFixed(4)),
    goldOrnament: Number((3 + Math.random() * 2).toFixed(4)),
  },
})

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ในการใช้งานจริงต้องดึงข้อมูล wallet จาก database ตาม userId
    const wallet = generateMockWallet()
    return NextResponse.json(wallet)
  } catch (error) {
    console.error("Error fetching wallet:", error)
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
  }
}
