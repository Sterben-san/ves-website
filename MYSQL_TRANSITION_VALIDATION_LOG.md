# MySQL Transition Validation Log

Date: 2026-09-13

Scope: Validate MongoDB/Mongoose to Hostinger MySQL/Prisma transition across public pages, admin pages, APIs, env checks, schema, and build pipeline.

## Hypotheses Checked

1. Old Mongo env/dependency references could remain and break deployment.
2. Prisma schema could drift from existing domain entities.
3. Prisma repositories could fail to preserve existing repository contracts.
4. Seed script could still depend on Mongo/Mongoose behavior.
5. Admin/public pages could compile but fail at runtime without the new `DATABASE_URL`.
6. Homepage News and Announcements could overlap after being separated.
7. Hostinger deployment scripts could miss Prisma generation/migration.

## Validation Evidence

- `node scripts/validate-mysql-transition.mjs`: pass, 16 checks, 0 failures, 2 warnings.
- `npm run prisma:generate`: pass.
- `DATABASE_URL='mysql://user:pass@127.0.0.1:3306/ves' npx prisma validate`: pass.
- `node scripts/validate-env.mjs`: correctly fails locally with missing `DATABASE_URL`.
- Production-shaped env validation with dummy MySQL URL and required secrets: pass.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test`: pass, 13 files and 45 tests.
- `npm run build`: pass.
- `npm audit --audit-level=moderate`: pass, 0 vulnerabilities.

## Runtime Route Evidence

- `GET /`: 200.
- `GET /admin/login`: 200.
- `GET /api/media`: 200, returns section-media fallback records when DB is unavailable.
- `GET /api/projects`: 200, returns an empty public list when DB is unavailable.
- `GET /api/admin/homepage-news`: 401 when unauthenticated.
- Admin login setup warning now says to add `DATABASE_URL`, then run `npm run prisma:migrate` and `npm run seed`.

## Remaining Blocker

Real database-backed admin CRUD cannot be fully end-to-end tested until a real Hostinger MySQL database URL is added:

```env
DATABASE_URL=mysql://<db_user>:<db_password>@127.0.0.1:3306/<db_name>
```

Current local `.env.local` still has no `DATABASE_URL` and still contains an old `MONGODB_URI` key. Remove the old key after the Hostinger MySQL URL is confirmed.

## Deployment Gate

Before deploying:

1. Create the Hostinger MySQL database/user.
2. Set `DATABASE_URL` in Hostinger environment variables.
3. Set production JWT, Cloudinary, site URL, and admin variables.
4. Run `npm run prisma:migrate`.
5. Run `npm run seed`.
6. Test admin login and one create/edit/delete flow for Homepage News, Announcements, Internships, Projects, Team, Certificates, and Section Media.
