import { Prisma } from "@prisma/client";
import { getPrisma } from "@/server/config/db";

let projectSchemaPromise: Promise<void> | undefined;

export async function ensureProjectSchemaCompatibility(source: string) {
  projectSchemaPromise ??= repairProjectSchema(source);
  return projectSchemaPromise;
}

async function repairProjectSchema(source: string) {
  const prisma = getPrisma();
  const columns = await getProjectColumns();
  const missing = ["mapUrl", "galleryImages"].filter((column) => !columns.has(column));

  console.info("[db-schema-validation]", {
    source,
    table: "Project",
    requiredColumns: ["mapUrl", "galleryImages"],
    missingColumns: missing
  });

  if (missing.includes("mapUrl")) {
    await runSchemaChange("Project.mapUrl", "ALTER TABLE `Project` ADD COLUMN `mapUrl` TEXT NULL");
  }

  if (missing.includes("galleryImages")) {
    await runSchemaChange("Project.galleryImages:add", "ALTER TABLE `Project` ADD COLUMN `galleryImages` JSON NULL");
  }

  await prisma.$executeRaw`UPDATE Project SET galleryImages = JSON_ARRAY() WHERE galleryImages IS NULL`;
  await runSchemaChange("Project.galleryImages:not-null", "ALTER TABLE `Project` MODIFY COLUMN `galleryImages` JSON NOT NULL");
}

async function getProjectColumns() {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>(
    Prisma.sql`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Project'
        AND COLUMN_NAME IN ('mapUrl', 'galleryImages')
    `
  );
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function runSchemaChange(label: string, sql: string) {
  try {
    await getPrisma().$executeRawUnsafe(sql);
    console.info("[db-schema-repair]", { label, status: "applied" });
  } catch (error) {
    if (isAlreadyAppliedSchemaError(error)) {
      console.info("[db-schema-repair]", { label, status: "already-applied" });
      return;
    }
    console.error("[db-schema-repair]", { label, status: "failed", error });
    throw error;
  }
}

function isAlreadyAppliedSchemaError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("Duplicate column name") || error.message.includes("already exists");
}
