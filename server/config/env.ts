export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development"
};

export function requireEnv(name: keyof typeof env) {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (isPlaceholderValue(value)) {
    throw new Error(`Environment variable ${name} still contains a placeholder value.`);
  }
  return value;
}

export function getMissingAdminSetup() {
  return [
    ["DATABASE_URL", env.databaseUrl],
    ["JWT_ACCESS_SECRET", env.jwtAccessSecret],
    ["JWT_REFRESH_SECRET", env.jwtRefreshSecret],
    ["ADMIN_ONE_EMAIL", process.env.ADMIN_ONE_EMAIL],
    ["ADMIN_ONE_PASSWORD", process.env.ADMIN_ONE_PASSWORD],
    ["ADMIN_TWO_EMAIL", process.env.ADMIN_TWO_EMAIL],
    ["ADMIN_TWO_PASSWORD", process.env.ADMIN_TWO_PASSWORD]
  ]
    .filter(([, value]) => !value || isPlaceholderValue(value))
    .map(([name]) => name);
}

export function getProductionEnvIssues() {
  const required = [
    ["DATABASE_URL", env.databaseUrl],
    ["JWT_ACCESS_SECRET", env.jwtAccessSecret],
    ["JWT_REFRESH_SECRET", env.jwtRefreshSecret],
    ["CLOUDINARY_CLOUD_NAME", env.cloudinaryCloudName],
    ["CLOUDINARY_API_KEY", env.cloudinaryApiKey],
    ["CLOUDINARY_API_SECRET", env.cloudinaryApiSecret],
    ["NEXT_PUBLIC_SITE_URL", env.nextPublicSiteUrl],
    ["ADMIN_ONE_EMAIL", process.env.ADMIN_ONE_EMAIL],
    ["ADMIN_ONE_PASSWORD", process.env.ADMIN_ONE_PASSWORD],
    ["ADMIN_TWO_EMAIL", process.env.ADMIN_TWO_EMAIL],
    ["ADMIN_TWO_PASSWORD", process.env.ADMIN_TWO_PASSWORD]
  ];

  const issues = required
    .filter(([, value]) => !value || isPlaceholderValue(value))
    .map(([name]) => name);

  if (env.nextPublicSiteUrl && !env.nextPublicSiteUrl.startsWith("https://")) {
    issues.push("NEXT_PUBLIC_SITE_URL must use https:// in production");
  }

  return issues;
}

export function assertProductionEnv() {
  if (env.nodeEnv !== "production") return;
  const issues = getProductionEnvIssues();
  if (issues.length > 0) {
    throw new Error(`Production environment is incomplete: ${issues.join(", ")}`);
  }
}

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("<") ||
    normalized.includes(">") ||
    normalized === "your-cloud" ||
    normalized === "your-key" ||
    normalized === "your-secret" ||
    normalized === "change-this-password" ||
    normalized === "change-this-password-too"
  );
}
