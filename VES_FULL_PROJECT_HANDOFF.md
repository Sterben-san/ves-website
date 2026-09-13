# VES Website Full Project Handoff

Current project path:

```text
/Users/anirudh/Documents/VES New
```

Stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma with Hostinger-compatible MySQL
- Cloudinary media storage
- JWT cookie auth
- Admin-only CMS, no public registration

Backend architecture remains layered:

```text
server/domain
server/application
server/infrastructure
server/interfaces
server/config
```

Persistence has been migrated to Prisma/MySQL:

- Prisma schema: `prisma/schema.prisma`
- Initial migration: `prisma/migrations/20260913125200_init/migration.sql`
- Prisma repositories: `server/infrastructure/prisma/PrismaRepositories.ts`
- Shared Prisma client: `server/config/db.ts`

Required database env:

```env
DATABASE_URL=mysql://<db_user>:<db_password>@127.0.0.1:3306/<db_name>
```

Hostinger should use `127.0.0.1`, not `localhost`, for Node.js MySQL connections.

Deployment/check commands:

```bash
npm install
npm run prisma:migrate
npm run seed
npm run typecheck
npm run test
npm run build
npm start
```

Important constraints:

- Exactly 2 admin accounts seeded through `npm run seed`.
- No public signup.
- No new admin roles.
- No public write endpoints.
- Admin mutations stay under `/api/admin/*`.
- Never commit secrets.
- Upload binaries to Cloudinary and store only URLs/public IDs in MySQL.

Admin CMS includes:

- Section media
- Homepage News
- Announcements
- Internships
- Projects
- Team
- Certificates
- Social links
- Field process steps

After a real Hostinger database is created, set `DATABASE_URL`, run migrations, seed the database, then test:

- Admin login
- Homepage News create/edit/publish
- Announcement create/edit/pin
- Internship create/edit/apply URL
- Project create/edit/publish
- Team/contact card create/edit/delete
- Certificate upload/listing
- Public homepage, `/news`, `/projects`, `/internships`, `/certifications`
