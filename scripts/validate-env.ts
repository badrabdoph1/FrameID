const requiredVars = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "NEXT_PUBLIC_APP_URL",
]

let hasError = false

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`)
    hasError = true
  }
}

if (hasError) {
  console.error("\n❌ Environment validation failed. Check your .env file.")
  process.exit(1)
}

console.log("✅ All required environment variables are set.")
