import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_ORIGIN, WORKBENCH_DESCRIPTION } from './siteMeta';

export function upsertMetaName(name: string, content: string): void {
  const selector = `meta[name="${name}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function upsertMetaProperty(property: string, content: string): void {
  const selector = `meta[property="${property}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function upsertCanonical(href: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

const PAGE_LD_ID = 'seo-dynamic-page';

export function upsertPageJsonLd(data: Record<string, unknown>): void {
  let script = document.getElementById(PAGE_LD_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = PAGE_LD_ID;
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/** App shell routes: keep out of Google, avoid competing with marketing URLs. */
export function applyWorkbenchDocumentMeta(): void {
  document.querySelectorAll('meta[property^="article:"]').forEach((el) => el.remove());

  document.title = SITE_NAME;
  upsertMetaName('description', WORKBENCH_DESCRIPTION);
  upsertMetaName('robots', 'noindex, nofollow');
  upsertCanonical(`${SITE_ORIGIN}/`);
  upsertMetaProperty('og:title', SITE_NAME);
  upsertMetaProperty('og:description', WORKBENCH_DESCRIPTION);
  upsertMetaProperty('og:url', `${SITE_ORIGIN}/`);
  upsertMetaProperty('og:image', DEFAULT_OG_IMAGE);
  upsertMetaProperty('og:type', 'website');
  upsertMetaName('twitter:card', 'summary_large_image');
  upsertMetaName('twitter:title', SITE_NAME);
  upsertMetaName('twitter:description', WORKBENCH_DESCRIPTION);
  upsertMetaName('twitter:image', DEFAULT_OG_IMAGE);

  upsertPageJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SITE_NAME,
    description: WORKBENCH_DESCRIPTION,
    url: `${SITE_ORIGIN}/`,
  });
}
