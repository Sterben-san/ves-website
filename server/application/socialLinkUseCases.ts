import type { SocialPlatform } from "@/server/domain/entities";
import type { ISocialLinkRepository } from "@/server/domain/repositories";

export class ListSocialLinksUseCase {
  constructor(private readonly links: ISocialLinkRepository) {}

  async execute() {
    return this.links.list();
  }
}

export class ListFeaturedSocialLinksUseCase {
  constructor(private readonly links: ISocialLinkRepository) {}

  async execute() {
    return this.links.listFeatured();
  }
}

export class AddSocialLinkUseCase {
  constructor(private readonly links: ISocialLinkRepository) {}

  async execute(input: { postUrl: string; caption?: string; featured?: boolean; thumbnailUrl?: string }) {
    const { platform, postUrl } = validateSocialUrl(input.postUrl);
    const existing = await this.links.findByPlatformAndUrl(platform, postUrl);
    if (existing) {
      throw new Error("This social post is already listed.");
    }

    return this.links.add({
      platform,
      postUrl,
      caption: input.caption?.trim() || undefined,
      thumbnailUrl: input.thumbnailUrl?.trim() || undefined,
      featured: Boolean(input.featured),
      sortOrder: Date.now()
    });
  }
}

export class ToggleFeaturedSocialLinkUseCase {
  constructor(private readonly links: ISocialLinkRepository) {}

  async execute(id: string, featured: boolean) {
    const saved = await this.links.update(id, { featured });
    if (!saved) {
      throw new Error("Social link not found.");
    }
    return saved;
  }
}

export class RemoveSocialLinkUseCase {
  constructor(private readonly links: ISocialLinkRepository) {}

  async execute(id: string) {
    const existing = await this.links.findById(id);
    if (!existing) {
      throw new Error("Social link not found.");
    }
    await this.links.remove(id);
  }
}

export class ReorderSocialLinksUseCase {
  constructor(private readonly links: ISocialLinkRepository) {}

  async execute(ids: string[]) {
    return this.links.reorder(ids);
  }
}

export function validateSocialUrl(value: string): { platform: SocialPlatform; postUrl: string } {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid social post URL.");
  }

  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname;
  if (host === "instagram.com" && (/^\/p\/[^/]+/.test(path) || /^\/reel\/[^/]+/.test(path))) {
    return { platform: "instagram", postUrl: url.toString() };
  }
  if ((host === "linkedin.com" || host.endsWith(".linkedin.com")) && (/^\/posts\//.test(path) || /^\/feed\/update\//.test(path))) {
    return { platform: "linkedin", postUrl: url.toString() };
  }
  throw new Error("Use a public Instagram post/reel URL or LinkedIn post/update URL.");
}
