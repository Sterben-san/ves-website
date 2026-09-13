# VES Frontend Design Handoff for Claude Design

Use this document as the frontend design and implementation context for the VES website in the `VES New` project.

The goal is to redesign or refine the public-facing frontend while preserving the existing Next.js app, admin CMS, backend APIs, auth, and data contracts.

## 1. Project Summary

Project name: Vishwakarma Evolution Solutions Pvt. Ltd. website and admin CMS.

Short name: VES.

Tagline: Engineering Progress for Rural India.

Company positioning:

VES develops practical public-lighting and rural-infrastructure systems for Telangana field conditions. The website should feel grounded, industrial, public-infrastructure focused, field-ready, and engineering-oriented.

The public site should communicate:

- Smart lighting and infrastructure systems
- Reduced energy waste
- Improved public safety
- Reduced manual electrical switching
- High mast lighting for sand bazaars and stockyards
- Automatic On/Off control boxes
- Site assessment, commissioning, and handover support
- Local engineering around Bhupalpally, Warangal, and Telangana

## 2. Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma/MySQL backend
- Admin CMS with JWT cookie auth
- Cloudinary media uploads

Do not introduce a new UI framework, component library, or state manager.

Use vanilla React and Tailwind.

## 3. Important Constraints

Do not break these:

- Existing admin CMS routes and dashboard
- Existing section media slot system
- Existing public content routes
- Existing Prisma/domain/use-case architecture
- Existing admin auth
- Existing API contracts

Do not add:

- Public write endpoints
- New admin roles
- Public registration
- WordPress, Elementor, or unrelated markup
- Unsupported claims like exact savings percentages, AI/IoT/cloud dashboard, certifications, or guaranteed financial savings

Frontend changes should primarily affect files under:

```txt
app/(public)/
app/globals.css
tailwind.config.ts
lib/siteContent.ts
```

Avoid backend changes unless absolutely necessary.

## 4. Current Public Routes

```txt
/
/about
/solutions
/projects
/certifications
/contact
/news
/news/[slug]
/internships
/social
```

Admin routes exist under:

```txt
/admin/login
/admin/dashboard
/admin/dashboard/announcements
/admin/dashboard/internships
/admin/dashboard/media
/admin/dashboard/social
```

Do not redesign the admin unless explicitly asked. Admin UI should remain a dense tool: neutral slate shell, dark sidebar, light content, restrained accent color.

## 5. Current Homepage Composition

The homepage is assembled in:

```txt
app/(public)/page.tsx
```

Current order:

```tsx
<Header />
<main>
  {pinnedAnnouncement ? <AnnouncementHero announcement={pinnedAnnouncement} /> : null}
  <Hero media={media} />
  <SlidingIconRail />
  <Stats />
  <Journey />
  <About media={media} />
  <Solutions media={media} />
  <Features />
  <Projects media={media} />
  <LatestUpdates announcements={announcements.items.slice(0, 4)} />
  <InternshipTeaser internships={internships} />
  <Team media={media} />
  <SocialShowcase links={socialLinks} />
  <CTA />
</main>
<Footer media={media} />
```

Important: `AnnouncementHero` is CMS-driven. If an admin pins an announcement, it appears above the default hero.

## 6. Brand Identity

Official company details:

```txt
Name: Vishwakarma Evolution Solutions Pvt. Ltd.
Short name: VES
Tagline: Engineering Progress for Rural India
Established: December 2024
Primary geography: Bhupalpally and Warangal region, Telangana, India
Address: Azamnagar, Bhupalpally, Telangana, India
Email: vesolutions8328@gmail.com
Phone: +91 8328163817
Instagram: https://www.instagram.com/ves.solutions/
LinkedIn: https://www.linkedin.com/search/results/companies/?keywords=Vishwakarma%20Evolution%20Solutions
Internship form: https://forms.gle/zaWMREgDSmQVEgkD8
```

Core promise:

```txt
Smart lighting and infrastructure systems designed to reduce energy waste, improve public safety, and make rural operations more reliable.
```

Mission:

```txt
Bridge the technology gap in rural communities with systems that reduce waste, improve safety, and work in real operating conditions.
```

## 7. Brand Voice

Tone should be:

- Practical, not overly corporate
- Grounded in real field conditions
- Engineering-oriented
- Clear and compact
- Safety-first
- Focused on public infrastructure and rural communities
- Focused on measurable operational improvement without unsupported numbers

Preferred phrases:

- Field-ready
- Rural infrastructure
- Public-lighting reliability
- Safer field operation
- Environmental light sensing
- Reduced manual intervention
- Site assessment
- Deployment support
- Commissioning and handover
- Wide-area illumination
- Energy discipline
- Outdoor operating conditions
- Local engineering
- Practical implementation

Avoid:

- Futuristic smart city language
- AI claims
- IoT/cloud dashboard claims
- Guaranteed savings
- Exact savings percentages
- Certification claims
- Generic startup buzzwords

## 8. Visual Direction

The current desired design direction is dark, industrial, infrastructure-oriented.

Use:

- Deep dark hero backgrounds
- Warm paper text
- Gold as selective accent
- Green as functional UI accent
- Fine green divider lines
- Compact editorial typography
- Numbered cards
- Large uppercase headings
- Large spaced section labels like `A B O U T`, `S O L U T I O N S`, `P R O J E C T S`
- Real field imagery where available through the admin media slots

Avoid:

- Generic urban smart-city images
- Decorative blobs or gradient orbs
- Beige-only or one-note warm palettes
- Pure marketing-card layout
- Cartoonish or overly futuristic visuals

## 9. Current CSS Tokens

Defined in:

```txt
app/globals.css
tailwind.config.ts
```

Current CSS variables:

```css
:root {
  --ves-ink: #111513;
  --ves-deep: #0e1f21;
  --ves-black: #080b0a;
  --ves-logo-green: #397665;
  --ves-logo-gold: #d2b556;
  --ves-accent: var(--ves-logo-gold);
  --ves-paper: #f2f0e9;
  --ves-white: #ffffff;
  --ves-soft: #f8f7f1;
  --ves-text: #17211d;
  --ves-muted: rgba(23, 33, 29, 0.72);
  --ves-line: rgba(57, 118, 101, 0.22);
}
```

Tailwind colors:

```ts
ves: {
  ink: "#111513",
  deep: "#0e1f21",
  black: "#080b0a",
  leaf: "#397665",
  lime: "#d2b556",
  clay: "#8d7142",
  mist: "#f2f0e9",
  cream: "#ffffff",
  field: "#f8f7f1",
  paper: "#f2f0e9",
  text: "#17211d",
  solar: "#d2b556"
}
```

Reusable global classes:

```css
.section-shell {
  margin: 0 auto;
  max-width: 1200px;
  padding: 88px 24px;
}

.eyebrow {
  color: var(--leaf);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.ves-button {
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 0.1875rem;
  padding: 0 24px;
  font-weight: 800;
}
```

## 10. Current Official Content Module

The central content module is:

```txt
lib/siteContent.ts
```

Use this as the source of truth for company data, team, solutions, and projects. If redesigning, preserve the content data shape.

Important exports:

```ts
export const company = {
  name: "Vishwakarma Evolution Solutions Pvt. Ltd.",
  shortName: "VES",
  tagline: "Engineering Progress for Rural India",
  established: "December 2024",
  geography: "Bhupalpally and Warangal region, Telangana, India",
  location: "Azamnagar, Bhupalpally, Telangana, India",
  email: "vesolutions8328@gmail.com",
  phone: "+91 8328163817",
  instagram: "https://www.instagram.com/ves.solutions/",
  linkedin: "https://www.linkedin.com/search/results/companies/?keywords=Vishwakarma%20Evolution%20Solutions",
  map: "https://www.google.com/maps/search/?api=1&query=Azamnagar%20Bhupalpally%20Telangana",
  internshipForm: "https://forms.gle/zaWMREgDSmQVEgkD8"
};

export const corePromise =
  "Smart lighting and infrastructure systems designed to reduce energy waste, improve public safety, and make rural operations more reliable.";

export const mission =
  "Bridge the technology gap in rural communities with systems that reduce waste, improve safety, and work in real operating conditions.";
```

Team:

```ts
export const team = [];
```

Solutions currently include:

```txt
automatic-streetlights
high-mast-lighting
solar-streetlights
control-boxes
```

Projects currently include:

```txt
High Mast Lighting for TSMDC Sand Bazaar, Kothagudem
Automated ON/OFF Street Lighting, Mahadevpur Mandal
135 Automatic On/Off Streetlights in Jayashankar Bhupalpally
TSMDC Sand Bazaars Across Multiple Locations
```

## 11. Media System

Public imagery comes from fixed media slots managed by admin. Do not replace this system.

Media helper:

```txt
lib/media.ts
```

Usage:

```tsx
import { getMedia, type MediaMap } from "@/lib/media";
import { MediaAsset } from "./MediaAsset";

<MediaAsset media={getMedia(media, "hero.bg")} className="object-cover" />
```

Fixed media slots:

```txt
hero.bg
hero.jicaPhoto
about.image
footer.logo
```

Design should assume these images may be replaced from the admin dashboard.

## 12. Existing Important Components

Public components live in:

```txt
app/(public)/components/
```

Key components:

```txt
Header.tsx
Hero.tsx
SlidingIconRail.tsx
Stats.tsx
Journey.tsx
About.tsx
Solutions.tsx
Features.tsx
Projects.tsx
LatestUpdates.tsx
InternshipTeaser.tsx
Team.tsx
SocialShowcase.tsx
CTA.tsx
Footer.tsx
AnnouncementHero.tsx
AnnouncementCard.tsx
SocialEmbed.tsx
MediaAsset.tsx
```

## 13. Special Existing Interaction: Journey Sliding Icon

The Journey section has a centered scroll-driven icon. Preserve or improve this interaction.

Current behavior:

- A vertical centerline is placed in the middle of the Journey section.
- A small icon moves down the line as the user scrolls.
- Timeline progress fills as the icon moves.
- Milestone cards appear as progress crosses thresholds.
- Cards alternate left and right around the centerline on desktop.

Current milestones:

```ts
const milestones = [
  ["Site Assessment", "Review road width, usage pattern, pole spacing, control needs, and local operating conditions."],
  ["System Design", "Select light-sensing controls, high-load switching, pole placement, and serviceable field hardware."],
  ["Commissioning", "Install with local teams, test night operation, and prepare handover support for repeatable rollouts."]
];
```

If redesigning this:

- Keep the moving symbol centered.
- Keep reduced-motion support.
- Do not let the icon overlap text.
- Make sure mobile layout is readable.

## 14. Homepage Hero Requirements

Hero should communicate:

```txt
Smart Lighting
Est. Dec 2024
Engineering Progress for Rural India
Smart lighting and infrastructure systems designed to reduce energy waste, improve public safety, and make rural operations more reliable.
Autonomous control and high mast illumination for safer, more efficient rural infrastructure.
```

CTA examples:

```txt
Contact VES
Explore Systems
```

Hero should use `hero.bg` and optionally `hero.jicaPhoto` media slots.

Preferred feel:

- Dark
- Large gold headline
- Infrastructure/editorial
- First viewport makes VES identity obvious
- Should reveal a hint of next section on common viewport heights

## 15. Solution Content Details

Automatic On/Off Streetlights:

```txt
Title: Autonomous Street Light Illumination
Description: A light-sensing public-lighting system that switches automatically based on environmental conditions, reducing power waste and manual intervention.
Key proof: 135 lights installed in Mahadevpur Mandal, Jayashankar Bhupalpally District, Telangana.
```

High Mast Lighting:

```txt
Title: High Mast Lights in Sand Reaches
Description: Complete high mast installation solutions focused on quality, speed, reliability, and wide-area illumination for demanding outdoor environments.
Use cases: Sand stockyards, vehicle movement zones, loading and unloading points, roads, large outdoor operating areas.
```

Solar Powered Streetlights:

```txt
Title: Solar Powered Streetlights
Important: Present as expansion/planned offering. Do not claim already deployed unless confirmed.
Description: VES is expanding into sustainable solar public lighting for roads, public spaces, residential layouts, and rural development projects.
```

Control Boxes:

```txt
Title: Automatic On/Off Control Box
Description: A rugged control box using light sensing technology, stabilized power delivery, and centralized control to make rural lighting safer and more reliable.
```

## 16. Project Content Details

Project 1:

```txt
High Mast Lighting for TSMDC Sand Bazaar, Kothagudem
Category: High mast lighting
Location: Kothagudem, Telangana
Context: TSMDC Sand Bazaar
Outcomes: Improved visibility, better operational efficiency, improved safety, large-area illumination, support for nighttime and low-light operations.
```

Project 2:

```txt
Automated ON/OFF Street Lighting, Mahadevpur Mandal
Category: Streetlight automation
Location: Mahadevpur Mandal, Jayashankar Bhupalpally District, Telangana
Outcomes: Improved safety, reduced unnecessary power usage, reduced or removed manual switching, better operating conditions during difficult weather.
```

Project 3:

```txt
135 Automatic On/Off Streetlights in Jayashankar Bhupalpally
Category: Automatic public-lighting control
Scale: 135 lights
Location: Mahadevpur Mandal, Jayashankar Bhupalpally District, Telangana
Outcomes: 135 automatic streetlights installed, reduced manual intervention, improved public-lighting reliability.
```

Project 4:

```txt
TSMDC Sand Bazaars Across Multiple Locations
Category: High mast lighting
Locations: Bowrampet, Chikkunagulapally, Mahadevpur Mandal, other TSMDC sand-bazaar locations in Telangana
Outcomes: Stockyard illumination, safer vehicle movement, better visibility in loading areas, support for night operations.
```

## 17. Contact Page Requirements

Contact page route:

```txt
/contact
```

Contact copy:

```txt
You can find us at Azamnagar, Bhupalpally, or reach the team directly for public-lighting projects, internships, and field deployment discussions.

Share your village, road, sand reach, or public-lighting requirement. We will help assess the site, control model, installation scope, and the most practical next step.
```

Fields:

```txt
NAME required
EMAIL required
MESSAGE required
SUBMIT Send Message
```

Important: The current contact form uses `mailto:` and does not create a backend public write endpoint. Preserve that unless the user explicitly requests a backend contact API.

Inquiry categories:

```txt
High mast lighting
Automatic On/Off streetlights
Internships
```

## 18. Admin CMS Context

The admin CMS exists and should not be broken by frontend changes.

Admin can:

- Replace fixed section media slots
- Create announcements
- Post internships
- Add social links
- Use a global `+ New` quick-post launcher

Announcements:

- Published announcements show on `/news`
- Pinned announcement can show as homepage hero

Internships:

- Active internships show on `/internships`
- Homepage teaser appears only if active postings exist

Social links:

- Social page uses public embeds
- Featured links can show on homepage

## 19. Design Improvements Wanted

Claude Design should improve the frontend with this direction:

1. Make the site feel more premium, industrial, and field-engineering oriented.
2. Preserve the dark VES palette.
3. Use the official wording and facts above.
4. Make the homepage more visually cohesive.
5. Improve responsive spacing and hierarchy.
6. Keep the Journey sliding icon interaction centered.
7. Improve the solutions and projects pages so they feel like real content pages, not simple lists.
8. Make cards sharper and less rounded.
9. Use high-contrast type and numbered sections.
10. Keep performance and accessibility strong.

## 20. Files Most Likely to Edit

```txt
app/globals.css
tailwind.config.ts
lib/siteContent.ts
app/(public)/page.tsx
app/(public)/components/Header.tsx
app/(public)/components/Hero.tsx
app/(public)/components/SlidingIconRail.tsx
app/(public)/components/Stats.tsx
app/(public)/components/Journey.tsx
app/(public)/components/About.tsx
app/(public)/components/Solutions.tsx
app/(public)/components/Features.tsx
app/(public)/components/Projects.tsx
app/(public)/components/Team.tsx
app/(public)/components/CTA.tsx
app/(public)/components/Footer.tsx
app/(public)/about/page.tsx
app/(public)/solutions/page.tsx
app/(public)/solutions/[slug]/page.tsx
app/(public)/projects/page.tsx
app/(public)/certifications/page.tsx
app/(public)/contact/page.tsx
app/(public)/news/page.tsx
app/(public)/news/[slug]/page.tsx
app/(public)/internships/page.tsx
app/(public)/social/page.tsx
```

## 21. Verification Commands

After changes, run:

```bash
npm run typecheck
npm run test
npm run build
```

Also check:

```txt
http://localhost:3000/
http://localhost:3000/about
http://localhost:3000/solutions redirects to /#solutions
http://localhost:3000/projects
http://localhost:3000/certifications
http://localhost:3000/contact
http://localhost:3000/news
http://localhost:3000/internships
http://localhost:3000/social
```

## 22. Final Instruction for Claude Design

Redesign the public frontend only. Keep all backend, admin CMS, route contracts, data fetching, and media slot keys intact.

Make the website look like a serious rural infrastructure company from Telangana: dark, precise, practical, engineering-led, and grounded in real field deployment.

Use VES official content. Avoid unsupported claims. Preserve accessibility and responsive behavior.
