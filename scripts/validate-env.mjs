import { existsSync, readFileSync } from "node:fs";

const required = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_ONE_EMAIL",
  "ADMIN_ONE_PASSWORD",
  "ADMIN_TWO_EMAIL",
  "ADMIN_TWO_PASSWORD"
];

const placeholderValues = new Set(["your-cloud", "your-key", "your-secret", "change-this-password", "change-this-password-too"]);

loadLocalEnv();

if (process.env.VES_DEPLOY_DEBUG === "1") {
  console.log(
    `[validate-env] NODE_ENV=${process.env.NODE_ENV ?? "unset"} PORT=${process.env.PORT ?? "unset"} required=${required
      .map((name) => `${name}:${process.env[name] ? "set" : "missing"}`)
      .join(",")}`
  );
}

const issues = required.filter((name) => {
  const value = process.env[name]?.trim();
  return !value || (process.env.NODE_ENV === "production" && isPlaceholderValue(value));
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
if (siteUrl && !siteUrl.startsWith("https://") && process.env.NODE_ENV === "production") {
  issues.push("NEXT_PUBLIC_SITE_URL must use https:// in production");
}

if (issues.length > 0) {
  console.error(`Production environment is incomplete: ${issues.join(", ")}`);
  process.exit(1);
}

function loadLocalEnv() {
  if (process.env.NODE_ENV === "production") return;

  for (const fileName of [".env.local", ".env"]) {
    if (!existsSync(fileName)) continue;

    const lines = readFileSync(fileName, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] !== undefined) continue;

      process.env[key] = stripQuotes(rawValue);
    }
  }
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function isPlaceholderValue(value) {
  return value.includes("<") || value.includes(">") || placeholderValues.has(value.toLowerCase());
}
