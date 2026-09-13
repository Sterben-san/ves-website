import { getActiveInternships, getPublishedAnnouncements, getPublishedCertificates, getPublishedHomepageNewsItems, getSocialLinks } from "@/lib/content";
import { Header } from "./Header";

export async function PublicHeader() {
  const [announcements, homepageNews, internships, socialLinks, certificates] = await Promise.all([
    getPublishedAnnouncements(undefined, 1),
    getPublishedHomepageNewsItems(),
    getActiveInternships(),
    getSocialLinks(),
    getPublishedCertificates()
  ]);
  return <Header showNews={announcements.total > 0 || homepageNews.length > 0} showInternships={internships.length > 0} showCertifications={certificates.length > 0} showSocial={socialLinks.length > 0} />;
}
