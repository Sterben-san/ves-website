import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ getPrisma }] = await Promise.all([import("@/server/config/db")]);
  const prisma = getPrisma();
  const admins = await prisma.admin.findMany({
    select: {
      email: true,
      name: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { email: "asc" }
  });

  const expectedEmails = [process.env.ADMIN_ONE_EMAIL, process.env.ADMIN_TWO_EMAIL]
    .filter(Boolean)
    .map((email) => email!.toLowerCase().trim());

  console.log(`Admin rows found: ${admins.length}`);
  for (const admin of admins) {
    const expected = expectedEmails.includes(admin.email.toLowerCase());
    console.log(
      `- ${admin.email} (${admin.name}) expected=${expected ? "yes" : "no"} lastLoginAt=${admin.lastLoginAt?.toISOString() ?? "never"}`
    );
  }

  const missing = expectedEmails.filter((email) => !admins.some((admin) => admin.email.toLowerCase() === email));
  if (missing.length > 0) {
    console.error(`Missing expected admin rows: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (admins.length !== 2) {
    console.error("Expected exactly 2 admin rows.");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
