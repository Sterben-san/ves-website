import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const baseUrl = process.env.VES_BASE_URL ?? "http://localhost:3000";
const logLines = [];
const createdIds = {
  homepageNews: [],
  announcements: [],
  internships: [],
  projects: [],
  team: [],
  social: []
};
let activeCookies = "";

loadLocalEnv();

function log(status, name, detail) {
  const marker = status === "pass" ? "PASS" : status === "warn" ? "WARN" : "FAIL";
  const line = `[admin-demo:${marker}] ${name}${detail ? ` - ${detail}` : ""}`;
  logLines.push(line);
  console.log(line);
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...init,
    headers: {
      Origin: baseUrl,
      ...(init.headers ?? {})
    }
  });
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let body = text;
  if (contentType.includes("application/json") && text) {
    body = JSON.parse(text);
  }
  return {
    status: response.status,
    headers: response.headers,
    contentType,
    body,
    text
  };
}

function expect(condition, name, detail) {
  if (!condition) {
    log("fail", name, detail);
    throw new Error(`${name}: ${detail}`);
  }
  log("pass", name, detail);
}

function form(fields) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) data.append(key, String(value));
  }
  return data;
}

function cookieHeader(response) {
  const setCookie = response.headers.getSetCookie ? response.headers.getSetCookie() : response.headers.get("set-cookie")?.split(/,(?=\s*ves_)/) ?? [];
  return setCookie.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function jsonRequest(path, method, cookies, payload) {
  return request(path, {
    method,
    headers: {
      Cookie: cookies,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

async function formRequest(path, method, cookies, fields) {
  return request(path, {
    method,
    headers: {
      Cookie: cookies
    },
    body: form(fields)
  });
}

async function listPublic(path, key) {
  const response = await request(path);
  expect(response.status === 200, `Public ${path}`, `status ${response.status}`);
  if (key) {
    const items = publicItems(response.body, key);
    expect(Array.isArray(items), `Public ${path} shape`, `${key} count ${items.length}`);
  }
  return response.body;
}

function publicItems(body, key) {
  return body[key] ?? body.items;
}

async function cleanup(cookies) {
  for (const [feature, ids] of Object.entries(createdIds)) {
    const route = {
      homepageNews: "/api/admin/homepage-news",
      announcements: "/api/admin/announcements",
      internships: "/api/admin/internships",
      projects: "/api/admin/projects",
      team: "/api/admin/team",
      social: "/api/admin/social"
    }[feature];
    for (const id of ids) {
      await request(`${route}/${id}`, { method: "DELETE", headers: { Cookie: cookies, Origin: baseUrl } }).catch(() => undefined);
    }
  }
}

async function main() {
  const email = process.env.ADMIN_ONE_EMAIL;
  const password = process.env.ADMIN_ONE_PASSWORD;
  expect(Boolean(process.env.DATABASE_URL), "DATABASE_URL configured", "local MySQL URL is present");
  expect(Boolean(email && password), "Admin credentials configured", "ADMIN_ONE_EMAIL and ADMIN_ONE_PASSWORD are present");

  const badLogin = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `invalid-${Date.now()}@ves.local`, password: "definitely-wrong" })
  });
  expect(badLogin.status === 401 || badLogin.status === 429, "Bad login rejected", `status ${badLogin.status}`);

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  expect(login.status === 200, "Admin login accepted", `status ${login.status}`);
  const cookies = cookieHeader(login);
  activeCookies = cookies;
  expect(cookies.includes("ves_access="), "Auth cookie issued", cookies.includes("ves_refresh=") ? "access and refresh cookies" : "access cookie");

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
  for (const page of adminPages) {
    const response = await request(page, { headers: { Cookie: cookies } });
    expect(response.status === 200, `Authenticated admin page ${page}`, `status ${response.status}`);
  }

  const timestamp = Date.now();

  const news = await formRequest("/api/admin/homepage-news", "POST", cookies, {
    kind: "milestone",
    title: `Codex Demo News ${timestamp}`,
    summary: "Demo homepage news item created by the validation flow.",
    body: "This validates homepage news creation, publication, and public API reflection.",
    linkLabel: "View milestone",
    linkHref: "/news",
    published: "true"
  });
  expect(news.status === 201, "Homepage news create", `status ${news.status}`);
  createdIds.homepageNews.push(news.body.item.id);

  const announcement = await formRequest("/api/admin/announcements", "POST", cookies, {
    kind: "update",
    title: `Codex Demo Announcement ${timestamp}`,
    body: "Demo announcement created by the validation flow.",
    ctaLabel: "Read news",
    ctaHref: "/news",
    backgroundType: "none",
    pinned: "true",
    published: "true"
  });
  expect(announcement.status === 201, "Announcement create", `status ${announcement.status}`);
  createdIds.announcements.push(announcement.body.announcement.id);

  const internship = await formRequest("/api/admin/internships", "POST", cookies, {
    title: `Codex Demo Internship ${timestamp}`,
    description: "Demo internship created by the validation flow.",
    location: "Hyderabad / Field",
    applyUrl: "https://forms.gle/demoValidation123",
    applyEmail: "careers@ves.local",
    active: "true"
  });
  expect(internship.status === 201, "Internship create with Google Forms URL", `status ${internship.status}`);
  createdIds.internships.push(internship.body.internship.id);

  const invalidInternship = await formRequest("/api/admin/internships", "POST", cookies, {
    title: `Codex Invalid Internship ${timestamp}`,
    description: "This should not publish without a Google Forms URL.",
    applyUrl: "https://example.com/apply",
    active: "true"
  });
  expect(invalidInternship.status === 400, "Invalid internship form URL rejected", `status ${invalidInternship.status}`);

  const project = await formRequest("/api/admin/projects", "POST", cookies, {
    title: `Codex Demo Project ${timestamp}`,
    summary: "Demo project created by the validation flow.",
    body: "This validates project create and public published filtering.",
    location: "Telangana",
    category: "Validation",
    coverUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276",
    featured: "true",
    published: "true"
  });
  expect(project.status === 201, "Project create", `status ${project.status}`);
  createdIds.projects.push(project.body.project.id);

  const team = await formRequest("/api/admin/team", "POST", cookies, {
    fullName: `Codex Demo Member ${timestamp}`,
    role: "Validation Contact",
    bio: "Temporary contact card used for admin validation.",
    email: `codex-demo-${timestamp}@ves.local`,
    phone: "+91 90000 00000",
    linkedinUrl: "https://www.linkedin.com/company/vishwakarma-evolution-solutions",
    socials: JSON.stringify([{ platform: "website", url: "https://vishwakarmaes.in/" }]),
    displayOrder: "99",
    active: "true"
  });
  expect(team.status === 201, "Team member create", `status ${team.status}`);
  createdIds.team.push(team.body.member.id);

  const social = await jsonRequest("/api/admin/social", "POST", cookies, {
    postUrl: `https://www.instagram.com/p/CodexDemo${timestamp}/`,
    caption: "Demo social link created by validation.",
    thumbnailUrl: "",
    featured: true
  });
  expect(social.status === 201, "Social link create", `status ${social.status}`);
  createdIds.social.push(social.body.link.id);

  const fieldList = await request("/api/admin/field-process", { headers: { Cookie: cookies } });
  expect(fieldList.status === 200 && Array.isArray(fieldList.body.steps) && fieldList.body.steps.length >= 5, "Field process admin list", `${fieldList.body.steps?.length ?? 0} steps`);
  const firstStep = fieldList.body.steps[0];
  const patchedStep = await jsonRequest(`/api/admin/field-process/${firstStep.id}`, "PATCH", cookies, {
    phase: firstStep.phase,
    copy: `${firstStep.copy} Validation ping.`,
    displayOrder: firstStep.displayOrder
  });
  expect(patchedStep.status === 200, "Field process update", `status ${patchedStep.status}`);
  await jsonRequest(`/api/admin/field-process/${firstStep.id}`, "PATCH", cookies, {
    phase: firstStep.phase,
    copy: firstStep.copy,
    displayOrder: firstStep.displayOrder
  });

  const media = await request("/api/media");
  expect(media.status === 200 && Array.isArray(media.body.media) && media.body.media.length >= 3, "Section media list", `${media.body.media?.length ?? 0} slots`);

  const certificates = await request("/api/admin/certificates", { headers: { Cookie: cookies } });
  expect(certificates.status === 200 && Array.isArray(certificates.body.certificates), "Certificates admin list", `${certificates.body.certificates?.length ?? 0} certificates`);

  const homepage = await request("/");
  expect(homepage.status === 200, "Homepage renders after demo writes", `status ${homepage.status}`);
  const publicAnnouncements = await listPublic("/api/announcements", "items");
  const publicInternships = await listPublic("/api/internships", "internships");
  const publicProjects = await listPublic("/api/projects", "projects");
  const publicTeam = await listPublic("/api/team", "members");
  const publicSocial = await listPublic("/api/social", "links");

  expect(homepage.text.includes(`Codex Demo News ${timestamp}`), "Homepage news public reflection", "created title appears on homepage");
  expect(JSON.stringify(publicAnnouncements).includes(`Codex Demo Announcement ${timestamp}`), "Announcement public reflection", "created title appears in public response");
  expect(JSON.stringify(publicInternships).includes(`Codex Demo Internship ${timestamp}`), "Internship public reflection", "created title appears in public response");
  expect(JSON.stringify(publicProjects).includes(`Codex Demo Project ${timestamp}`), "Project public reflection", "created title appears in public response");
  expect(JSON.stringify(publicTeam).includes(`Codex Demo Member ${timestamp}`), "Team public reflection", "created name appears in public response");
  expect(JSON.stringify(publicSocial).includes(`CodexDemo${timestamp}`), "Social public reflection", "created URL appears in public response");

  const hiddenNews = await formRequest(`/api/admin/homepage-news/${news.body.item.id}`, "PATCH", cookies, { published: "false" });
  expect(hiddenNews.status === 200, "Homepage news unpublish", `status ${hiddenNews.status}`);
  const afterHideHomepage = await request("/");
  expect(!afterHideHomepage.text.includes(`Codex Demo News ${timestamp}`), "Homepage news hidden after unpublish", "title removed from homepage");

  const inactiveInternship = await formRequest(`/api/admin/internships/${internship.body.internship.id}`, "PATCH", cookies, { active: "false" });
  expect(inactiveInternship.status === 200, "Internship deactivate", `status ${inactiveInternship.status}`);
  const afterInactiveInternships = await listPublic("/api/internships", "internships");
  expect(!JSON.stringify(afterInactiveInternships).includes(`Codex Demo Internship ${timestamp}`), "Internship hidden after deactivate", "title removed from public response");

  await cleanup(cookies);

  const afterCleanupProjects = await listPublic("/api/projects", "projects");
  expect(!JSON.stringify(afterCleanupProjects).includes(`Codex Demo Project ${timestamp}`), "Delete cleanup sticks", "demo project no longer public");
}

function loadLocalEnv() {
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

main()
  .catch((error) => {
    log("fail", "Validation run crashed", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (activeCookies) {
      await cleanup(activeCookies);
    }
    mkdirSync("validation-logs", { recursive: true });
    writeFileSync("validation-logs/admin-demo-flows.log", `${logLines.join("\n")}\n`);
  });
