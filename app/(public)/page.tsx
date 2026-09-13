import { getMediaMap } from "@/lib/media";
import { About } from "./components/About";
import { CTA } from "./components/CTA";
import { Certifications } from "./components/Certifications";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Journey } from "./components/Journey";
import { LatestUpdates } from "./components/LatestUpdates";
import { AnnouncementHero } from "./components/AnnouncementHero";
import { CompanyStory } from "./components/PitchDeckStory";
import { SocialShowcase } from "./components/SocialShowcase";
import { Solutions } from "./components/Solutions";
import { SlidingIconRail } from "./components/SlidingIconRail";
import { Stats } from "./components/Stats";
import { Team } from "./components/Team";
import { InternshipNoticeBar } from "./components/InternshipNoticeBar";
import { getActiveInternships, getActiveTeamMembers, getFieldProcessSteps, getNewsSectionCopy, getPinnedAnnouncement, getPublishedAnnouncements, getPublishedCertificates, getPublishedHomepageNewsItems, getPublishedProjects, getSocialLinks } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [media, announcements, homepageNews, newsSectionCopy, pinnedAnnouncement, internships, socialLinks, teamMembers, featuredProjects, fieldProcessSteps, certificates] = await Promise.all([
    getMediaMap(),
    getPublishedAnnouncements(undefined, 1),
    getPublishedHomepageNewsItems(),
    getNewsSectionCopy(),
    getPinnedAnnouncement(),
    getActiveInternships(),
    getSocialLinks(),
    getActiveTeamMembers(),
    getPublishedProjects(true),
    getFieldProcessSteps(),
    getPublishedCertificates()
  ]);

  return (
    <>
      <Header showNews={announcements.total > 0 || homepageNews.length > 0} showInternships={internships.length > 0} showCertifications={certificates.length > 0} showSocial={socialLinks.length > 0} />
      <main>
        {pinnedAnnouncement ? <AnnouncementHero announcement={pinnedAnnouncement} /> : null}
        <Hero media={media} />
        <SlidingIconRail />
        <InternshipNoticeBar internships={internships.slice(0, 2)} />
        <Stats />
        <Journey steps={fieldProcessSteps} />
        <About media={media} />
        <Certifications certificates={certificates} />
        <Solutions projects={featuredProjects} />
        <LatestUpdates items={homepageNews.slice(0, newsSectionCopy.maxItems)} copy={newsSectionCopy} />
        <CompanyStory />
        <Team members={teamMembers} />
        <SocialShowcase links={socialLinks} />
        <CTA />
      </main>
      <Footer media={media} />
    </>
  );
}
