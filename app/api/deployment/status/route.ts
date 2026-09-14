import { NextRequest } from "next/server";
import { getPrisma } from "@/server/config/db";
import { env, getProductionEnvIssues } from "@/server/config/env";
import { json } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const diagnosticTokenName = "DEPLOYMENT_DIAGNOSTIC_TOKEN";

export async function GET(request: NextRequest) {
  const expectedToken = process.env[diagnosticTokenName];
  const token = request.headers.get("x-diagnostic-token") ?? request.nextUrl.searchParams.get("token");

  if (!expectedToken || token !== expectedToken) {
    return json({ error: "Diagnostic token required." }, { status: 401 });
  }

  const database = await getDatabaseStatus();
  return json({
    app: {
      nodeEnv: env.nodeEnv,
      nextPublicSiteUrl: env.nextPublicSiteUrl,
      productionIssues: getProductionEnvIssues()
    },
    environment: {
      DATABASE_URL: summarizeDatabaseUrl(env.databaseUrl),
      JWT_ACCESS_SECRET: summarizeSecret(env.jwtAccessSecret),
      JWT_REFRESH_SECRET: summarizeSecret(env.jwtRefreshSecret),
      CLOUDINARY_CLOUD_NAME: summarizePlain(env.cloudinaryCloudName),
      CLOUDINARY_API_KEY: summarizeSecret(env.cloudinaryApiKey),
      CLOUDINARY_API_SECRET: summarizeSecret(env.cloudinaryApiSecret),
      NEXT_PUBLIC_SITE_URL: summarizePlain(env.nextPublicSiteUrl),
      ADMIN_ONE_EMAIL: summarizePlain(process.env.ADMIN_ONE_EMAIL),
      ADMIN_ONE_PASSWORD: summarizeSecret(process.env.ADMIN_ONE_PASSWORD),
      ADMIN_TWO_EMAIL: summarizePlain(process.env.ADMIN_TWO_EMAIL),
      ADMIN_TWO_PASSWORD: summarizeSecret(process.env.ADMIN_TWO_PASSWORD),
      DEPLOYMENT_DIAGNOSTIC_TOKEN: summarizeSecret(expectedToken)
    },
    database
  });
}

async function getDatabaseStatus() {
  try {
    const prisma = getPrisma();
    const admins = await prisma.admin.findMany({
      select: { email: true, name: true, lastLoginAt: true, createdAt: true, updatedAt: true },
      orderBy: { email: "asc" }
    });
    const counts = await getContentCounts(prisma);
    const expectedEmails = [process.env.ADMIN_ONE_EMAIL, process.env.ADMIN_TWO_EMAIL]
      .filter(Boolean)
      .map((email) => email!.toLowerCase().trim());

    return {
      connected: true,
      counts,
      adminRows: admins.map((admin) => ({
        email: admin.email,
        name: admin.name,
        expected: expectedEmails.includes(admin.email.toLowerCase()),
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      })),
      expectedAdminEmails: expectedEmails,
      exactlyTwoExpectedAdmins: admins.length === 2 && admins.every((admin) => expectedEmails.includes(admin.email.toLowerCase()))
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function getContentCounts(prisma: ReturnType<typeof getPrisma>) {
  const [
    announcements,
    publishedAnnouncements,
    pinnedAnnouncements,
    internships,
    activeInternships,
    homepageNews,
    publishedHomepageNews,
    certificates,
    publishedCertificates,
    teamMembers,
    activeTeamMembers,
    projects,
    publishedProjects,
    socialLinks,
    featuredSocialLinks,
    fieldProcessSteps,
    sectionMedia
  ] = await Promise.all([
    prisma.announcement.count(),
    prisma.announcement.count({ where: { published: true } }),
    prisma.announcement.count({ where: { pinned: true, published: true } }),
    prisma.internshipUpdate.count(),
    prisma.internshipUpdate.count({ where: { active: true } }),
    prisma.homepageNewsItem.count(),
    prisma.homepageNewsItem.count({ where: { published: true } }),
    prisma.certificate.count(),
    prisma.certificate.count({ where: { published: true } }),
    prisma.teamMember.count(),
    prisma.teamMember.count({ where: { active: true } }),
    prisma.project.count(),
    prisma.project.count({ where: { published: true } }),
    prisma.socialLink.count(),
    prisma.socialLink.count({ where: { featured: true } }),
    prisma.fieldProcessStep.count(),
    prisma.sectionMedia.count()
  ]);

  return {
    announcements,
    publishedAnnouncements,
    pinnedAnnouncements,
    internships,
    activeInternships,
    homepageNews,
    publishedHomepageNews,
    certificates,
    publishedCertificates,
    teamMembers,
    activeTeamMembers,
    projects,
    publishedProjects,
    socialLinks,
    featuredSocialLinks,
    fieldProcessSteps,
    sectionMedia
  };
}

function summarizePlain(value?: string) {
  return {
    present: Boolean(value),
    value: value ?? ""
  };
}

function summarizeSecret(value?: string) {
  return {
    present: Boolean(value),
    length: value?.length ?? 0,
    preview: value ? `${value.slice(0, 4)}...${value.slice(-4)}` : ""
  };
}

function summarizeDatabaseUrl(value?: string) {
  if (!value) {
    return { present: false, value: "", host: "", database: "" };
  }

  try {
    const url = new URL(value);
    return {
      present: true,
      value: `${url.protocol}//${url.username ? `${url.username}:***@` : ""}${url.host}${url.pathname}`,
      host: url.host,
      database: url.pathname.replace(/^\//, "")
    };
  } catch {
    return {
      present: true,
      value: "invalid-url",
      host: "",
      database: ""
    };
  }
}
