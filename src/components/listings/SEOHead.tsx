import { useEffect, useMemo } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  structuredData?: object;
  ogImage?: string;
}

const DEFAULT_OG_IMAGE = "/android-chrome-512x512.png";
const DEFAULT_TITLE = "Sunnyplans";

// Mark elements we own so cleanup removes only what this component
// inserted, never the static head tags from index.html.
const OWNED_ATTR = "data-seohead";

function ownedMeta(attr: "name" | "property", name: string, content: string): void {
  const selector = `meta[${attr}="${name}"]`;
  let meta = document.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, name);
    meta.setAttribute(OWNED_ATTR, "");
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function ownedCanonical(href: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    link.setAttribute(OWNED_ATTR, "");
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeCanonical(): void {
  const link = document.querySelector<HTMLLinkElement>(`link[rel="canonical"][${OWNED_ATTR}]`);
  link?.remove();
}

function setStructuredData(json: string): void {
  let script = document.querySelector<HTMLScriptElement>(`script[type="application/ld+json"][${OWNED_ATTR}]`);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(OWNED_ATTR, "");
    document.head.appendChild(script);
  }
  script.textContent = json;
}

function removeStructuredData(): void {
  const script = document.querySelector<HTMLScriptElement>(`script[type="application/ld+json"][${OWNED_ATTR}]`);
  script?.remove();
}

const SEOHead = ({
  title,
  description,
  keywords,
  canonicalUrl,
  structuredData,
  ogImage = DEFAULT_OG_IMAGE,
}: SEOHeadProps) => {
  // Serialize structuredData once per render and use the *string* as
  // the effect dep. Pages build structuredData inline (a fresh object
  // every render), so depending on the object identity rewrites head
  // tags on every render of the host page. The string-shaped dep is
  // stable across identity-only changes.
  const structuredDataJson = useMemo(
    () => (structuredData ? JSON.stringify(structuredData) : null),
    [structuredData],
  );

  useEffect(() => {
    document.title = title;
    ownedMeta("name", "description", description);
    if (keywords) ownedMeta("name", "keywords", keywords);

    ownedMeta("property", "og:title", title);
    ownedMeta("property", "og:description", description);
    ownedMeta("property", "og:type", "website");
    if (ogImage) ownedMeta("property", "og:image", ogImage);

    ownedMeta("name", "twitter:card", "summary_large_image");
    ownedMeta("name", "twitter:title", title);
    ownedMeta("name", "twitter:description", description);
    if (ogImage) ownedMeta("name", "twitter:image", ogImage);

    if (canonicalUrl) ownedCanonical(canonicalUrl);
    else removeCanonical();

    if (structuredDataJson) setStructuredData(structuredDataJson);
    else removeStructuredData();

    return () => {
      // Tear down route-specific tags so they don't leak to the next
      // page. Title resets to the default; static meta (description,
      // og:*, twitter:*) gets overwritten by the next mount, so leaving
      // them in place between mounts is fine — only canonical and
      // JSON-LD need explicit removal because not every page sets them.
      document.title = DEFAULT_TITLE;
      removeCanonical();
      removeStructuredData();
    };
  }, [title, description, keywords, canonicalUrl, structuredDataJson, ogImage]);

  return null;
};

export default SEOHead;
