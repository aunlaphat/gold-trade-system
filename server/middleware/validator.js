import validator from "validator"

export function sanitizeInput(input) {
  if (typeof input === "string") {
    // Remove potential NoSQL injection characters
    return validator.escape(input.trim())
  }
  return input
}

export function validateEmail(email) {
  if (!email || !validator.isEmail(email)) {
    throw new Error("Invalid email format")
  }
  return sanitizeInput(email)
}

export function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 30) {
    throw new Error("Username must be 3-30 characters")
  }
  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error("Username can only contain letters, numbers, and underscore")
  }
  return sanitizeInput(username)
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }
  // Check for at least one number and one letter
  if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
    throw new Error("Password must contain at least one letter and one number")
  }
  return password
}

export function validateAmount(amount) {
  const num = Number(amount)
  if (isNaN(num) || num <= 0) {
    throw new Error("Amount must be a positive number")
  }
  if (num > 1000000000) {
    // Prevent overflow
    throw new Error("Amount is too large")
  }
  return num
}

export function validateGoldType(goldType) {
  const validTypes = ["SPOT", "GOLD_9999", "GOLD_965", "GOLD_9999_MTS", "GOLD_965_MTS", "GOLD_965_ASSO"]
  if (!validTypes.includes(goldType)) {
    throw new Error("Invalid gold type")
  }
  return goldType
}

export function validateCurrency(currency) {
  const validCurrencies = ["THB", "USD"]
  if (!validCurrencies.includes(currency)) {
    throw new Error("Invalid currency. Must be THB or USD")
  }
  return currency
}

export function validateAction(action) {
  const validActions = ["BUY", "SELL"]
  if (!validActions.includes(action)) {
    throw new Error("Invalid action. Must be BUY or SELL")
  }
  return action
}
