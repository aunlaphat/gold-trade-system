// ============================================
// MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
// ============================================
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ในการใช้งานจริงต้อง:
    // 1. ตรวจสอบว่า user มีอยู่แล้วหรือไม่
    // 2. Hash password ด้วย bcrypt
    // 3. บันทึกลง database
    // 4. ส่ง email verification

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
