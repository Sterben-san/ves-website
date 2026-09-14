import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function log(status, name, detail) {
  const marker = status === "pass" ? "PASS" : status === "warn" ? "WARN" : "FAIL";
  checks.push({ status, name, detail });
  console.log(`[feature-surface:${marker}] ${name}${detail ? ` - ${detail}` : ""}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function exists(path) {
  return existsSync(path);
}

function findFiles(command, args) {
  return execFileSync(command, args, { encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function exportedMethods(source) {
  const methods = [];
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    if (new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(source)) methods.push(method);
  }
  return methods;
}

const publicPages = [
  "app/(public)/page.tsx",
  "app/(public)/about/page.tsx",
  "app/(public)/projects/page.tsx",
  "app/(public)/certifications/page.tsx",
  "app/(public)/news/page.tsx",
  "app/(public)/news/[slug]/page.tsx",
  "app/(public)/internships/page.tsx",
  "app/(public)/social/page.tsx",
  "app/(public)/contact/page.tsx",
  "app/(public)/solutions/page.tsx",
  "app/(public)/solutions/[slug]/page.tsx"
];

const missingPublicPages = publicPages.filter((path) => !exists(path));
if (missingPublicPages.length) {
  log("fail", "Public pages exist", `Missing: ${missingPublicPages.join(", ")}`);
} else {
  log("pass", "Public pages exist", `${publicPages.length} public routes present`);
}

const adminFeatures = [
  {
    name: "Section Media",
    page: "app/admin/(dashboard)/dashboard/media/page.tsx",
    apis: ["app/api/admin/media/[sectionKey]/route.ts"]
  },
  {
    name: "Homepage News",
    page: "app/admin/(dashboard)/dashboard/homepage-news/page.tsx",
    apis: ["app/api/admin/homepage-news/route.ts", "app/api/admin/homepage-news/[id]/route.ts", "app/api/admin/homepage-news/reorder/route.ts"]
  },
  {
    name: "Announcements",
    page: "app/admin/(dashboard)/dashboard/announcements/page.tsx",
    apis: ["app/api/admin/announcements/route.ts", "app/api/admin/announcements/[id]/route.ts", "app/api/admin/announcements/[id]/pin/route.ts"]
  },
  {
    name: "Internships",
    page: "app/admin/(dashboard)/dashboard/internships/page.tsx",
    apis: ["app/api/admin/internships/route.ts", "app/api/admin/internships/[id]/route.ts"]
  },
  {
    name: "Projects",
    page: "app/admin/(dashboard)/dashboard/projects/page.tsx",
    apis: ["app/api/admin/projects/route.ts", "app/api/admin/projects/[id]/route.ts", "app/api/admin/projects/reorder/route.ts"]
  },
  {
    name: "Certificates",
    page: "app/admin/(dashboard)/dashboard/certificates/page.tsx",
    apis: ["app/api/admin/certificates/route.ts", "app/api/admin/certificates/[id]/route.ts", "app/api/admin/certificates/reorder/route.ts"]
  },
  {
    name: "Field Process",
    page: "app/admin/(dashboard)/dashboard/field-process/page.tsx",
    apis: ["app/api/admin/field-process/route.ts", "app/api/admin/field-process/[id]/route.ts"]
  },
  {
    name: "Team Contact Cards",
    page: "app/admin/(dashboard)/dashboard/team/page.tsx",
    apis: ["app/api/admin/team/route.ts", "app/api/admin/team/[id]/route.ts", "app/api/admin/team/reorder/route.ts"]
  },
  {
    name: "Social Links",
    page: "app/admin/(dashboard)/dashboard/social/page.tsx",
    apis: ["app/api/admin/social/route.ts", "app/api/admin/social/[id]/route.ts", "app/api/admin/social/reorder/route.ts"]
  }
];

for (const feature of adminFeatures) {
  const missing = [feature.page, ...feature.apis].filter((path) => !exists(path));
  if (missing.length) {
    log("fail", `${feature.name} admin surface`, `Missing: ${missing.join(", ")}`);
  } else {
    log("pass", `${feature.name} admin surface`, "page and API routes present");
  }
}

const sidebar = read("app/admin/(dashboard)/_components/AdminSidebar.tsx");
for (const feature of adminFeatures) {
  const href = feature.page.replace("app/admin/(dashboard)", "/admin").replace("/page.tsx", "");
  if (sidebar.includes(`href: "${href}"`)) {
    log("pass", `${feature.name} sidebar link`, href);
  } else {
    log("fail", `${feature.name} sidebar link`, `Missing ${href}`);
  }
}

const adminRouteFiles = findFiles("find", ["app/api/admin", "-type", "f", "-name", "route.ts"]);
const unprotectedAdminRoutes = adminRouteFiles.filter((path) => !read(path).includes("requireAdmin"));
if (unprotectedAdminRoutes.length) {
  log("fail", "Admin APIs require auth", unprotectedAdminRoutes.join(", "));
} else {
  log("pass", "Admin APIs require auth", `${adminRouteFiles.length} admin API routes call requireAdmin`);
}

const publicRouteFiles = findFiles("find", ["app/api", "-path", "app/api/admin", "-prune", "-o", "-type", "f", "-name", "route.ts", "-print"]).filter(
  (path) => !path.startsWith("app/api/admin/")
);
const unsafePublicRoutes = [];
for (const path of publicRouteFiles) {
  const methods = exportedMethods(read(path));
  const allowed = path.startsWith("app/api/auth/") ? ["POST"] : ["GET"];
  const unsafe = methods.filter((method) => !allowed.includes(method));
  if (unsafe.length) unsafePublicRoutes.push(`${path}:${unsafe.join(",")}`);
}
if (unsafePublicRoutes.length) {
  log("fail", "Public API write surface", unsafePublicRoutes.join(" | "));
} else {
  log("pass", "Public API write surface", `${publicRouteFiles.length} non-admin API routes expose only expected methods`);
}

const clientApiExpectations = [
  ["Homepage News client", "app/admin/(dashboard)/dashboard/homepage-news/HomepageNewsDashboardClient.tsx", "/api/admin/homepage-news"],
  ["News section copy editor", "app/admin/(dashboard)/dashboard/homepage-news/NewsSectionCopyEditor.tsx", "/api/admin/section-copy/"],
  ["Announcements client", "app/admin/(dashboard)/dashboard/announcements/AnnouncementDashboardClient.tsx", "/api/admin/announcements"],
  ["Internships client", "app/admin/(dashboard)/dashboard/internships/InternshipDashboardClient.tsx", "/api/admin/internships"],
  ["Projects client", "app/admin/(dashboard)/dashboard/projects/ProjectDashboardClient.tsx", "/api/admin/projects"],
  ["Certificates client", "app/admin/(dashboard)/dashboard/certificates/CertificateDashboardClient.tsx", "/api/admin/certificates"],
  ["Field Process client", "app/admin/(dashboard)/dashboard/field-process/FieldProcessDashboardClient.tsx", "/api/admin/field-process"],
  ["Team client", "app/admin/(dashboard)/dashboard/team/TeamDashboardClient.tsx", "/api/admin/team"],
  ["Social client", "app/admin/(dashboard)/dashboard/social/SocialDashboardClient.tsx", "/api/admin/social"]
];

for (const [name, path, api] of clientApiExpectations) {
  if (!exists(path)) {
    log("fail", `${name} exists`, path);
    continue;
  }
  if (read(path).includes(api)) {
    log("pass", `${name} API wiring`, api);
  } else {
    log("fail", `${name} API wiring`, `Expected ${api}`);
  }
}

const homepage = read("app/(public)/page.tsx");
const requiredHomepageComponents = [
  "Header",
  "AnnouncementHero",
  "Hero",
  "SlidingIconRail",
  "InternshipNoticeBar",
  "Stats",
  "About",
  "Certifications",
  "Solutions",
  "LatestUpdates",
  "Team",
  "SocialShowcase",
  "CTA",
  "Footer"
];
const missingHomepageComponents = requiredHomepageComponents.filter((component) => !homepage.includes(`<${component}`));
if (missingHomepageComponents.length) {
  log("fail", "Homepage section composition", `Missing usage: ${missingHomepageComponents.join(", ")}`);
} else {
  log("pass", "Homepage section composition", `${requiredHomepageComponents.length} expected sections rendered`);
}

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");
console.log(`[feature-surface:SUMMARY] ${checks.length} checks, ${failures.length} failures, ${warnings.length} warnings`);

if (failures.length > 0) process.exit(1);
