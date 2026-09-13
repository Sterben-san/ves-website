import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/server/config/db";
import type {
  Admin,
  Announcement,
  AnnouncementKind,
  Certificate,
  FieldProcessStep,
  HomepageNewsItem,
  InternshipUpdate,
  Project,
  SectionCopy,
  SectionMedia,
  SocialLink,
  SocialPlatform,
  TeamMember,
  TeamSocialLink
} from "@/server/domain/entities";
import type {
  IAdminRepository,
  IAnnouncementRepository,
  ICertificateRepository,
  IFieldProcessRepository,
  IHomepageNewsRepository,
  IInternshipRepository,
  IMediaRepository,
  IProjectRepository,
  ISectionCopyRepository,
  ISocialLinkRepository,
  ITeamMemberRepository
} from "@/server/domain/repositories";

export class PrismaAdminRepository implements IAdminRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    const doc = await getPrisma().admin.findUnique({ where: { email: email.toLowerCase().trim() } });
    return doc ? toAdmin(doc) : null;
  }

  async findById(id: string): Promise<Admin | null> {
    const doc = await getPrisma().admin.findUnique({ where: { id } });
    return doc ? toAdmin(doc) : null;
  }

  async upsert(admin: Omit<Admin, "id" | "createdAt">): Promise<Admin> {
    const doc = await getPrisma().admin.upsert({
      where: { email: admin.email },
      update: {
        passwordHash: admin.passwordHash,
        name: admin.name,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt ?? null
      },
      create: {
        email: admin.email,
        passwordHash: admin.passwordHash,
        name: admin.name,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt ?? null
      }
    });
    return toAdmin(doc);
  }

  async touchLastLogin(id: string): Promise<void> {
    await getPrisma().admin.update({ where: { id }, data: { lastLoginAt: new Date() } }).catch(ignoreNotFound);
  }
}

export class PrismaMediaRepository implements IMediaRepository {
  async list(): Promise<SectionMedia[]> {
    const docs = await getPrisma().sectionMedia.findMany();
    return docs.map(toSectionMedia);
  }

  async findBySectionKey(sectionKey: string): Promise<SectionMedia | null> {
    const doc = await getPrisma().sectionMedia.findUnique({ where: { sectionKey } });
    return doc ? toSectionMedia(doc) : null;
  }

  async upsert(media: Omit<SectionMedia, "id" | "updatedAt">): Promise<SectionMedia> {
    const data = {
      mediaType: media.mediaType,
      url: media.url,
      publicId: media.publicId,
      altText: media.altText,
      uploadedBy: media.uploadedBy ?? null,
      width: media.width ?? null,
      height: media.height ?? null,
      bytes: media.bytes ?? null
    };
    const doc = await getPrisma().sectionMedia.upsert({
      where: { sectionKey: media.sectionKey },
      update: data,
      create: { sectionKey: media.sectionKey, ...data }
    });
    return toSectionMedia(doc);
  }

  async delete(sectionKey: string): Promise<void> {
    await getPrisma().sectionMedia.delete({ where: { sectionKey } }).catch(ignoreNotFound);
  }
}

export class PrismaSectionCopyRepository implements ISectionCopyRepository {
  async findBySectionKey(sectionKey: string): Promise<SectionCopy | null> {
    const doc = await getPrisma().sectionCopy.findUnique({ where: { sectionKey } });
    return doc ? toSectionCopy(doc) : null;
  }

  async upsert(copy: Omit<SectionCopy, "id" | "updatedAt">): Promise<SectionCopy> {
    const data = {
      eyebrow: copy.eyebrow,
      title: copy.title,
      body: copy.body,
      ctaLabel: copy.ctaLabel ?? null,
      ctaHref: copy.ctaHref ?? null,
      visible: copy.visible,
      theme: copy.theme,
      animationDirection: copy.animationDirection,
      animationSeconds: copy.animationSeconds,
      maxItems: copy.maxItems
    };
    const doc = await getPrisma().sectionCopy.upsert({
      where: { sectionKey: copy.sectionKey },
      update: data,
      create: { sectionKey: copy.sectionKey, ...data }
    });
    return toSectionCopy(doc);
  }
}

export class PrismaProjectRepository implements IProjectRepository {
  async list(): Promise<Project[]> {
    const docs = await getPrisma().project.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
    return docs.map(toProject);
  }

  async listPublished(featured?: boolean): Promise<Project[]> {
    const docs = await getPrisma().project.findMany({
      where: { published: true, ...(featured === undefined ? {} : { featured }) },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }]
    });
    return docs.map(toProject).filter(isCompleteProject);
  }

  async findById(id: string): Promise<Project | null> {
    const doc = await getPrisma().project.findUnique({ where: { id } });
    return doc ? toProject(doc) : null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const doc = await getPrisma().project.findUnique({ where: { slug } });
    return doc ? toProject(doc) : null;
  }

  async create(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
    const doc = await getPrisma().project.create({ data: projectToPrisma(project) as Prisma.ProjectCreateInput });
    return toProject(doc);
  }

  async update(id: string, project: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>): Promise<Project | null> {
    try {
      const doc = await getPrisma().project.update({ where: { id }, data: toPrismaUpdate(project) as Prisma.ProjectUpdateInput });
      return toProject(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await getPrisma().project.delete({ where: { id } }).catch(ignoreNotFound);
  }

  async reorder(ids: string[]): Promise<Project[]> {
    await getPrisma().$transaction(ids.map((id, index) => getPrisma().project.update({ where: { id }, data: { displayOrder: index } })));
    return this.list();
  }
}

export class PrismaAnnouncementRepository implements IAnnouncementRepository {
  async list(kind?: AnnouncementKind): Promise<Announcement[]> {
    const docs = await getPrisma().announcement.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }]
    });
    return docs.map(toAnnouncement);
  }

  async listPublished(kind?: AnnouncementKind): Promise<Announcement[]> {
    const docs = await getPrisma().announcement.findMany({
      where: { published: true, ...(kind ? { kind } : {}) },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }]
    });
    return docs.map(toAnnouncement);
  }

  async findById(id: string): Promise<Announcement | null> {
    const doc = await getPrisma().announcement.findUnique({ where: { id } });
    return doc ? toAnnouncement(doc) : null;
  }

  async findBySlug(slug: string): Promise<Announcement | null> {
    const doc = await getPrisma().announcement.findUnique({ where: { slug } });
    return doc ? toAnnouncement(doc) : null;
  }

  async findPinned(): Promise<Announcement | null> {
    const doc = await getPrisma().announcement.findFirst({ where: { pinned: true, published: true } });
    return doc ? toAnnouncement(doc) : null;
  }

  async create(announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Promise<Announcement> {
    const doc = await getPrisma().$transaction(async (tx) => {
      if (announcement.pinned) {
        await tx.announcement.updateMany({ where: { pinned: true }, data: { pinned: false } });
      }
      return tx.announcement.create({ data: announcementToPrisma(announcement) as Prisma.AnnouncementCreateInput });
    });
    return toAnnouncement(doc);
  }

  async update(id: string, announcement: Partial<Omit<Announcement, "id" | "createdAt" | "updatedAt">>): Promise<Announcement | null> {
    try {
      const doc = await getPrisma().$transaction(async (tx) => {
        if (announcement.pinned) {
          await tx.announcement.updateMany({ where: { id: { not: id }, pinned: true }, data: { pinned: false } });
        }
        return tx.announcement.update({ where: { id }, data: toPrismaUpdate(announcement) as Prisma.AnnouncementUpdateInput });
      });
      return toAnnouncement(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await getPrisma().announcement.delete({ where: { id } }).catch(ignoreNotFound);
  }

  async setPinned(id: string): Promise<Announcement | null> {
    try {
      const doc = await getPrisma().$transaction(async (tx) => {
        await tx.announcement.updateMany({ where: { id: { not: id }, pinned: true }, data: { pinned: false } });
        return tx.announcement.update({ where: { id }, data: { pinned: true, published: true } });
      });
      return toAnnouncement(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }
}

export class PrismaHomepageNewsRepository implements IHomepageNewsRepository {
  async list(): Promise<HomepageNewsItem[]> {
    const docs = await getPrisma().homepageNewsItem.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] });
    return docs.map(toHomepageNewsItem);
  }

  async listPublished(): Promise<HomepageNewsItem[]> {
    const docs = await getPrisma().homepageNewsItem.findMany({ where: { published: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] });
    return docs.map(toHomepageNewsItem).filter((item) => item.title.trim() && item.summary.trim());
  }

  async findById(id: string): Promise<HomepageNewsItem | null> {
    const doc = await getPrisma().homepageNewsItem.findUnique({ where: { id } });
    return doc ? toHomepageNewsItem(doc) : null;
  }

  async create(item: Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">): Promise<HomepageNewsItem> {
    const doc = await getPrisma().homepageNewsItem.create({ data: homepageNewsToPrisma(item) as Prisma.HomepageNewsItemCreateInput });
    return toHomepageNewsItem(doc);
  }

  async update(id: string, item: Partial<Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">>): Promise<HomepageNewsItem | null> {
    try {
      const doc = await getPrisma().homepageNewsItem.update({ where: { id }, data: toPrismaUpdate(item) as Prisma.HomepageNewsItemUpdateInput });
      return toHomepageNewsItem(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await getPrisma().homepageNewsItem.delete({ where: { id } }).catch(ignoreNotFound);
  }

  async reorder(ids: string[]): Promise<HomepageNewsItem[]> {
    await getPrisma().$transaction(ids.map((id, index) => getPrisma().homepageNewsItem.update({ where: { id }, data: { displayOrder: index } })));
    return this.list();
  }
}

export class PrismaInternshipRepository implements IInternshipRepository {
  async listAll(): Promise<InternshipUpdate[]> {
    const docs = await getPrisma().internshipUpdate.findMany({ orderBy: { updatedAt: "desc" } });
    return docs.map(toInternship);
  }

  async listActive(): Promise<InternshipUpdate[]> {
    const docs = await getPrisma().internshipUpdate.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
    return docs.map(toInternship);
  }

  async findById(id: string): Promise<InternshipUpdate | null> {
    const doc = await getPrisma().internshipUpdate.findUnique({ where: { id } });
    return doc ? toInternship(doc) : null;
  }

  async create(update: Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">): Promise<InternshipUpdate> {
    const doc = await getPrisma().internshipUpdate.create({ data: internshipToPrisma(update) as Prisma.InternshipUpdateCreateInput });
    return toInternship(doc);
  }

  async update(id: string, update: Partial<Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">>): Promise<InternshipUpdate | null> {
    try {
      const doc = await getPrisma().internshipUpdate.update({ where: { id }, data: toPrismaUpdate(update) as Prisma.InternshipUpdateUpdateInput });
      return toInternship(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await getPrisma().internshipUpdate.delete({ where: { id } }).catch(ignoreNotFound);
  }
}

export class PrismaSocialLinkRepository implements ISocialLinkRepository {
  async list(): Promise<SocialLink[]> {
    const docs = await getPrisma().socialLink.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return docs.map(toSocialLink);
  }

  async listFeatured(): Promise<SocialLink[]> {
    const docs = await getPrisma().socialLink.findMany({ where: { featured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 4 });
    return docs.map(toSocialLink);
  }

  async findById(id: string): Promise<SocialLink | null> {
    const doc = await getPrisma().socialLink.findUnique({ where: { id } });
    return doc ? toSocialLink(doc) : null;
  }

  async add(link: Omit<SocialLink, "id" | "createdAt">): Promise<SocialLink> {
    const doc = await getPrisma().socialLink.create({ data: socialLinkToPrisma(link) as Prisma.SocialLinkCreateInput });
    return toSocialLink(doc);
  }

  async update(id: string, link: Partial<Omit<SocialLink, "id" | "createdAt">>): Promise<SocialLink | null> {
    try {
      const doc = await getPrisma().socialLink.update({ where: { id }, data: toPrismaUpdate(link) as Prisma.SocialLinkUpdateInput });
      return toSocialLink(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await getPrisma().socialLink.delete({ where: { id } }).catch(ignoreNotFound);
  }

  async findByPlatformAndUrl(platform: SocialPlatform, postUrl: string): Promise<SocialLink | null> {
    const doc = await getPrisma().socialLink.findUnique({ where: { platform_postUrl: { platform, postUrl } } });
    return doc ? toSocialLink(doc) : null;
  }

  async reorder(ids: string[]): Promise<SocialLink[]> {
    await getPrisma().$transaction(ids.map((id, index) => getPrisma().socialLink.update({ where: { id }, data: { sortOrder: index } })));
    return this.list();
  }
}

export class PrismaTeamMemberRepository implements ITeamMemberRepository {
  async list(): Promise<TeamMember[]> {
    const docs = await getPrisma().teamMember.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
    return docs.map(toTeamMember);
  }

  async listActive(): Promise<TeamMember[]> {
    const docs = await getPrisma().teamMember.findMany({ where: { active: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
    return docs.map(toTeamMember);
  }

  async findById(id: string): Promise<TeamMember | null> {
    const doc = await getPrisma().teamMember.findUnique({ where: { id } });
    return doc ? toTeamMember(doc) : null;
  }

  async findByEmail(email: string): Promise<TeamMember | null> {
    const doc = await getPrisma().teamMember.findUnique({ where: { email: email.toLowerCase().trim() } });
    return doc ? toTeamMember(doc) : null;
  }

  async create(member: Omit<TeamMember, "id" | "createdAt" | "updatedAt">): Promise<TeamMember> {
    const doc = await getPrisma().teamMember.create({ data: teamMemberToPrisma(member) as Prisma.TeamMemberCreateInput });
    return toTeamMember(doc);
  }

  async update(id: string, member: Partial<Omit<TeamMember, "id" | "createdAt" | "updatedAt">>): Promise<TeamMember | null> {
    try {
      const doc = await getPrisma().teamMember.update({ where: { id }, data: toPrismaUpdate(member) as Prisma.TeamMemberUpdateInput });
      return toTeamMember(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await getPrisma().teamMember.delete({ where: { id } }).catch(ignoreNotFound);
  }

  async reorder(ids: string[]): Promise<TeamMember[]> {
    await getPrisma().$transaction(ids.map((id, index) => getPrisma().teamMember.update({ where: { id }, data: { displayOrder: index } })));
    return this.list();
  }
}

export class PrismaFieldProcessRepository implements IFieldProcessRepository {
  async list(): Promise<FieldProcessStep[]> {
    const docs = await getPrisma().fieldProcessStep.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
    return docs.map(toFieldProcessStep);
  }

  async findById(id: string): Promise<FieldProcessStep | null> {
    const doc = await getPrisma().fieldProcessStep.findUnique({ where: { id } });
    return doc ? toFieldProcessStep(doc) : null;
  }

  async findByStepKey(stepKey: string): Promise<FieldProcessStep | null> {
    const doc = await getPrisma().fieldProcessStep.findUnique({ where: { stepKey } });
    return doc ? toFieldProcessStep(doc) : null;
  }

  async upsertByStepKey(step: Omit<FieldProcessStep, "id" | "createdAt" | "updatedAt">): Promise<FieldProcessStep> {
    const doc = await getPrisma().fieldProcessStep.upsert({
      where: { stepKey: step.stepKey },
      update: {},
      create: step
    });
    return toFieldProcessStep(doc);
  }

  async update(id: string, step: Partial<Omit<FieldProcessStep, "id" | "stepKey" | "createdAt" | "updatedAt">>): Promise<FieldProcessStep | null> {
    try {
      const doc = await getPrisma().fieldProcessStep.update({ where: { id }, data: toPrismaUpdate(step) as Prisma.FieldProcessStepUpdateInput });
      return toFieldProcessStep(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }
}

export class PrismaCertificateRepository implements ICertificateRepository {
  async list(): Promise<Certificate[]> {
    const docs = await getPrisma().certificate.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
    return docs.map(toCertificate);
  }

  async listPublished(): Promise<Certificate[]> {
    const docs = await getPrisma().certificate.findMany({ where: { published: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
    return docs.map(toCertificate);
  }

  async findById(id: string): Promise<Certificate | null> {
    const doc = await getPrisma().certificate.findUnique({ where: { id } });
    return doc ? toCertificate(doc) : null;
  }

  async findByUrl(certificateUrl: string): Promise<Certificate | null> {
    const doc = await getPrisma().certificate.findUnique({ where: { certificateUrl } });
    return doc ? toCertificate(doc) : null;
  }

  async create(certificate: Omit<Certificate, "id" | "createdAt" | "updatedAt">): Promise<Certificate> {
    const doc = await getPrisma().certificate.create({ data: certificateToPrisma(certificate) as Prisma.CertificateCreateInput });
    return toCertificate(doc);
  }

  async update(id: string, certificate: Partial<Omit<Certificate, "id" | "createdAt" | "updatedAt">>): Promise<Certificate | null> {
    try {
      const doc = await getPrisma().certificate.update({ where: { id }, data: toPrismaUpdate(certificate) as Prisma.CertificateUpdateInput });
      return toCertificate(doc);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await getPrisma().certificate.delete({ where: { id } }).catch(ignoreNotFound);
  }

  async reorder(ids: string[]): Promise<Certificate[]> {
    await getPrisma().$transaction(ids.map((id, index) => getPrisma().certificate.update({ where: { id }, data: { displayOrder: index } })));
    return this.list();
  }
}

function toAdmin(doc: Prisma.AdminGetPayload<Record<string, never>>): Admin {
  return {
    id: doc.id,
    email: doc.email,
    passwordHash: doc.passwordHash,
    name: doc.name,
    role: "admin",
    createdAt: doc.createdAt,
    lastLoginAt: doc.lastLoginAt ?? undefined
  };
}

function toSectionMedia(doc: Prisma.SectionMediaGetPayload<Record<string, never>>): SectionMedia {
  return {
    id: doc.id,
    sectionKey: doc.sectionKey,
    mediaType: doc.mediaType as SectionMedia["mediaType"],
    url: doc.url,
    publicId: doc.publicId,
    altText: doc.altText,
    uploadedBy: doc.uploadedBy ?? undefined,
    width: doc.width ?? undefined,
    height: doc.height ?? undefined,
    bytes: doc.bytes ?? undefined,
    updatedAt: doc.updatedAt
  };
}

function toSectionCopy(doc: Prisma.SectionCopyGetPayload<Record<string, never>>): SectionCopy {
  return {
    id: doc.id,
    sectionKey: doc.sectionKey,
    eyebrow: doc.eyebrow,
    title: doc.title,
    body: doc.body,
    ctaLabel: doc.ctaLabel ?? undefined,
    ctaHref: doc.ctaHref ?? undefined,
    visible: doc.visible,
    theme: doc.theme as SectionCopy["theme"],
    animationDirection: doc.animationDirection as SectionCopy["animationDirection"],
    animationSeconds: doc.animationSeconds,
    maxItems: doc.maxItems,
    updatedAt: doc.updatedAt
  };
}

function toProject(doc: Prisma.ProjectGetPayload<Record<string, never>>): Project {
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    body: doc.body,
    location: doc.location ?? undefined,
    category: doc.category ?? undefined,
    coverUrl: doc.coverUrl ?? undefined,
    coverPublicId: doc.coverPublicId ?? undefined,
    displayOrder: doc.displayOrder,
    featured: doc.featured,
    published: doc.published,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toAnnouncement(doc: Prisma.AnnouncementGetPayload<Record<string, never>>): Announcement {
  return {
    id: doc.id,
    kind: doc.kind as AnnouncementKind,
    title: doc.title,
    slug: doc.slug,
    body: doc.body,
    ctaLabel: doc.ctaLabel ?? undefined,
    ctaHref: doc.ctaHref ?? undefined,
    backgroundType: doc.backgroundType as Announcement["backgroundType"],
    backgroundUrl: doc.backgroundUrl ?? undefined,
    backgroundPublicId: doc.backgroundPublicId ?? undefined,
    posterUrl: doc.posterUrl ?? undefined,
    posterPublicId: doc.posterPublicId ?? undefined,
    mobileFallbackUrl: doc.mobileFallbackUrl ?? undefined,
    mobileFallbackPublicId: doc.mobileFallbackPublicId ?? undefined,
    overlayOpacity: doc.overlayOpacity,
    textPosition: doc.textPosition as Announcement["textPosition"],
    pinned: doc.pinned,
    published: doc.published,
    authorId: doc.authorId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toHomepageNewsItem(doc: Prisma.HomepageNewsItemGetPayload<Record<string, never>>): HomepageNewsItem {
  return {
    id: doc.id,
    kind: doc.kind as HomepageNewsItem["kind"],
    title: doc.title,
    summary: doc.summary,
    body: doc.body ?? undefined,
    imageUrl: doc.imageUrl ?? undefined,
    imagePublicId: doc.imagePublicId ?? undefined,
    linkLabel: doc.linkLabel ?? undefined,
    linkHref: doc.linkHref ?? undefined,
    displayOrder: doc.displayOrder,
    published: doc.published,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toInternship(doc: Prisma.InternshipUpdateGetPayload<Record<string, never>>): InternshipUpdate {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    location: doc.location ?? undefined,
    attachmentUrl: doc.attachmentUrl ?? undefined,
    attachmentPublicId: doc.attachmentPublicId ?? undefined,
    applyUrl: doc.applyUrl ?? undefined,
    applyEmail: doc.applyEmail ?? undefined,
    active: doc.active,
    postedBy: doc.postedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toSocialLink(doc: Prisma.SocialLinkGetPayload<Record<string, never>>): SocialLink {
  return {
    id: doc.id,
    platform: doc.platform as SocialPlatform,
    postUrl: doc.postUrl,
    caption: doc.caption ?? undefined,
    thumbnailUrl: doc.thumbnailUrl ?? undefined,
    featured: doc.featured,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt
  };
}

function toTeamMember(doc: Prisma.TeamMemberGetPayload<Record<string, never>>): TeamMember {
  return {
    id: doc.id,
    fullName: doc.fullName,
    role: doc.role,
    bio: doc.bio,
    email: doc.email,
    phone: doc.phone ?? undefined,
    linkedinUrl: doc.linkedinUrl,
    socials: (Array.isArray(doc.socials) ? doc.socials : []) as unknown as TeamSocialLink[],
    photoUrl: doc.photoUrl ?? undefined,
    photoPublicId: doc.photoPublicId ?? undefined,
    displayOrder: doc.displayOrder,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toFieldProcessStep(doc: Prisma.FieldProcessStepGetPayload<Record<string, never>>): FieldProcessStep {
  return {
    id: doc.id,
    stepKey: doc.stepKey,
    phase: doc.phase,
    copy: doc.copy,
    displayOrder: doc.displayOrder,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toCertificate(doc: Prisma.CertificateGetPayload<Record<string, never>>): Certificate {
  return {
    id: doc.id,
    title: doc.title,
    issuer: doc.issuer,
    description: doc.description,
    certificateUrl: doc.certificateUrl,
    certificatePublicId: doc.certificatePublicId ?? undefined,
    previewUrl: doc.previewUrl ?? undefined,
    previewPublicId: doc.previewPublicId ?? undefined,
    issuedOn: doc.issuedOn ?? undefined,
    displayOrder: doc.displayOrder,
    published: doc.published,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function projectToPrisma(project: Omit<Project, "id" | "createdAt" | "updatedAt">) {
  return nullToPrisma(project);
}

function announcementToPrisma(announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
  return nullToPrisma(announcement);
}

function homepageNewsToPrisma(item: Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">) {
  return nullToPrisma(item);
}

function internshipToPrisma(update: Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">) {
  return nullToPrisma(update);
}

function socialLinkToPrisma(link: Omit<SocialLink, "id" | "createdAt">) {
  return nullToPrisma(link);
}

function teamMemberToPrisma(member: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) {
  return { ...nullToPrisma(member), socials: member.socials as unknown as Prisma.InputJsonValue };
}

function certificateToPrisma(certificate: Omit<Certificate, "id" | "createdAt" | "updatedAt">) {
  return nullToPrisma(certificate);
}

function toPrismaUpdate<T extends Record<string, unknown>>(value: T) {
  return nullToPrisma(value);
}

function nullToPrisma<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item === undefined ? null : item]));
}

function isCompleteProject(project: Project) {
  return Boolean(project.title.trim() && project.slug.trim() && project.summary.trim() && project.coverUrl);
}

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}

function ignoreNotFound(error: unknown) {
  if (!isNotFound(error)) throw error;
}
