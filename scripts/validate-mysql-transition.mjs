import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function log(status, name, detail) {
  const marker = status === "pass" ? "PASS" : status === "warn" ? "WARN" : "FAIL";
  checks.push({ status, name, detail });
  console.log(`[mysql-transition:${marker}] ${name}${detail ? ` - ${detail}` : ""}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function rg(pattern, paths = ["."]) {
  try {
    const output = execFileSync(
      "rg",
      ["-n", pattern, ...paths, "--glob", "!node_modules/**", "--glob", "!.next/**", "--glob", "!package-lock.json", "--glob", "!scripts/validate-mysql-transition.mjs"],
      { encoding: "utf8" }
    );
    return output.trim();
  } catch (error) {
    if (error.status === 1) return "";
    throw error;
  }
}

function packageJson() {
  return JSON.parse(read("package.json"));
}

function envKeysFromLocal() {
  if (!existsSync(".env.local")) return new Set();
  return new Set(
    read(".env.local")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.slice(0, line.indexOf("=")).trim())
  );
}

const pkg = packageJson();

if (pkg.dependencies?.mongoose || pkg.dependencies?.mongodb || pkg.devDependencies?.mongoose || pkg.devDependencies?.mongodb) {
  log("fail", "Mongo packages removed", "mongoose/mongodb still exists in package.json");
} else {
  log("pass", "Mongo packages removed", "package.json no longer depends on mongoose or mongodb");
}

if (pkg.dependencies?.["@prisma/client"] && pkg.dependencies?.mysql2 && pkg.devDependencies?.prisma) {
  log("pass", "Prisma/MySQL packages present", `@prisma/client ${pkg.dependencies["@prisma/client"]}, mysql2 ${pkg.dependencies.mysql2}`);
} else {
  log("fail", "Prisma/MySQL packages present", "Missing @prisma/client, prisma, or mysql2");
}

for (const scriptName of ["prisma:generate", "prisma:migrate", "postinstall", "seed", "build", "start"]) {
  if (pkg.scripts?.[scriptName]) {
    log("pass", `package script ${scriptName}`, pkg.scripts[scriptName]);
  } else {
    log("fail", `package script ${scriptName}`, "Missing script");
  }
}

const staleReferences = rg("MONGODB_URI|mongoose|Mongoose|MongoDB|mongodb|connectMongo|server/infrastructure/mongo", [
  "app",
  "lib",
  "server",
  "scripts",
  "prisma",
  "README.md",
  "AGENTS.md",
  "VES_FULL_PROJECT_HANDOFF.md"
]);
if (staleReferences) {
  log("fail", "No stale Mongo references", staleReferences.split("\n").slice(0, 8).join(" | "));
} else {
  log("pass", "No stale Mongo references", "source/docs scan is clean");
}

const schema = read("prisma/schema.prisma");
const expectedModels = [
  "Admin",
  "SectionMedia",
  "SectionCopy",
  "Project",
  "Announcement",
  "HomepageNewsItem",
  "InternshipUpdate",
  "SocialLink",
  "TeamMember",
  "FieldProcessStep",
  "Certificate",
  "SeedState"
];
const missingModels = expectedModels.filter((model) => !schema.includes(`model ${model} `));
if (missingModels.length > 0) {
  log("fail", "Prisma model coverage", `Missing: ${missingModels.join(", ")}`);
} else {
  log("pass", "Prisma model coverage", `${expectedModels.length} expected models present`);
}

const container = read("server/config/container.ts");
if (container.includes("Prisma") && !container.includes("Mongo")) {
  log("pass", "DI container uses Prisma repositories", "No Mongo repository references found in container");
} else {
  log("fail", "DI container uses Prisma repositories", "Container still references Mongo or lacks Prisma repositories");
}

const dbConfig = read("server/config/db.ts");
if (dbConfig.includes("DATABASE_URL") || dbConfig.includes("databaseUrl")) {
  log("pass", "DB config reads DATABASE_URL", "Prisma singleton is env-driven");
} else {
  log("fail", "DB config reads DATABASE_URL", "DATABASE_URL/databaseUrl not found");
}

const adminLoginPage = read("app/admin/login/page.tsx");
if (adminLoginPage.includes("npm run prisma:migrate") && adminLoginPage.includes("npm run seed")) {
  log("pass", "Admin setup instructions mention migrate and seed", "Login warning matches Prisma/MySQL setup flow");
} else {
  log("fail", "Admin setup instructions mention migrate and seed", "Login warning is missing migration or seed guidance");
}

const homepage = read("app/(public)/page.tsx");
const latestUpdates = read("app/(public)/components/LatestUpdates.tsx");
if (homepage.includes("getPublishedHomepageNewsItems") && latestUpdates.includes("HomepageNewsItem") && !latestUpdates.includes("Announcement")) {
  log("pass", "Homepage News separated from Announcements", "Homepage carousel uses HomepageNewsItem");
} else {
  log("fail", "Homepage News separated from Announcements", "Homepage carousel may still be coupled to Announcement");
}

const envKeys = envKeysFromLocal();
if (!envKeys.has("DATABASE_URL")) {
  log("warn", ".env.local DATABASE_URL", "Missing locally; database-backed admin flows cannot be tested until Hostinger MySQL URL is added");
} else {
  log("pass", ".env.local DATABASE_URL", "Present; value redacted");
}
if (envKeys.has("MONGODB_URI")) {
  log("warn", ".env.local old Mongo key", "MONGODB_URI still exists locally; remove after confirming DATABASE_URL works");
}

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");
console.log(`[mysql-transition:SUMMARY] ${checks.length} checks, ${failures.length} failures, ${warnings.length} warnings`);

if (failures.length > 0) {
  process.exit(1);
}
