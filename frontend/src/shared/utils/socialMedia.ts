export type SocialMediaLinks = {
  instagram: string;
  tiktok: string;
  shopee: string;
  tokopedia: string;
  website: string;
};

export const emptySocialMediaLinks: SocialMediaLinks = {
  instagram: "",
  tiktok: "",
  shopee: "",
  tokopedia: "",
  website: "",
};

function cleanHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function parseSocialMediaValue(value?: string | null): SocialMediaLinks {
  const links: SocialMediaLinks = { ...emptySocialMediaLinks };

  if (!value?.trim()) return links;

  const parts = value
    .split(/[;\n|]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const [rawKey, ...rest] = part.split(":");
    const key = rawKey.trim().toLowerCase();
    const content = rest.join(":").trim();

    if (!content) {
      if (part.startsWith("@") && !links.instagram) {
        links.instagram = cleanHandle(part);
      }
      continue;
    }

    if (key.includes("instagram") || key === "ig") {
      links.instagram = cleanHandle(content);
    } else if (key.includes("tiktok")) {
      links.tiktok = cleanHandle(content);
    } else if (key.includes("shopee")) {
      links.shopee = content;
    } else if (key.includes("tokopedia")) {
      links.tokopedia = content;
    } else if (key.includes("website") || key.includes("web") || key.includes("katalog")) {
      links.website = content;
    }
  }

  return links;
}

export function serializeSocialMediaValue(links: SocialMediaLinks) {
  return [
    links.instagram.trim() ? `Instagram: ${cleanHandle(links.instagram)}` : "",
    links.tiktok.trim() ? `TikTok: ${cleanHandle(links.tiktok)}` : "",
    links.shopee.trim() ? `Shopee: ${links.shopee.trim()}` : "",
    links.tokopedia.trim() ? `Tokopedia: ${links.tokopedia.trim()}` : "",
    links.website.trim() ? `Website: ${links.website.trim()}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function hasAnySocialMedia(links: SocialMediaLinks) {
  return Object.values(links).some((value) => value.trim());
}
