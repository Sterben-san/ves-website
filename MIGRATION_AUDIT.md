# VES Migration Audit

Date: 2026-09-14

Scope: `lib/`, `server/`, `app/api/`, `prisma/`, `scripts/`, and project deployment files.

## Summary

The active application code is migrated away from MongoDB/Mongoose and uses Prisma with a MySQL datasource:

- Prisma datasource: `prisma/schema.prisma`
- Runtime Prisma client singleton: `server/config/db.ts`
- Repository implementation: `server/infrastructure/prisma/PrismaRepositories.ts`
- Dependency injection: `server/config/container.ts`
- Migration SQL: `prisma/migrations/20260913125200_init/migration.sql`

No live Mongoose model files, Mongo connection modules, or Mongo repository implementations remain in the source tree.

## Scan Results

Command used:

```bash
rg -n "mongoose|mongodb|MONGODB|ObjectId|\\.find\\(|\\.aggregate\\(|updateOne|deleteOne|Model\\." -S --glob '!node_modules/**' --glob '!.next/**' .
```

Findings:

- No `mongoose` package imports in active app code.
- No `mongodb` package imports in active app code.
- No `ObjectId` usage in active app code.
- No Mongoose query methods such as `Model.find`, `aggregate`, `updateOne`, or `deleteOne` in active app code.
- Remaining `.find()` matches are normal JavaScript array lookups in tests/components, not Mongo queries.
- Remaining Mongo terms are in migration/validation documentation and scripts that intentionally describe the migration state.

## Current Database Mapping

The current Prisma/MySQL models are:

- `Admin`
- `SectionMedia`
- `SectionCopy`
- `Project`
- `Announcement`
- `HomepageNewsItem`
- `InternshipUpdate`
- `SocialLink`
- `TeamMember`
- `FieldProcessStep`
- `Certificate`
- `SeedState`

The public contact page currently uses a `mailto:` form. There is no contact-submission API or persisted contact-message table in the current product surface.

## Repository Pattern

All database access is routed through application use cases and repository interfaces:

- Domain interfaces: `server/domain/repositories.ts`
- Use cases: `server/application/*UseCases.ts`
- Prisma implementation: `server/infrastructure/prisma/PrismaRepositories.ts`
- HTTP glue: `app/api/**/route.ts` and `server/interfaces/http.ts`

This preserves the existing SOLID layering and avoids adding a parallel raw-SQL data access path.

## Security Notes

- Admin mutation routes are under `/api/admin/*`.
- Admin API routes call `requireAdmin`.
- Public API routes expose read-only methods except auth endpoints.
- Uploads are validated through existing upload parsing and file-type checks before Cloudinary storage.
- Secrets must remain in `.env.local` locally and Hostinger environment variables in production.

## Local Blocker

The local `.env.local` still needs a real `DATABASE_URL` before authenticated CRUD can be tested against MySQL. The old `MONGODB_URI` key should be removed after MySQL is confirmed working.
