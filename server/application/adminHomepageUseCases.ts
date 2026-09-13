import { sectionSlotMap, sectionSlots } from "@/server/domain/sectionSlots";
import type { IAnnouncementRepository, IInternshipRepository, IMediaRepository, ISocialLinkRepository } from "@/server/domain/repositories";

export class GetAdminHomepageSummaryUseCase {
  constructor(
    private readonly announcements: IAnnouncementRepository,
    private readonly internships: IInternshipRepository,
    private readonly socialLinks: ISocialLinkRepository,
    private readonly media: IMediaRepository
  ) {}

  async execute() {
    const [allAnnouncements, publishedAnnouncements, pinnedAnnouncement, allInternships, activeInternships, allSocialLinks, featuredSocialLinks, mediaItems] =
      await Promise.all([
        this.announcements.list(),
        this.announcements.listPublished(),
        this.announcements.findPinned(),
        this.internships.listAll(),
        this.internships.listActive(),
        this.socialLinks.list(),
        this.socialLinks.listFeatured(),
        this.media.list()
      ]);

    const customMedia = mediaItems.filter((item) => {
      const slot = sectionSlotMap.get(item.sectionKey);
      return Boolean(item.publicId) || Boolean(slot && item.url !== slot.defaultUrl);
    });
    const missingAltTextSlots = mediaItems
      .filter((item) => !item.altText.trim())
      .map((item) => item.sectionKey);

    return {
      pinnedAnnouncement,
      recentAnnouncements: publishedAnnouncements.slice(0, 4),
      publishedAnnouncementCount: publishedAnnouncements.length,
      draftAnnouncementCount: allAnnouncements.filter((item) => !item.published).length,
      activeInternshipCount: activeInternships.length,
      totalInternshipCount: allInternships.length,
      featuredSocialCount: featuredSocialLinks.length,
      totalSocialCount: allSocialLinks.length,
      customMediaSlotCount: customMedia.length,
      totalMediaSlotCount: sectionSlots.length,
      missingAltTextSlots
    };
  }
}
