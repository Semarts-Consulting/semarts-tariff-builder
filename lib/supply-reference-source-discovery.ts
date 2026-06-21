export type SourceDiscoveryLink = {
  title: string;
  url: string;
};

export type SourceDiscoveryResult = {
  sourceUrl: string;
  matchedLinks: SourceDiscoveryLink[];
  notes: string;
};

const relevantLinkTerms = [
  "use of system",
  "duos",
  "charging statement",
  "schedule of charges",
  "charges",
  "2026",
  "2027"
];

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " "));
}

function resolveUrl(href: string, sourceUrl: string) {
  try {
    return new URL(href, sourceUrl).toString();
  } catch {
    return "";
  }
}

function isRelevantLink(title: string, url: string) {
  const searchable = `${title} ${url}`.toLowerCase();
  return relevantLinkTerms.some((term) => searchable.includes(term));
}

export function discoverUkpnSourceLinks(html: string, sourceUrl: string): SourceDiscoveryResult {
  const links = new Map<string, SourceDiscoveryLink>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match = anchorPattern.exec(html);

  while (match) {
    const url = resolveUrl(decodeHtmlEntities(match[1]), sourceUrl);
    const title = stripTags(match[2]) || url;

    if (url && isRelevantLink(title, url)) {
      links.set(url, { title, url });
    }

    match = anchorPattern.exec(html);
  }

  const matchedLinks = Array.from(links.values()).sort((first, second) =>
    first.title.localeCompare(second.title)
  );

  return {
    sourceUrl,
    matchedLinks,
    notes:
      matchedLinks.length > 0
        ? `UKPN source discovery found ${matchedLinks.length} potentially relevant document link${matchedLinks.length === 1 ? "" : "s"}. Semarts admin must review the documents before approving TOU bands or distribution losses.`
        : "UKPN source discovery completed, but no relevant document links were detected. Semarts admin must review the source page manually."
  };
}
