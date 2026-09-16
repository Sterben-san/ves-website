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
import { getActiveInternships, getActiveTeamMembers, getFieldProcessSteps, getHomepageSectionCopies, getNewsSectionCopy, getPinnedAnnouncement, getPublishedAnnouncements, getPublishedCertificates, getPublishedHomepageNewsItems, getPublishedProjects, getSocialLinks, heroStatSectionKeys } from "@/lib/content";
import { aboutDetailSectionKeys } from "@/server/application/sectionCopyUseCases";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [media, announcements, homepageNews, newsSectionCopy, sectionCopies, pinnedAnnouncement, internships, socialLinks, teamMembers, featuredProjects, fieldProcessSteps, certificates] = await Promise.all([
    getMediaMap(),
    getPublishedAnnouncements(undefined, 1),
    getPublishedHomepageNewsItems(),
    getNewsSectionCopy(),
    getHomepageSectionCopies(),
    getPinnedAnnouncement(),
    getActiveInternships(),
    getSocialLinks(),
    getActiveTeamMembers(),
    getPublishedProjects(true),
    getFieldProcessSteps(),
    getPublishedCertificates()
  ]);
  const heroStats = heroStatSectionKeys.map((sectionKey) => sectionCopies[sectionKey]).filter(Boolean);
  const aboutDetails = Object.fromEntries(aboutDetailSectionKeys.map((sectionKey) => [sectionKey, sectionCopies[sectionKey]]));

  return (
    <>
      <Header showNews={announcements.total > 0 || homepageNews.length > 0} showInternships={internships.length > 0} showCertifications={certificates.length > 0} showSocial={socialLinks.length > 0} />
      <main>
        {pinnedAnnouncement ? <AnnouncementHero announcement={pinnedAnnouncement} /> : null}
        <Hero copy={sectionCopies["home.hero"]} media={media} />
        <SlidingIconRail />
        <InternshipNoticeBar copy={sectionCopies["home.internships"]} internships={internships.slice(0, 2)} />
        <Stats stats={heroStats} />
        <Journey copy={sectionCopies["home.journey"]} steps={fieldProcessSteps} />
        <About copy={sectionCopies["home.about"]} details={aboutDetails} media={media} />
        <Certifications certificates={certificates} copy={sectionCopies["home.certifications"]} />
        <Solutions copy={sectionCopies["home.solutions"]} projects={featuredProjects} />
        <LatestUpdates items={homepageNews.slice(0, newsSectionCopy.maxItems)} copy={newsSectionCopy} />
        <CompanyStory copy={sectionCopies["home.companyModel"]} />
        <Team copy={sectionCopies["home.team"]} members={teamMembers} />
        <SocialShowcase copy={sectionCopies["home.social"]} links={socialLinks} />
        <CTA copy={sectionCopies["home.contact"]} />
      </main>
      <Footer media={media} />
    </>
  );
}
