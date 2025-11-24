import express from "express"
import { User } from "../models/User.js"
import { generateToken } from "../middleware/auth.js"

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Validation Error", details: "All fields are required" })
    }

    // Check if email already exists
    const existingEmailUser = await User.findByEmail(email)
    if (existingEmailUser) {
      return res.status(400).json({ error: "Registration Error", details: "Email already registered", field: "email" })
    }

    // Check if username already exists
    const existingUsernameUser = await User.findByUsername(username)
    if (existingUsernameUser) {
      return res.status(400).json({ error: "Registration Error", details: "Username already taken", field: "username" })
    }

    // Create user
    const user = await User.create({ email, username, password })
    const token = generateToken(user._id, user.role) // Pass role to generateToken

    res.status(201).json({
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      token,
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({ error: "Registration failed", details: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Validation Error", details: "Email and password are required" })
    }

    // Find user
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({ error: "Authentication Failed", details: "Invalid credentials" })
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Authentication Failed", details: "Invalid credentials" })
    }

    const token = generateToken(user._id, user.role) // Pass role to generateToken

    res.json({
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed", details: error.message })
  }
})

export default router
