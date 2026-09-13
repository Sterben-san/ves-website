export type AdminRole = "admin";
export type MediaType = "image" | "video";
export type StoredAssetKind = MediaType | "raw";
export type AnnouncementKind = "article" | "video" | "update";
export type HomepageNewsKind = "article" | "photo" | "milestone";
export type SocialPlatform = "instagram" | "linkedin";
export type TeamSocialPlatform = "instagram" | "linkedin" | "x" | "github" | "website" | "other";

export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface SectionMedia {
  id: string;
  sectionKey: string;
  mediaType: MediaType;
  url: string;
  publicId: string;
  altText: string;
  uploadedBy?: string;
  width?: number;
  height?: number;
  bytes?: number;
  updatedAt: Date;
}

export interface SectionSlot {
  sectionKey: string;
  label: string;
  defaultMediaType: MediaType;
  defaultUrl: string;
  defaultAltText: string;
  aspectRatio?: number;
  maxWidth?: number;
  allowVideo?: boolean;
}

export interface SectionCopy {
  id: string;
  sectionKey: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  visible: boolean;
  theme: "dark" | "light" | "green";
  animationDirection: "left" | "right";
  animationSeconds: number;
  maxItems: number;
  updatedAt: Date;
}

export interface StoredAsset {
  mediaType: StoredAssetKind;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  location?: string;
  category?: string;
  coverUrl?: string;
  coverPublicId?: string;
  displayOrder: number;
  featured: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  kind: AnnouncementKind;
  title: string;
  slug: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  backgroundType: "none" | "image" | "video";
  backgroundUrl?: string;
  backgroundPublicId?: string;
  posterUrl?: string;
  posterPublicId?: string;
  mobileFallbackUrl?: string;
  mobileFallbackPublicId?: string;
  overlayOpacity: number;
  textPosition: "left" | "center" | "right";
  pinned: boolean;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomepageNewsItem {
  id: string;
  kind: HomepageNewsKind;
  title: string;
  summary: string;
  body?: string;
  imageUrl?: string;
  imagePublicId?: string;
  linkLabel?: string;
  linkHref?: string;
  displayOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternshipUpdate {
  id: string;
  title: string;
  description: string;
  location?: string;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  applyUrl?: string;
  applyEmail?: string;
  active: boolean;
  postedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  postUrl: string;
  caption?: string;
  thumbnailUrl?: string;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface TeamSocialLink {
  platform: TeamSocialPlatform;
  url: string;
}

export interface TeamMember {
  id: string;
  fullName: string;
  role: string;
  bio: string;
  email: string;
  phone?: string;
  linkedinUrl: string;
  socials: TeamSocialLink[];
  photoUrl?: string;
  photoPublicId?: string;
  displayOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldProcessStep {
  id: string;
  stepKey: string;
  phase: string;
  copy: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  description: string;
  certificateUrl: string;
  certificatePublicId?: string;
  previewUrl?: string;
  previewPublicId?: string;
  issuedOn?: Date;
  displayOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}
