#!/usr/bin/env node

const dryRun = process.argv.includes("--dry-run");
const collectionFilter = valueAfter("--collection");

const collectionPlans = [
  {
    collection: "admins",
    table: "Admin",
    columns: ["id", "email", "passwordHash", "name", "role", "lastLoginAt", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      email: lower(doc.email),
      passwordHash: String(doc.passwordHash ?? doc.password ?? ""),
      name: String(doc.name ?? "Admin"),
      role: String(doc.role ?? "admin"),
      lastLoginAt: nullableDate(doc.lastLoginAt),
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "sectionmedia",
    table: "SectionMedia",
    columns: ["id", "sectionKey", "mediaType", "url", "publicId", "altText", "uploadedBy", "width", "height", "bytes", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      sectionKey: String(doc.sectionKey ?? ""),
      mediaType: String(doc.mediaType ?? "image"),
      url: String(doc.url ?? ""),
      publicId: String(doc.publicId ?? ""),
      altText: String(doc.altText ?? ""),
      uploadedBy: nullableString(doc.uploadedBy),
      width: nullableNumber(doc.width),
      height: nullableNumber(doc.height),
      bytes: nullableNumber(doc.bytes),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "projects",
    table: "Project",
    columns: ["id", "title", "slug", "summary", "body", "location", "category", "coverUrl", "coverPublicId", "displayOrder", "featured", "published", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      title: String(doc.title ?? ""),
      slug: String(doc.slug ?? slugify(doc.title ?? stringId(doc))),
      summary: String(doc.summary ?? ""),
      body: String(doc.body ?? ""),
      location: nullableString(doc.location),
      category: nullableString(doc.category),
      coverUrl: nullableString(doc.coverUrl),
      coverPublicId: nullableString(doc.coverPublicId),
      displayOrder: nullableNumber(doc.displayOrder) ?? 0,
      featured: booleanValue(doc.featured),
      published: booleanValue(doc.published),
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "announcements",
    table: "Announcement",
    columns: [
      "id",
      "kind",
      "title",
      "slug",
      "body",
      "ctaLabel",
      "ctaHref",
      "backgroundType",
      "backgroundUrl",
      "backgroundPublicId",
      "posterUrl",
      "posterPublicId",
      "mobileFallbackUrl",
      "mobileFallbackPublicId",
      "overlayOpacity",
      "textPosition",
      "pinned",
      "published",
      "authorId",
      "createdAt",
      "updatedAt"
    ],
    map: (doc) => ({
      id: stringId(doc),
      kind: String(doc.kind ?? "update"),
      title: String(doc.title ?? ""),
      slug: String(doc.slug ?? slugify(doc.title ?? stringId(doc))),
      body: String(doc.body ?? ""),
      ctaLabel: nullableString(doc.ctaLabel),
      ctaHref: nullableString(doc.ctaHref),
      backgroundType: String(doc.backgroundType ?? "none"),
      backgroundUrl: nullableString(doc.backgroundUrl),
      backgroundPublicId: nullableString(doc.backgroundPublicId),
      posterUrl: nullableString(doc.posterUrl),
      posterPublicId: nullableString(doc.posterPublicId),
      mobileFallbackUrl: nullableString(doc.mobileFallbackUrl),
      mobileFallbackPublicId: nullableString(doc.mobileFallbackPublicId),
      overlayOpacity: Number(doc.overlayOpacity ?? 0.5),
      textPosition: String(doc.textPosition ?? "left"),
      pinned: booleanValue(doc.pinned),
      published: booleanValue(doc.published),
      authorId: String(doc.authorId ?? ""),
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "homepagenewsitems",
    table: "HomepageNewsItem",
    columns: ["id", "kind", "title", "summary", "body", "imageUrl", "imagePublicId", "linkLabel", "linkHref", "displayOrder", "published", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      kind: String(doc.kind ?? "milestone"),
      title: String(doc.title ?? ""),
      summary: String(doc.summary ?? ""),
      body: nullableString(doc.body),
      imageUrl: nullableString(doc.imageUrl),
      imagePublicId: nullableString(doc.imagePublicId),
      linkLabel: nullableString(doc.linkLabel),
      linkHref: nullableString(doc.linkHref),
      displayOrder: nullableNumber(doc.displayOrder) ?? 0,
      published: doc.published === undefined ? true : booleanValue(doc.published),
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "internshipupdates",
    table: "InternshipUpdate",
    columns: ["id", "title", "description", "location", "attachmentUrl", "attachmentPublicId", "applyUrl", "applyEmail", "active", "postedBy", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      title: String(doc.title ?? ""),
      description: String(doc.description ?? ""),
      location: nullableString(doc.location),
      attachmentUrl: nullableString(doc.attachmentUrl),
      attachmentPublicId: nullableString(doc.attachmentPublicId),
      applyUrl: nullableString(doc.applyUrl),
      applyEmail: nullableString(doc.applyEmail),
      active: booleanValue(doc.active),
      postedBy: String(doc.postedBy ?? ""),
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "sociallinks",
    table: "SocialLink",
    columns: ["id", "platform", "postUrl", "caption", "thumbnailUrl", "featured", "sortOrder", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      platform: String(doc.platform ?? ""),
      postUrl: String(doc.postUrl ?? ""),
      caption: nullableString(doc.caption),
      thumbnailUrl: nullableString(doc.thumbnailUrl),
      featured: booleanValue(doc.featured),
      sortOrder: nullableNumber(doc.sortOrder) ?? 0,
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "teammembers",
    table: "TeamMember",
    columns: ["id", "fullName", "role", "bio", "email", "phone", "linkedinUrl", "socials", "photoUrl", "photoPublicId", "displayOrder", "active", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      fullName: String(doc.fullName ?? doc.name ?? ""),
      role: String(doc.role ?? ""),
      bio: String(doc.bio ?? ""),
      email: lower(doc.email),
      phone: nullableString(doc.phone),
      linkedinUrl: String(doc.linkedinUrl ?? ""),
      socials: JSON.stringify(doc.socials ?? []),
      photoUrl: nullableString(doc.photoUrl),
      photoPublicId: nullableString(doc.photoPublicId),
      displayOrder: nullableNumber(doc.displayOrder) ?? 0,
      active: doc.active === undefined ? true : booleanValue(doc.active),
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "fieldprocesssteps",
    table: "FieldProcessStep",
    columns: ["id", "stepKey", "phase", "copy", "displayOrder", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      stepKey: String(doc.stepKey ?? ""),
      phase: String(doc.phase ?? ""),
      copy: String(doc.copy ?? ""),
      displayOrder: nullableNumber(doc.displayOrder) ?? 0,
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  },
  {
    collection: "certificates",
    table: "Certificate",
    columns: ["id", "title", "issuer", "description", "certificateUrl", "certificatePublicId", "previewUrl", "previewPublicId", "issuedOn", "displayOrder", "published", "createdAt", "updatedAt"],
    map: (doc) => ({
      id: stringId(doc),
      title: String(doc.title ?? ""),
      issuer: String(doc.issuer ?? ""),
      description: String(doc.description ?? ""),
      certificateUrl: String(doc.certificateUrl ?? doc.url ?? ""),
      certificatePublicId: nullableString(doc.certificatePublicId),
      previewUrl: nullableString(doc.previewUrl),
      previewPublicId: nullableString(doc.previewPublicId),
      issuedOn: nullableDate(doc.issuedOn),
      displayOrder: nullableNumber(doc.displayOrder) ?? 0,
      published: doc.published === undefined ? true : booleanValue(doc.published),
      createdAt: dateOrNow(doc.createdAt),
      updatedAt: dateOrNow(doc.updatedAt)
    })
  }
];

main().catch((error) => {
  console.error(`[mongo-to-mysql:FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

async function main() {
  const selectedPlans = collectionFilter ? collectionPlans.filter((plan) => plan.collection === collectionFilter) : collectionPlans;
  if (selectedPlans.length === 0) throw new Error(`Unknown collection: ${collectionFilter}`);

  if (dryRun) {
    console.log("[mongo-to-mysql:DRY-RUN] No MySQL writes will be performed.");
  }

  if (dryRun && !process.env.LEGACY_MONGODB_URI) {
    console.log("[mongo-to-mysql:PLAN] LEGACY_MONGODB_URI is not set, so this is a plan-only dry run.");
    for (const plan of selectedPlans) {
      console.log(`[mongo-to-mysql:PLAN] ${plan.collection} -> ${plan.table} (${plan.columns.length} columns)`);
    }
    return;
  }

  const mysql = await loadMysql();
  const { MongoClient } = await loadMongoClient();
  const legacyUri = requireEnv("LEGACY_MONGODB_URI");
  const legacyDbName = process.env.LEGACY_MONGODB_DB;
  const mongo = new MongoClient(legacyUri);
  const mysqlConnection = dryRun ? null : await mysql.createConnection(requireEnv("DATABASE_URL"));

  try {
    await mongo.connect();
    const db = legacyDbName ? mongo.db(legacyDbName) : mongo.db();

    for (const plan of selectedPlans) {
      const docs = await db.collection(plan.collection).find({}).toArray();
      console.log(`[mongo-to-mysql:INFO] ${plan.collection} -> ${plan.table}: ${docs.length} documents`);

      if (dryRun) continue;
      for (const doc of docs) {
        const row = plan.map(doc);
        await insertRow(mysqlConnection, plan.table, plan.columns, row);
      }
      console.log(`[mongo-to-mysql:PASS] Inserted ${docs.length} rows into ${plan.table}`);
    }
  } finally {
    await mongo.close().catch(() => undefined);
    if (mysqlConnection) await mysqlConnection.end().catch(() => undefined);
  }
}

async function loadMongoClient() {
  try {
    return await import("mongodb");
  } catch {
    throw new Error("Install the legacy MongoDB driver only for migration: npm install --no-save mongodb");
  }
}

async function loadMysql() {
  const mysqlModule = await import("mysql2/promise");
  return mysqlModule.default ?? mysqlModule;
}

async function insertRow(connection, table, columns, row) {
  const placeholders = columns.map(() => "?").join(", ");
  const escapedColumns = columns.map((column) => `\`${column}\``).join(", ");
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `\`${column}\` = VALUES(\`${column}\`)`)
    .join(", ");

  await connection.execute(
    `INSERT INTO \`${table}\` (${escapedColumns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`,
    columns.map((column) => row[column] ?? null)
  );
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function stringId(doc) {
  return String(doc.id ?? doc._id ?? "");
}

function lower(value) {
  return String(value ?? "").toLowerCase().trim();
}

function nullableString(value) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text ? text : null;
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOrNow(value) {
  return nullableDate(value) ?? new Date();
}

function booleanValue(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `item-${Date.now()}`;
}
