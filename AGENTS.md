# AGENTS.md

## Project
VES (Vishwakarma Evolution Solutions) marketing site + admin CMS.
Next.js App Router, TypeScript, Tailwind, Prisma/MySQL, Cloudinary, JWT cookie auth.

## Setup
npm install

## Verification
All three must pass before finishing feature work:

```bash
npm run typecheck
npm run test
npm run build
```

## Architecture Rules
Backend is SOLID-layered under `server/`.

- `server/domain/` — entities, repository interfaces, service interfaces. No Prisma, Cloudinary, or Next imports.
- `server/application/` — use cases. Depend only on domain interfaces.
- `server/infrastructure/` — Prisma repositories, Cloudinary storage, bcrypt, JWT.
- `server/interfaces/` — HTTP glue between Next route handlers and use cases.
- `server/config/` — env parsing and DI container wiring.

When adding a feature, add it in this order: entity -> repository interface -> Prisma implementation -> use case -> route handler -> UI. Constructor-inject interfaces; never instantiate concrete repositories inside use cases.

## Hard Constraints
- Exactly 2 admin accounts, seeded via `npm run seed`.
- No public registration, no new roles.
- No public write endpoints. Mutations live under `/api/admin/*` behind JWT auth.
- Never commit secrets. Use `.env.local`, which is git-ignored.
- Never store binaries in the database. Upload to Cloudinary and store URL/publicId.
- Validate request bodies with `zod`.
- Validate uploads with `file-type` content sniffing.
- Do not add WordPress/Elementor markup, CSS, or JS.

## Existing Feature
`server/domain/sectionSlots.ts` defines fixed media slots (`hero.bg`, `about.image`, `footer.logo`). One `SectionMedia` document per slot, upsert-only. New dynamic features must not break this contract.

## Style
- Vanilla React + Tailwind.
- No new UI framework, component library, or state manager.
- Public pages reuse existing card/button/spacing styles from `app/(public)/components/`.
- Admin UI is a dense tool: neutral slate/zinc shell, dark sidebar, light content, restrained accent color.
- Every new use-case module gets focused unit tests.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
