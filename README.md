# VES Full-Stack Website

Production-oriented Next.js App Router build for Vishwakarma Evolution Solutions Pvt. Ltd. It includes a Trident-inspired public site and an authenticated admin CMS for managing fixed media slots, announcements, internships, and social embeds.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Hostinger MySQL via Prisma
- Cloudinary media storage
- JWT cookies plus bcrypt-hashed seeded admin accounts
- SOLID-style backend modules under `server/`

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill MySQL, Cloudinary, JWT, and the two admin account variables.
3. Install dependencies with `npm install`.
4. Apply migrations with `npm run prisma:migrate`, then seed MySQL with `npm run seed`.
5. Start the app with `npm run dev`.

The homepage falls back to local placeholder assets if MySQL is not configured, so the visual shell can render before deployment credentials are added.

## Admin

- Login: `/admin/login`
- Dashboard: `/admin/dashboard`
- Section media: `/admin/dashboard/media`
- Announcements: `/admin/dashboard/announcements`
- Internships: `/admin/dashboard/internships`
- Social links: `/admin/dashboard/social`
- Upload field name: `file`
- Supported media types: JPG, PNG, WebP, MP4, WebM
- Internship attachments additionally allow PDF
- Limits: 15MB images/PDFs, 100MB videos

Admin credentials are the two accounts in `.env.local`:

- `ADMIN_ONE_EMAIL` / `ADMIN_ONE_PASSWORD`
- `ADMIN_TWO_EMAIL` / `ADMIN_TWO_PASSWORD`

After setting those values and `DATABASE_URL`, run `npm run prisma:migrate` and `npm run seed`. If you use the placeholder `.env.example` values unchanged, the development logins are `admin@ves.local` / `change-this-password` and `ops@ves.local` / `change-this-password-too`.

## Key Routes

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/media`
- `GET /api/media/:sectionKey`
- `POST /api/admin/media/:sectionKey`
- `DELETE /api/admin/media/:sectionKey`
- `PATCH /api/admin/media/:sectionKey`
- `GET /api/admin/me`
- `GET /api/announcements`
- `GET /api/announcements/pinned`
- `GET /api/announcements/:slug`
- `GET /api/admin/announcements`
- `POST /api/admin/announcements`
- `PATCH /api/admin/announcements/:id`
- `POST /api/admin/announcements/:id/pin`
- `DELETE /api/admin/announcements/:id`
- `GET /api/internships`
- `GET /api/admin/internships`
- `POST /api/admin/internships`
- `PATCH /api/admin/internships/:id`
- `DELETE /api/admin/internships/:id`
- `GET /api/social`
- `GET /api/admin/social`
- `POST /api/admin/social`
- `PATCH /api/admin/social/:id`
- `DELETE /api/admin/social/:id`
- `GET /api/projects`
- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `PATCH /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`
- `GET /api/team`
- `GET /api/admin/team`
- `POST /api/admin/team`
- `PATCH /api/admin/team/:id`
- `DELETE /api/admin/team/:id`
- `GET /api/admin/field-process`
- `PATCH /api/admin/field-process/:id`
- `GET /api/admin/certificates`
- `POST /api/admin/certificates`
- `PATCH /api/admin/certificates/:id`
- `DELETE /api/admin/certificates/:id`

## Public Pages

- `/news`
- `/news/:slug`
- `/internships`
- `/social`
- `/projects`
- `/certifications`
- `/solutions` redirects to `/#solutions`
- `/solutions/:slug` redirects to `/#solutions`

## Verification

Run:

```bash
npm run typecheck
npm run test
npm run build
```

## Hostinger Deployment Notes

This app requires a Hostinger plan that supports Node.js Web Apps, such as Business Web Hosting or a Cloud plan. Hostinger Premium/shared hosting is not enough for this Next.js app.

Deploy as one Node.js Web App. The public website and admin dashboard are routes inside the same Next.js application.

Recommended hPanel settings:

- Node version: `20.x`
- Build command: `npm run build`
- Start command: `npm start`
- Output: `.next`
- Runtime port: Hostinger supplies `PORT`; the start script binds to it.

Required production environment variables must be set in hPanel, not committed:

```env
DATABASE_URL=mysql://db_user:db_password@127.0.0.1:3306/db_name
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_SITE_URL=https://your-production-domain
ADMIN_ONE_EMAIL=
ADMIN_ONE_PASSWORD=
ADMIN_TWO_EMAIL=
ADMIN_TWO_PASSWORD=
```

Use production-only JWT secrets and admin passwords. `npm start` runs `scripts/validate-env.mjs` first and will stop loudly if any required value is missing or still a placeholder.

Use Hostinger hPanel MySQL for production. Hostinger Node.js apps should use `127.0.0.1` in `DATABASE_URL` rather than `localhost` so Node connects over IPv4.

Before deployment, rotate any database password that was previously shared in plaintext and keep all secrets out of git.
