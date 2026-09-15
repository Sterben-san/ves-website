import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [
    { sectionSlots },
    { initialCertificates, seedInitialCertificates },
    { defaultFieldProcessSteps, seedMissingSteps },
    { BcryptPasswordService },
    {
      PrismaAdminRepository,
      PrismaCertificateRepository,
      PrismaFieldProcessRepository,
      PrismaMediaRepository,
      PrismaProjectRepository,
      PrismaTeamMemberRepository
    },
    { getPrisma },
    { shouldSeedInitialTeam },
    { createDraftProjectSlot, draftProjectSlotCount }
  ] = await Promise.all([
    import("@/server/domain/sectionSlots"),
    import("@/server/application/certificateUseCases"),
    import("@/server/application/fieldProcessUseCases"),
    import("@/server/infrastructure/auth/BcryptPasswordService"),
    import("@/server/infrastructure/prisma/PrismaRepositories"),
    import("@/server/config/db"),
    import("@/server/application/seedGuards"),
    import("@/server/application/projectSeedSlots")
  ]);

  const passwords = new BcryptPasswordService();
  const prisma = getPrisma();
  const admins = new PrismaAdminRepository();
  const certificates = new PrismaCertificateRepository();
  const media = new PrismaMediaRepository();
  const projects = new PrismaProjectRepository();
  const teamMembers = new PrismaTeamMemberRepository();
  const fieldProcess = new PrismaFieldProcessRepository();

  const adminInputs = [
    {
      email: process.env.ADMIN_ONE_EMAIL,
      password: process.env.ADMIN_ONE_PASSWORD,
      name: "VES Admin"
    },
    {
      email: process.env.ADMIN_TWO_EMAIL,
      password: process.env.ADMIN_TWO_PASSWORD,
      name: "VES Operations"
    }
  ];

  for (const input of adminInputs) {
    if (!input.email || !input.password) {
      throw new Error("ADMIN_ONE_* and ADMIN_TWO_* environment variables are required.");
    }

    await admins.upsert({
      email: input.email.toLowerCase(),
      passwordHash: await passwords.hash(input.password),
      name: input.name,
      role: "admin"
    });
  }
  await prisma.admin.deleteMany({
    where: {
      email: {
        notIn: adminInputs.map((input) => input.email!.toLowerCase())
      }
    }
  });

  for (const slot of sectionSlots) {
    const existing = await media.findBySectionKey(slot.sectionKey);
    if (!existing) {
      await media.upsert({
        sectionKey: slot.sectionKey,
        mediaType: slot.defaultMediaType,
        url: slot.defaultUrl,
        publicId: "",
        altText: slot.defaultAltText
      });
    }
  }
  await media.delete("hero.jicaPhoto");

  const initialTeam = [
    {
      fullName: "E. Shashidhar",
      role: "Founder",
      bio: "Founder of VES, focused on field-ready lighting automation and public infrastructure delivery across Telangana.",
      email: "shashidhar@ves.local",
      phone: "+91 83281 63817",
      linkedinUrl: "https://www.linkedin.com/search/results/companies/?keywords=Vishwakarma%20Evolution%20Solutions",
      socials: [],
      displayOrder: 0,
      active: true
    },
    {
      fullName: "J. Venkat Ani",
      role: "Manager",
      bio: "Administrative manager coordinating operations, documentation, and startup execution for VES field projects.",
      email: "venkatani@ves.local",
      phone: "+91 62814 47601",
      linkedinUrl: "https://www.linkedin.com/search/results/companies/?keywords=Vishwakarma%20Evolution%20Solutions",
      socials: [],
      displayOrder: 1,
      active: true
    },
    {
      fullName: "Anirudh Saketh",
      role: "Developer",
      bio: "Developer supporting the VES digital presence, admin workflows, and connected website systems.",
      email: "anirudhsaketh02@gmail.com",
      phone: "6300416088",
      linkedinUrl: "https://www.linkedin.com/in/anirudhsaketh",
      socials: [],
      displayOrder: 2,
      active: true
    }
  ];

  const teamSeedKey = "initial-team";
  const [existingTeam, teamSeedState] = await Promise.all([teamMembers.list(), prisma.seedState.findUnique({ where: { key: teamSeedKey } })]);
  if (shouldSeedInitialTeam(existingTeam.length, Boolean(teamSeedState))) {
    for (const member of initialTeam) {
      await teamMembers.create(member);
    }
  }
  if (!teamSeedState) {
    await prisma.seedState.upsert({ where: { key: teamSeedKey }, update: {}, create: { key: teamSeedKey } });
  }

  const defaultProjectUrl = (key: "autonomous" | "highMast" | "controlBox") => {
    const urls = {
      autonomous: "/placeholders/autonomous-light.svg",
      highMast: "/placeholders/high-mast.svg",
      controlBox: "/placeholders/control-box.svg"
    };
    return urls[key];
  };
  const initialProjects = [
    {
      title: "District Streetlight Automation Program, Bhupalpally",
      slug: "district-streetlight-automation-program-bhupalpally",
      summary:
        "Government-approved automatic control boxes addressing always-on lighting, recurring failures, repair burden, and illegal electricity usage.",
      body:
        "VES designed, built, and deployed automatic control boxes for public streetlighting after district-level approval. The program addresses always-on operation, recurring light failures, illegal electricity usage, and avoidable public repair costs with field-hardened automation installed by the VES team.\n\nOutcomes include up to approximately 50% electricity-bill reduction potential, reduced repair burden, unauthorized usage control, and one-year service warranty on every control unit.",
      location: "Bhupalpally district, Telangana",
      category: "Flagship streetlight automation",
      coverUrl: defaultProjectUrl("autonomous"),
      displayOrder: 0,
      featured: true,
      published: true
    },
    {
      title: "High Mast Lighting for TSMDC Sand Bazaar, Kothagudem",
      slug: "high-mast-lighting-tsmdc-sand-bazaar-kothagudem",
      summary:
        "Reliable large-area illumination that improves visibility, safety, and operational efficiency across sand bazaar premises.",
      body:
        "The installation enhanced visibility, operational efficiency, and safety across the sand bazaar premises with reliable large-area illumination for nighttime and low-light operations.",
      location: "Kothagudem, Telangana",
      category: "High Mast Lighting",
      coverUrl: defaultProjectUrl("highMast"),
      displayOrder: 1,
      featured: true,
      published: true
    },
    {
      title: "Automated ON/OFF Street Lighting, Mahadevpur Mandal",
      slug: "automated-on-off-street-lighting-mahadevpur-mandal",
      summary:
        "Automatic street lighting installed across selected areas to improve safety, reduce unnecessary power usage, and remove manual switching.",
      body:
        "Automated street lighting was installed across selected areas in Mahadevpur Mandal to improve safety, reduce unnecessary power usage, and remove manual switching in difficult weather conditions.",
      location: "Mahadevpur Mandal, Jayashankar Bhupalpally District, Telangana",
      category: "Automated Street Lighting",
      coverUrl: defaultProjectUrl("autonomous"),
      displayOrder: 2,
      featured: true,
      published: true
    },
    {
      title: "135 Automatic On/Off Streetlights in Jayashankar Bhupalpally",
      slug: "135-automatic-on-off-streetlights-jayashankar-bhupalpally",
      summary:
        "A 135-light automatic control installation that reduced manual intervention and improved public-lighting reliability.",
      body:
        "A total of 135 lights have been installed in Mahadevpur Mandal using automatic control to reduce manual intervention and improve public-lighting reliability.",
      location: "Mahadevpur Mandal, Jayashankar Bhupalpally District, Telangana",
      category: "Automatic Public-Lighting Control",
      coverUrl: defaultProjectUrl("controlBox"),
      displayOrder: 3,
      featured: true,
      published: true
    },
    {
      title: "TSMDC Sand Bazaars Across Multiple Locations",
      slug: "tsmdc-sand-bazaars-across-multiple-locations",
      summary:
        "High mast lighting installations for stockyards, vehicle movement zones, loading areas, and night operations across multiple sand bazaar sites.",
      body:
        "High mast lighting installations were executed for sand bazaars including Bowrampet, Chikkunagulapally, and Mahadevpur Mandal. These installations support stockyards, vehicle movement zones, loading areas, and night operations.",
      location: "Bowrampet, Chikkunagulapally, Mahadevpur Mandal, Telangana",
      category: "High Mast Lighting",
      coverUrl: defaultProjectUrl("highMast"),
      displayOrder: 4,
      featured: false,
      published: true
    }
  ];

  for (const project of initialProjects) {
    const projectRecord = {
      ...project,
      mapUrl: project.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location)}` : undefined,
      galleryImages: []
    };
    const existing = await projects.findBySlug(project.slug);
    if (existing) {
      await projects.update(existing.id, projectRecord);
    } else {
      await projects.create(projectRecord);
    }
  }

  for (let index = 1; index <= draftProjectSlotCount; index += 1) {
    const draft = createDraftProjectSlot(index, initialProjects.length + index - 1);
    const { slug } = draft;
    const existing = await projects.findBySlug(slug);
    if (!existing) {
      await projects.create(draft);
    }
  }

  await seedMissingSteps(fieldProcess);
  await seedInitialCertificates(certificates);

  console.log(
    `Seeded ${adminInputs.length} admins, ${sectionSlots.length} section media slots, ${initialTeam.length} team members, ${initialProjects.length} published projects, ${draftProjectSlotCount} draft project slots, ${defaultFieldProcessSteps.length} field process steps, and ${initialCertificates.length} certificates.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
