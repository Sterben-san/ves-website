const baseUrl = process.env.VES_BASE_URL ?? "http://localhost:3000";
const checks = [];

function log(status, name, detail) {
  const marker = status === "pass" ? "PASS" : status === "warn" ? "WARN" : "FAIL";
  checks.push({ status, name, detail });
  console.log(`[runtime-routes:${marker}] ${name}${detail ? ` - ${detail}` : ""}`);
}

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...init });
  return {
    status: response.status,
    location: response.headers.get("location"),
    contentType: response.headers.get("content-type") ?? "",
    body: await response.text()
  };
}

async function expectStatus(path, expected, label = path) {
  try {
    const response = await request(path);
    if (expected.includes(response.status)) {
      log("pass", label, `${path} -> ${response.status}${response.location ? ` (${response.location})` : ""}`);
    } else {
      log("fail", label, `${path} expected ${expected.join("/")} but got ${response.status}`);
    }
    return response;
  } catch (error) {
    log("fail", label, `${path} request failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const publicPages = ["/", "/about", "/projects", "/certifications", "/news", "/internships", "/social", "/contact"];
for (const path of publicPages) {
  await expectStatus(path, [200], `Public page ${path}`);
}
await expectStatus("/solutions", [307, 308], "Solutions redirect page");

const publicApis = ["/api/media", "/api/projects", "/api/announcements", "/api/announcements/pinned", "/api/internships", "/api/social", "/api/team"];
for (const path of publicApis) {
  const response = await expectStatus(path, [200], `Public API ${path}`);
  if (response && !response.contentType.includes("application/json")) {
    log("fail", `Public API ${path} content type`, response.contentType || "missing content type");
  }
}

const adminPages = [
  "/admin/dashboard",
  "/admin/dashboard/media",
  "/admin/dashboard/homepage-news",
  "/admin/dashboard/announcements",
  "/admin/dashboard/internships",
  "/admin/dashboard/projects",
  "/admin/dashboard/certificates",
  "/admin/dashboard/field-process",
  "/admin/dashboard/team",
  "/admin/dashboard/social"
];
await expectStatus("/admin/login", [200], "Admin login page");
for (const path of adminPages) {
  const response = await expectStatus(path, [307, 308], `Admin page auth redirect ${path}`);
  if (response && response.location !== "/admin/login") {
    log("fail", `Admin page redirect target ${path}`, `Expected /admin/login but got ${response.location}`);
  }
}

const adminApis = [
  "/api/admin/me",
  "/api/admin/homepage-news",
  "/api/admin/announcements",
  "/api/admin/internships",
  "/api/admin/projects",
  "/api/admin/certificates",
  "/api/admin/field-process",
  "/api/admin/team",
  "/api/admin/social"
];
for (const path of adminApis) {
  await expectStatus(path, [401], `Admin API rejects anonymous ${path}`);
}

try {
  const loginPage = await request("/admin/login");
  const hasSetupWarning =
    loginPage.body.includes("DATABASE_URL") && loginPage.body.includes("npm run prisma:migrate") && loginPage.body.includes("npm run seed");
  const hasLoginForm = loginPage.body.includes("Admin login") || loginPage.body.includes("Email") || loginPage.body.includes("Password");
  if (hasSetupWarning) {
    log("pass", "Admin setup warning", "Missing database guidance is visible and migration-aware");
  } else if (hasLoginForm) {
    log("pass", "Admin setup warning", "Hidden because admin setup is configured");
  } else {
    log("fail", "Admin setup warning", "Login page shows neither setup guidance nor the login form");
  }
} catch (error) {
  log("fail", "Admin setup warning", `/admin/login request failed: ${error instanceof Error ? error.message : String(error)}`);
}

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");
console.log(`[runtime-routes:SUMMARY] ${checks.length} checks, ${failures.length} failures, ${warnings.length} warnings`);

if (failures.length > 0) process.exit(1);
