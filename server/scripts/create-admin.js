import { getDatabase, connectDatabase } from "../config/database.js"
import { User } from "../models/User.js"
import dotenv from "dotenv"

dotenv.config()

const createAdminUser = async () => {
  await connectDatabase()

  const adminEmail = process.env.ADMIN_EMAIL
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD

  try {
    let adminUser = await User.findByEmail(adminEmail)

    if (!adminUser) {
      console.log("Admin user not found. Creating new admin user...")
      adminUser = await User.create({
        email: adminEmail,
        username: adminUsername,
        password: adminPassword,
        role: "admin",
      })
      console.log(`Admin user "${adminUsername}" created successfully with email "${adminEmail}".`)
    } else {
      console.log(`Admin user "${adminUsername}" with email "${adminEmail}" already exists.`)
      // Optionally update role if it's not admin
      if (adminUser.role !== "admin") {
        await getDatabase().collection("users").updateOne(
          { _id: adminUser._id },
          { $set: { role: "admin", updatedAt: new Date() } }
        )
        console.log(`Updated role for user "${adminUsername}" to "admin".`)
      }
    }
  } catch (error) {
    console.error("Error creating/checking admin user:", error)
    process.exit(1)
  } finally {
    // It's good practice to close the database connection if this script is run standalone
    // However, if it's part of a larger process, you might not want to close it here.
    // For now, we'll assume it's standalone.
    // If using a client, you might need to call client.close()
    // For simplicity, we'll let the process exit.
  }
}

createAdminUser().then(() => {
  console.log("Admin user setup complete.")
  process.exit(0)
})
