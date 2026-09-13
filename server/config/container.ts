import { GetAdminHomepageSummaryUseCase } from "@/server/application/adminHomepageUseCases";
import { CreateAnnouncementUseCase, DeleteAnnouncementUseCase, GetPinnedAnnouncementUseCase, GetPublishedAnnouncementUseCase, ListAllAnnouncementsForAdminUseCase, ListPublishedAnnouncementsUseCase, PinAnnouncementUseCase, UpdateAnnouncementUseCase } from "@/server/application/announcementUseCases";
import { GetCurrentAdminUseCase, LoginAdminUseCase, RefreshAdminSessionUseCase } from "@/server/application/authUseCases";
import { CreateCertificateUseCase, DeleteCertificateUseCase, ListAllCertificatesForAdminUseCase, ListPublishedCertificatesUseCase, ReorderCertificatesUseCase, UpdateCertificateUseCase } from "@/server/application/certificateUseCases";
import { ListFieldProcessStepsForAdminUseCase, ListFieldProcessStepsUseCase, UpdateFieldProcessStepUseCase } from "@/server/application/fieldProcessUseCases";
import { CreateHomepageNewsUseCase, DeleteHomepageNewsUseCase, ListAllHomepageNewsForAdminUseCase, ListPublishedHomepageNewsUseCase, ReorderHomepageNewsUseCase, UpdateHomepageNewsUseCase } from "@/server/application/homepageNewsUseCases";
import { CreateInternshipUseCase, DeactivateInternshipUseCase, DeleteInternshipUseCase, ListActiveInternshipsUseCase, ListAllInternshipsForAdminUseCase, UpdateInternshipUseCase } from "@/server/application/internshipUseCases";
import { DeleteSectionMediaUseCase, GetMediaUseCase, ListMediaUseCase, UpdateSectionAltTextUseCase, UploadSectionMediaUseCase } from "@/server/application/mediaUseCases";
import { CreateProjectUseCase, DeleteProjectUseCase, ListAllProjectsForAdminUseCase, ListFeaturedProjectsUseCase, ListPublishedProjectsUseCase, ReorderProjectsUseCase, UpdateProjectUseCase } from "@/server/application/projectUseCases";
import { GetSectionCopyUseCase, UpdateSectionCopyUseCase } from "@/server/application/sectionCopyUseCases";
import { AddSocialLinkUseCase, ListFeaturedSocialLinksUseCase, ListSocialLinksUseCase, RemoveSocialLinkUseCase, ReorderSocialLinksUseCase, ToggleFeaturedSocialLinkUseCase } from "@/server/application/socialLinkUseCases";
import { CreateTeamMemberUseCase, DeleteTeamMemberUseCase, ListActiveTeamMembersUseCase, ListAllTeamMembersForAdminUseCase, ReorderTeamMembersUseCase, UpdateTeamMemberUseCase } from "@/server/application/teamMemberUseCases";
import { BcryptPasswordService } from "@/server/infrastructure/auth/BcryptPasswordService";
import { JwtTokenService } from "@/server/infrastructure/auth/JwtTokenService";
import {
  PrismaAdminRepository,
  PrismaAnnouncementRepository,
  PrismaCertificateRepository,
  PrismaFieldProcessRepository,
  PrismaHomepageNewsRepository,
  PrismaInternshipRepository,
  PrismaMediaRepository,
  PrismaProjectRepository,
  PrismaSectionCopyRepository,
  PrismaSocialLinkRepository,
  PrismaTeamMemberRepository
} from "@/server/infrastructure/prisma/PrismaRepositories";
import { CloudinaryStorageService } from "@/server/infrastructure/storage/CloudinaryStorageService";

export function createContainer() {
  const admins = new PrismaAdminRepository();
  const media = new PrismaMediaRepository();
  const announcements = new PrismaAnnouncementRepository();
  const certificates = new PrismaCertificateRepository();
  const homepageNews = new PrismaHomepageNewsRepository();
  const projects = new PrismaProjectRepository();
  const sectionCopy = new PrismaSectionCopyRepository();
  const internships = new PrismaInternshipRepository();
  const socialLinks = new PrismaSocialLinkRepository();
  const teamMembers = new PrismaTeamMemberRepository();
  const fieldProcess = new PrismaFieldProcessRepository();
  const passwords = new BcryptPasswordService();
  const tokens = new JwtTokenService();
  const storage = new CloudinaryStorageService();

  return {
    admins,
    media,
    announcements,
    certificates,
    homepageNews,
    projects,
    sectionCopy,
    internships,
    socialLinks,
    teamMembers,
    fieldProcess,
    passwords,
    tokens,
    getAdminHomepageSummary: new GetAdminHomepageSummaryUseCase(announcements, internships, socialLinks, media),
    loginAdmin: new LoginAdminUseCase(admins, passwords, tokens),
    refreshAdminSession: new RefreshAdminSessionUseCase(admins, tokens),
    getCurrentAdmin: new GetCurrentAdminUseCase(admins),
    listMedia: new ListMediaUseCase(media),
    getMedia: new GetMediaUseCase(media),
    uploadSectionMedia: new UploadSectionMediaUseCase(media, storage),
    deleteSectionMedia: new DeleteSectionMediaUseCase(media, storage),
    updateSectionAltText: new UpdateSectionAltTextUseCase(media),
    listPublishedAnnouncements: new ListPublishedAnnouncementsUseCase(announcements),
    listAllAnnouncementsForAdmin: new ListAllAnnouncementsForAdminUseCase(announcements),
    getPublishedAnnouncement: new GetPublishedAnnouncementUseCase(announcements),
    getPinnedAnnouncement: new GetPinnedAnnouncementUseCase(announcements),
    createAnnouncement: new CreateAnnouncementUseCase(announcements, storage),
    updateAnnouncement: new UpdateAnnouncementUseCase(announcements, storage),
    pinAnnouncement: new PinAnnouncementUseCase(announcements),
    deleteAnnouncement: new DeleteAnnouncementUseCase(announcements, storage),
    listPublishedHomepageNews: new ListPublishedHomepageNewsUseCase(homepageNews),
    listAllHomepageNewsForAdmin: new ListAllHomepageNewsForAdminUseCase(homepageNews),
    createHomepageNews: new CreateHomepageNewsUseCase(homepageNews, storage),
    updateHomepageNews: new UpdateHomepageNewsUseCase(homepageNews, storage),
    deleteHomepageNews: new DeleteHomepageNewsUseCase(homepageNews, storage),
    reorderHomepageNews: new ReorderHomepageNewsUseCase(homepageNews),
    listPublishedCertificates: new ListPublishedCertificatesUseCase(certificates),
    listAllCertificatesForAdmin: new ListAllCertificatesForAdminUseCase(certificates),
    createCertificate: new CreateCertificateUseCase(certificates, storage),
    updateCertificate: new UpdateCertificateUseCase(certificates, storage),
    deleteCertificate: new DeleteCertificateUseCase(certificates, storage),
    reorderCertificates: new ReorderCertificatesUseCase(certificates),
    listPublishedProjects: new ListPublishedProjectsUseCase(projects),
    listFeaturedProjects: new ListFeaturedProjectsUseCase(projects),
    listAllProjectsForAdmin: new ListAllProjectsForAdminUseCase(projects),
    createProject: new CreateProjectUseCase(projects, storage),
    updateProject: new UpdateProjectUseCase(projects, storage),
    deleteProject: new DeleteProjectUseCase(projects, storage),
    reorderProjects: new ReorderProjectsUseCase(projects),
    getSectionCopy: new GetSectionCopyUseCase(sectionCopy),
    updateSectionCopy: new UpdateSectionCopyUseCase(sectionCopy),
    listActiveInternships: new ListActiveInternshipsUseCase(internships),
    listAllInternshipsForAdmin: new ListAllInternshipsForAdminUseCase(internships),
    createInternship: new CreateInternshipUseCase(internships, storage),
    updateInternship: new UpdateInternshipUseCase(internships, storage),
    deactivateInternship: new DeactivateInternshipUseCase(internships),
    deleteInternship: new DeleteInternshipUseCase(internships, storage),
    listSocialLinks: new ListSocialLinksUseCase(socialLinks),
    listFeaturedSocialLinks: new ListFeaturedSocialLinksUseCase(socialLinks),
    addSocialLink: new AddSocialLinkUseCase(socialLinks),
    toggleFeaturedSocialLink: new ToggleFeaturedSocialLinkUseCase(socialLinks),
    removeSocialLink: new RemoveSocialLinkUseCase(socialLinks),
    reorderSocialLinks: new ReorderSocialLinksUseCase(socialLinks),
    listActiveTeamMembers: new ListActiveTeamMembersUseCase(teamMembers),
    listAllTeamMembersForAdmin: new ListAllTeamMembersForAdminUseCase(teamMembers),
    createTeamMember: new CreateTeamMemberUseCase(teamMembers, storage),
    updateTeamMember: new UpdateTeamMemberUseCase(teamMembers, storage),
    deleteTeamMember: new DeleteTeamMemberUseCase(teamMembers, storage),
    reorderTeamMembers: new ReorderTeamMembersUseCase(teamMembers),
    listFieldProcessSteps: new ListFieldProcessStepsUseCase(fieldProcess),
    listFieldProcessStepsForAdmin: new ListFieldProcessStepsForAdminUseCase(fieldProcess),
    updateFieldProcessStep: new UpdateFieldProcessStepUseCase(fieldProcess)
  };
}
