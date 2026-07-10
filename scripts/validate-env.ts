type EnvCheck = {
  name: string;
  required?: boolean;
  validate?: (value: string) => string | null;
};

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

const requiredChecks: EnvCheck[] = [
  {
    name: "DATABASE_URL",
    required: true,
    validate: (value) => isPostgresUrl(value) ? null : "DATABASE_URL must be a valid PostgreSQL connection URL.",
  },
  {
    name: "SESSION_SECRET",
    required: true,
    validate: (value) => value.length >= 32 ? null : "SESSION_SECRET should be at least 32 characters.",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: true,
    validate: (value) => isUrl(value) ? null : "NEXT_PUBLIC_APP_URL must be a valid absolute URL.",
  },
];

const optionalGroups = [
  {
    label: "SMTP email delivery",
    vars: ["SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"],
  },
  {
    label: "super admin phone login seed",
    vars: ["SEED_SUPER_ADMIN_PHONE"],
  },
];

let hasError = false;

for (const check of requiredChecks) {
  const value = process.env[check.name];
  if (check.required && !value) {
    console.error(`❌ Missing required environment variable: ${check.name}`);
    hasError = true;
    continue;
  }

  if (value && check.validate) {
    const message = check.validate(value);
    if (message) {
      console.error(`❌ Invalid ${check.name}: ${message}`);
      hasError = true;
    }
  }
}

for (const group of optionalGroups) {
  const present = group.vars.filter((name) => Boolean(process.env[name]));
  if (present.length > 0 && present.length < group.vars.length) {
    const missing = group.vars.filter((name) => !process.env[name]);
    console.warn(`⚠️ Incomplete optional config for ${group.label}. Missing: ${missing.join(", ")}`);
  }
}

if (hasError) {
  console.error("\n❌ Environment validation failed. Check your environment variables.");
  process.exit(1);
}

console.log("✅ Environment validation passed.");
