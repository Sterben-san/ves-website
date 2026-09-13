import { createContainer } from "@/server/config/container";
import { defaultFieldProcessSteps } from "@/server/application/fieldProcessUseCases";
import { defaultNewsSectionCopy } from "@/server/application/sectionCopyUseCases";
import type { Announcement, AnnouncementKind, Certificate, FieldProcessStep, HomepageNewsItem, InternshipUpdate, Project, SectionCopy, SocialLink, TeamMember } from "@/server/domain/entities";

const demoDate = new Date("2026-09-12T00:00:00.000Z");

function logContentFetchFailure(source: string, error: unknown) {
  console.warn(`[content-fetch:${source}] Data fetch failed; hiding admin-controlled public content.`, error);
}

export async function getPublishedAnnouncements(kind?: AnnouncementKind, page = 1) {
  try {
    return await createContainer().listPublishedAnnouncements.execute({ kind, page });
  } catch (error) {
    logContentFetchFailure("published-announcements", error);
    return { items: [] as Announcement[], page, pageSize: 12, total: 0, totalPages: 1 };
  }
}

export async function getNewsSectionCopy() {
  try {
    return await createContainer().getSectionCopy.execute(defaultNewsSectionCopy.sectionKey);
  } catch {
    return {
      ...defaultNewsSectionCopy,
      id: defaultNewsSectionCopy.sectionKey,
      updatedAt: demoDate
    } as SectionCopy;
  }
}

export async function getPublishedAnnouncement(slug: string) {
  try {
    return await createContainer().getPublishedAnnouncement.execute(slug);
  } catch (error) {
    logContentFetchFailure("published-announcement", error);
    return null;
  }
}

export async function getPinnedAnnouncement() {
  try {
    return await createContainer().getPinnedAnnouncement.execute();
  } catch (error) {
    logContentFetchFailure("pinned-announcement", error);
    return null;
  }
}

export async function getAllAnnouncementsForAdmin() {
  try {
    return await createContainer().listAllAnnouncementsForAdmin.execute();
  } catch {
    return [] as Announcement[];
  }
}

export async function getPublishedHomepageNewsItems() {
  try {
    return await createContainer().listPublishedHomepageNews.execute();
  } catch (error) {
    logContentFetchFailure("homepage-news", error);
    return [] as HomepageNewsItem[];
  }
}

export async function getAllHomepageNewsForAdmin() {
  try {
    return await createContainer().listAllHomepageNewsForAdmin.execute();
  } catch {
    return [] as HomepageNewsItem[];
  }
}

export async function getPublishedProjects(featured?: boolean) {
  try {
    return await createContainer().listPublishedProjects.execute({ featured });
  } catch {
    return [] as Project[];
  }
}

export async function getAllProjectsForAdmin() {
  try {
    return await createContainer().listAllProjectsForAdmin.execute();
  } catch {
    return [] as Project[];
  }
}

export async function getActiveInternships() {
  try {
    return await createContainer().listActiveInternships.execute();
  } catch (error) {
    logContentFetchFailure("active-internships", error);
    return [] as InternshipUpdate[];
  }
}

export async function getSocialLinks() {
  try {
    return await createContainer().listSocialLinks.execute();
  } catch {
    return [] as SocialLink[];
  }
}

export async function getFeaturedSocialLinks() {
  try {
    return await createContainer().listFeaturedSocialLinks.execute();
  } catch {
    return [] as SocialLink[];
  }
}

export async function getAllInternshipsForAdmin() {
  try {
    return await createContainer().listAllInternshipsForAdmin.execute();
  } catch {
    return [] as InternshipUpdate[];
  }
}

export async function getAllSocialLinksForAdmin() {
  try {
    return await createContainer().listSocialLinks.execute();
  } catch {
    return [] as SocialLink[];
  }
}

export async function getActiveTeamMembers() {
  try {
    return await createContainer().listActiveTeamMembers.execute();
  } catch {
    return [] as TeamMember[];
  }
}

export async function getAllTeamMembersForAdmin() {
  try {
    return await createContainer().listAllTeamMembersForAdmin.execute();
  } catch {
    return [] as TeamMember[];
  }
}

export async function getFieldProcessSteps() {
  try {
    return await createContainer().listFieldProcessSteps.execute();
  } catch {
    return defaultFieldProcessSteps.map((step) => ({
      ...step,
      id: step.stepKey,
      createdAt: demoDate,
      updatedAt: demoDate
    })) as FieldProcessStep[];
  }
}

export async function getFieldProcessStepsForAdmin() {
  try {
    return await createContainer().listFieldProcessStepsForAdmin.execute();
  } catch {
    return [] as FieldProcessStep[];
  }
}

export async function getPublishedCertificates() {
  try {
    return await createContainer().listPublishedCertificates.execute();
  } catch (error) {
    logContentFetchFailure("published-certificates", error);
    return [] as Certificate[];
  }
}

export async function getAllCertificatesForAdmin() {
  try {
    return await createContainer().listAllCertificatesForAdmin.execute();
  } catch {
    return [] as Certificate[];
  }
}
