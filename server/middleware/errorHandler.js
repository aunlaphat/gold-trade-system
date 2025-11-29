export class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export function errorHandler(err, req, res, next) {
  let { statusCode = 500, message, details } = err

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && !err.isOperational) {
    message = "Something went wrong"
    details = null
  }

  // Log error for debugging
  if (statusCode >= 500) {
    console.error("[Error]", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.userId,
    })
  }

  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

// Async error wrapper to avoid try-catch in every route
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
