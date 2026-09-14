# VES Hostinger Deployment Notes

This app is a Next.js App Router site with a custom admin CMS, Prisma, MySQL, Cloudinary uploads, and JWT cookie auth.

## Hostinger Build Settings

- Node version: `>=20`
- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`
- Output directory: `.next`
- Entry point: not required for Next.js Web Apps

`package.json` keeps Hostinger-friendly scripts:

```json
{
  "dev": "next dev",
  "build": "next build --webpack",
  "start": "next start"
}
```

The build command uses webpack explicitly because this project currently hits a Next.js 16 Turbopack process/port panic during production builds. The webpack build path has been verified locally and still produces the normal `.next` output Hostinger needs.

The project also includes validation scripts for local use:

```bash
npm run validate:env
npm run validate:mysql
npm run validate:surface
npm run validate:routes
```

## Required Environment Variables

Set these in Hostinger's environment variable dashboard. Do not commit real values.

```bash
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
NODE_ENV=production
JWT_ACCESS_SECRET=long-random-secret
JWT_REFRESH_SECRET=different-long-random-secret
CLOUDINARY_CLOUD_NAME=cloud-name
CLOUDINARY_API_KEY=api-key
CLOUDINARY_API_SECRET=api-secret
NEXT_PUBLIC_SITE_URL=https://your-domain.example
ADMIN_ONE_EMAIL=first-admin@example.com
ADMIN_ONE_PASSWORD=strong-password
ADMIN_TWO_EMAIL=second-admin@example.com
ADMIN_TWO_PASSWORD=different-strong-password
```

You can also import the template file:

```text
.env.hostinger.example
```

Replace every placeholder first. `NEXT_PUBLIC_SITE_URL` must be the final `https://` domain.

Cloudinary is required for CMS image, video, and PDF uploads.

## Database Setup

After Hostinger MySQL is created and `DATABASE_URL` is set:

```bash
npm run deploy:db
```

Expected seed result:

- 2 admin accounts
- fixed section media slots
- field process steps
- starter projects/team/certificates where applicable
- blank project placeholders for admin editing

## Pre-Go-Live Checklist

Run locally or in the deployment shell:

```bash
npm run validate:env
npm run validate:mysql
npm run lint
npm run typecheck
npm run test
npm run build
```

With the app running, also run:

```bash
npm run validate:surface
npm run validate:routes
```

## Runtime Storage

Do not rely on local filesystem persistence for CMS media. Uploads are stored in Cloudinary and only URLs/public IDs are stored in MySQL.

## MongoDB Decommissioning

Do not delete the old MongoDB deployment until:

1. MySQL migrations have run successfully.
2. Any needed legacy data has been migrated or manually recreated in admin.
3. Admin login and all CMS create/edit/delete flows work against MySQL.
4. Public pages display the expected MySQL-backed content in production.
