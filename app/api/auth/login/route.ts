// ============================================
// MOCK API - ต้องลบและเชื่อมต่อกับ backend จริงในภายหลัง
// ============================================
import { NextResponse } from "next/server"

// Mock user database (ข้อมูลผู้ใช้ทดสอบ - ต้องเชื่อมต่อกับ database จริง)
const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    username: "admin",
    password: "admin123", // ในการใช้งานจริงต้อง hash password
    role: "admin" as const,
  },
  {
    id: "2",
    email: "user@example.com",
    username: "user",
    password: "user123",
    role: "user" as const,
  },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // ค้นหา user จาก email หรือ username
    const user = mockUsers.find((u) => (u.email === email || u.username === email) && u.password === password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // สร้าง mock JWT token (ในการใช้งานจริงต้องใช้ JWT library จริง)
    const token = Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 ชั่วโมง
      }),
    ).toString("base64")

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
