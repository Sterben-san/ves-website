# VES Validation Log - 2026-09-12

Scope: read-only validation pass. No bugs or vulnerabilities were fixed during this pass.

## Commands Run

- `npm audit --audit-level=low` - failed with 13 dependency vulnerabilities.
- `npm run typecheck` - passed.
- `npm run test` - passed, 8 files / 30 tests.
- `npm run lint` - failed with 4 errors and 2 warnings.
- `npm run build` - passed.
- Route scan: 18 `/api/admin/*` route files found; all 18 include `requireAdmin`.
- API inventory: 32 route files found; public routes are read-only except auth routes.
- Secret pattern scan excluding `.env.local`, `.next`, `node_modules`, and `package-lock.json` - found credentials-like values in a handoff Markdown file.

## High/Critical Findings

### CRITICAL - Dependency audit includes critical Next.js advisories

Evidence:
- `npm audit --audit-level=low`
- Package: `next`, current requested version in `package.json` is `^16.2.10`.
- Audit reported Next.js critical advisories and a fix through `npm audit fix`.

Impact:
- The project currently builds, but dependency metadata reports known critical advisories in the installed dependency graph. Some advisories may be platform- or feature-specific, but this must be reviewed before production hosting.

Relevant files:
- `package.json:21`
- `package-lock.json`

### HIGH - Old admin passwords are present in a repository Markdown handoff file

Evidence:
- Secret scan found credential-like values in `VES_FULL_PROJECT_HANDOFF.md:134-141`.
- `.env.local` is ignored, but this Markdown file is not ignored by `.gitignore`.

Impact:
- Even if these are old or intended credentials, storing admin passwords in project documentation is a credential hygiene risk. If committed or shared, those credentials should be considered exposed.

Relevant files:
- `VES_FULL_PROJECT_HANDOFF.md:134`
- `VES_FULL_PROJECT_HANDOFF.md:138`
- `VES_FULL_PROJECT_HANDOFF.md:140`
- `.gitignore:4-5`

### HIGH - Dependency audit includes high-severity transitive vulnerabilities

Evidence:
- `npm audit --audit-level=low`
- High-severity packages reported: `brace-expansion`, `browserslist`, `js-yaml`, `nanoid`, `sharp`.
- Audit also reported moderate issues in `@vitest/mocker`, `baseline-browser-mapping`, `esbuild`, and `postcss`.

Impact:
- Most appear in build/test tooling or image-processing dependencies, but `sharp` and `next` can be production-relevant. Treat this as a release blocker until triaged.

Relevant files:
- `package.json`
- `package-lock.json`

## Medium Findings

### MEDIUM - Admin mutation routes rely on SameSite cookies without explicit CSRF/Origin validation

Evidence:
- Auth cookies are `httpOnly`, `sameSite: "lax"`, and secure in production.
- No `Origin`, `Referer`, or CSRF token validation was found.
- Admin mutation routes use cookie auth through `requireAdmin`.

Impact:
- `SameSite=Lax` provides meaningful CSRF mitigation for many cross-site POST cases, but the app has no explicit server-side CSRF/Origin defense. This becomes more relevant if production uses same-site subdomains, changes cookie settings, or receives requests from embedded/admin-adjacent contexts.

Relevant files:
- `server/interfaces/http.ts:17-34`
- `server/interfaces/http.ts:42-51`
- `server/interfaces/http.ts:126-136`

### MEDIUM - Login rate limiting is in-memory and keyed only by email

Evidence:
- Login attempts are tracked in a module-level `Map`.
- Key is normalized email or `invalid-email`.
- There is no IP/device throttling or persistent backing store.

Impact:
- Rate limits reset on process restart and may be bypassed across multiple serverless instances/workers. Attackers can also distribute attempts across email strings.

Relevant files:
- `app/api/auth/login/route.ts:13-15`
- `app/api/auth/login/route.ts:41-65`

### MEDIUM - Upload parsing buffers entire files before enforcing size limits

Evidence:
- `request.formData()` and `file.arrayBuffer()` are called before size validation.
- Size limits are enforced afterward in use cases.

Impact:
- Attackers with admin credentials, or a compromised admin session, can force the server to buffer oversized multipart files before rejection. This can create memory pressure/DoS risk.

Relevant files:
- `server/interfaces/http.ts:54-72`
- `server/interfaces/http.ts:75-99`
- `server/interfaces/http.ts:101-123`
- `server/application/mediaUseCases.ts:147-159`
- `server/application/uploadValidation.ts:9-40`

### MEDIUM - Upload MIME detection falls back to client-supplied `file.type`

Evidence:
- If `file-type` cannot detect a MIME type, code uses `file.type`.
- Validators then whitelist MIME strings.

Impact:
- This is better than trusting extensions, but still allows ambiguous/undetected files to be accepted based on client-supplied metadata. Risk is highest for files served back publicly from Cloudinary.

Relevant files:
- `server/interfaces/http.ts:63-65`
- `server/interfaces/http.ts:88-96`
- `server/interfaces/http.ts:112-119`
- `server/application/uploadValidation.ts:15-40`

### MEDIUM - Third-party social embeds load external script/iframe without CSP or iframe sandbox

Evidence:
- Instagram embed injects `https://www.instagram.com/embed.js`.
- LinkedIn embed renders an iframe without a `sandbox` attribute.
- No CSP/security headers were found in `next.config.mjs`.

Impact:
- Public pages execute third-party social embed code. Stored social URLs are validated to Instagram/LinkedIn patterns, which reduces risk, but stronger browser policy boundaries are not present.

Relevant files:
- `app/(public)/components/SocialEmbed.tsx:43-48`
- `app/(public)/components/SocialEmbed.tsx:79-84`
- `server/application/socialLinkUseCases.ts:73-90`
- `next.config.mjs:1-17`

### MEDIUM - Generic `errorResponse` returns raw exception messages

Evidence:
- `errorResponse` serializes `error.message` directly.
- Many admin route catches return `errorResponse(error, 400)`.

Impact:
- Validation errors are useful to admins, but unexpected internal errors may leak implementation details, missing environment variable names, unknown section keys, or storage/database messages.

Relevant files:
- `server/interfaces/http.ts:12-14`
- `app/api/admin/media/[sectionKey]/route.ts:19-20`
- `app/api/admin/social/[id]/route.ts:19-31`

## Low / Quality Findings

### LOW - Lint currently fails

Evidence:
- `npm run lint` failed.

Reported errors:
- `app/(public)/components/Journey.tsx:31` - `react-hooks/set-state-in-effect`.
- `app/admin/(dashboard)/_components/ImageCropModal.tsx:25` - `react-hooks/set-state-in-effect`.
- `app/admin/(dashboard)/_components/QuickPostLauncher.tsx:326` - unescaped quotation marks.

Reported warnings:
- `app/admin/(dashboard)/_components/ImageCropModal.tsx:61` - raw `<img>` usage.
- `app/admin/(dashboard)/dashboard/media/MediaManagerClient.tsx:4` - unused `DragEvent` import.

Impact:
- Build and tests pass, but lint should be clean before production or CI enforcement.

### LOW - `requireAdmin` accepts Bearer tokens in addition to cookies

Evidence:
- `requireAdmin` reads either `ves_access` cookie or `Authorization: Bearer ...`.

Impact:
- This can be useful for tooling, but it broadens the accepted auth surface. If not needed, it should be documented or removed later.

Relevant files:
- `server/interfaces/http.ts:42-51`
- `server/interfaces/http.ts:130-136`

## Positive Findings

- All `/api/admin/*` route files found by the scan include `requireAdmin`.
- Public API inventory shows public endpoints are GET-only, except `/api/auth/login`, `/api/auth/logout`, and `/api/auth/refresh`.
- `typecheck`, unit tests, and production build pass.
- `.env.local` and `.env` are git-ignored.
- Admin passwords are bcrypt-hashed before storage.
- JWT cookies are `httpOnly` and production `secure`.
- Upload use cases enforce explicit MIME allowlists and documented size caps after parsing.
- Prisma/MySQL connection rejects placeholder `DATABASE_URL` values containing `<` or `>`.

## Validation Status

Overall status: NOT production-clean yet.

Release blockers to triage before hosting:
- Dependency audit critical/high advisories.
- Credential-like values in `VES_FULL_PROJECT_HANDOFF.md`.
- Lint failures if CI or deployment requires lint clean.

No code fixes were applied in this validation pass.
