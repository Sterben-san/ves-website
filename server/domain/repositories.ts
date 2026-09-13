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
  TeamMember
} from "./entities";

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: string): Promise<Admin | null>;
  upsert(admin: Omit<Admin, "id" | "createdAt">): Promise<Admin>;
  touchLastLogin(id: string): Promise<void>;
}

export interface IMediaRepository {
  list(): Promise<SectionMedia[]>;
  findBySectionKey(sectionKey: string): Promise<SectionMedia | null>;
  upsert(media: Omit<SectionMedia, "id" | "updatedAt">): Promise<SectionMedia>;
  delete(sectionKey: string): Promise<void>;
}

export interface ISectionCopyRepository {
  findBySectionKey(sectionKey: string): Promise<SectionCopy | null>;
  upsert(copy: Omit<SectionCopy, "id" | "updatedAt">): Promise<SectionCopy>;
}

export interface IProjectRepository {
  list(): Promise<Project[]>;
  listPublished(featured?: boolean): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  findBySlug(slug: string): Promise<Project | null>;
  create(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project>;
  update(id: string, project: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>): Promise<Project | null>;
  delete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<Project[]>;
}

export interface IAnnouncementRepository {
  list(kind?: AnnouncementKind): Promise<Announcement[]>;
  listPublished(kind?: AnnouncementKind): Promise<Announcement[]>;
  findById(id: string): Promise<Announcement | null>;
  findBySlug(slug: string): Promise<Announcement | null>;
  findPinned(): Promise<Announcement | null>;
  create(announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Promise<Announcement>;
  update(id: string, announcement: Partial<Omit<Announcement, "id" | "createdAt" | "updatedAt">>): Promise<Announcement | null>;
  delete(id: string): Promise<void>;
  setPinned(id: string): Promise<Announcement | null>;
}

export interface IHomepageNewsRepository {
  list(): Promise<HomepageNewsItem[]>;
  listPublished(): Promise<HomepageNewsItem[]>;
  findById(id: string): Promise<HomepageNewsItem | null>;
  create(item: Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">): Promise<HomepageNewsItem>;
  update(id: string, item: Partial<Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">>): Promise<HomepageNewsItem | null>;
  delete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<HomepageNewsItem[]>;
}

export interface IInternshipRepository {
  listAll(): Promise<InternshipUpdate[]>;
  listActive(): Promise<InternshipUpdate[]>;
  findById(id: string): Promise<InternshipUpdate | null>;
  create(update: Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">): Promise<InternshipUpdate>;
  update(id: string, update: Partial<Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">>): Promise<InternshipUpdate | null>;
  delete(id: string): Promise<void>;
}

export interface ISocialLinkRepository {
  list(): Promise<SocialLink[]>;
  listFeatured(): Promise<SocialLink[]>;
  findById(id: string): Promise<SocialLink | null>;
  add(link: Omit<SocialLink, "id" | "createdAt">): Promise<SocialLink>;
  update(id: string, link: Partial<Omit<SocialLink, "id" | "createdAt">>): Promise<SocialLink | null>;
  remove(id: string): Promise<void>;
  findByPlatformAndUrl(platform: SocialPlatform, postUrl: string): Promise<SocialLink | null>;
  reorder(ids: string[]): Promise<SocialLink[]>;
}

export interface ITeamMemberRepository {
  list(): Promise<TeamMember[]>;
  listActive(): Promise<TeamMember[]>;
  findById(id: string): Promise<TeamMember | null>;
  create(member: Omit<TeamMember, "id" | "createdAt" | "updatedAt">): Promise<TeamMember>;
  update(id: string, member: Partial<Omit<TeamMember, "id" | "createdAt" | "updatedAt">>): Promise<TeamMember | null>;
  delete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<TeamMember[]>;
  findByEmail(email: string): Promise<TeamMember | null>;
}

export interface IFieldProcessRepository {
  list(): Promise<FieldProcessStep[]>;
  findById(id: string): Promise<FieldProcessStep | null>;
  findByStepKey(stepKey: string): Promise<FieldProcessStep | null>;
  upsertByStepKey(step: Omit<FieldProcessStep, "id" | "createdAt" | "updatedAt">): Promise<FieldProcessStep>;
  update(id: string, step: Partial<Omit<FieldProcessStep, "id" | "stepKey" | "createdAt" | "updatedAt">>): Promise<FieldProcessStep | null>;
}

export interface ICertificateRepository {
  list(): Promise<Certificate[]>;
  listPublished(): Promise<Certificate[]>;
  findById(id: string): Promise<Certificate | null>;
  findByUrl(certificateUrl: string): Promise<Certificate | null>;
  create(certificate: Omit<Certificate, "id" | "createdAt" | "updatedAt">): Promise<Certificate>;
  update(id: string, certificate: Partial<Omit<Certificate, "id" | "createdAt" | "updatedAt">>): Promise<Certificate | null>;
  delete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<Certificate[]>;
}
