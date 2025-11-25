// ============================================
// MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
// ============================================
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ในการใช้งานจริงต้อง:
    // 1. ตรวจสอบ role ว่าเป็น admin หรือไม่
    // 2. ดึงสถานะจริงจาก database
    // 3. สถานะอาจเป็น: active, inactive, maintenance

    return NextResponse.json({
      statuses: {
        gold96_5: "active",
        gold99_99: "active",
        goldBar: "active",
        goldOrnament: "active",
      },
    })
  } catch (error) {
    console.error("Error fetching statuses:", error)
    return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 })
  }
}
