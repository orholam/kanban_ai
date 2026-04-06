import { useEffect } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
} from '../lib/siteMeta';
import {
  upsertCanonical,
  upsertMetaName,
  upsertMetaProperty,
  upsertPageJsonLd,
} from '../lib/documentMeta';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  /** Use for account-only or internal pages — keeps them out of the index. */
  noindex?: boolean;
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_OG_IMAGE,
  url = 'https://kanbanai.dev/',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    document.querySelectorAll('meta[property^="article:"]').forEach((el) => el.remove());

    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';

    document.title = title;
    upsertMetaName('description', description);
    upsertMetaName('keywords', keywords);
    upsertMetaName('author', author || SITE_NAME);
    upsertMetaName('robots', robotsContent);

    upsertMetaProperty('og:title', title);
    upsertMetaProperty('og:description', description);
    upsertMetaProperty('og:image', image);
    upsertMetaProperty('og:url', url);
    upsertMetaProperty('og:type', type);
    upsertMetaProperty('og:site_name', SITE_NAME);
    upsertMetaProperty('og:locale', 'en_US');

    upsertMetaName('twitter:card', 'summary_large_image');
    upsertMetaName('twitter:title', title);
    upsertMetaName('twitter:description', description);
    upsertMetaName('twitter:image', image);
    upsertMetaName('twitter:site', '@kanbanai');
    upsertMetaName('twitter:creator', '@kanbanai');

    if (type === 'article') {
      if (publishedTime) upsertMetaProperty('article:published_time', publishedTime);
      if (modifiedTime) upsertMetaProperty('article:modified_time', modifiedTime);
      if (author) upsertMetaProperty('article:author', author);
      if (section) upsertMetaProperty('article:section', section);
    }

    const articleTagEls: HTMLMetaElement[] = [];
    if (type === 'article' && tags.length > 0) {
      tags.forEach((tag) => {
        const tagMeta = document.createElement('meta');
        tagMeta.setAttribute('property', 'article:tag');
        tagMeta.setAttribute('content', tag);
        document.head.appendChild(tagMeta);
        articleTagEls.push(tagMeta);
      });
    }

    upsertCanonical(url);

    const pageLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'Article' : 'WebPage',
      name: title,
      description,
      url,
      image,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: 'https://kanbanai.dev/',
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: 'https://kanbanai.dev/',
        logo: {
          '@type': 'ImageObject',
          url: 'https://kanbanai.dev/favicon.svg',
        },
      },
    };

    if (type === 'article') {
      if (author) pageLd.author = { '@type': 'Person', name: author };
      if (publishedTime) pageLd.datePublished = publishedTime;
      if (modifiedTime) pageLd.dateModified = modifiedTime;
    }

    upsertPageJsonLd(pageLd);

    return () => {
      articleTagEls.forEach((el) => el.remove());
      document.querySelectorAll('meta[property^="article:"]').forEach((el) => el.remove());
    };
  }, [
    title,
    description,
    keywords,
    image,
    url,
    type,
    author,
    publishedTime,
    modifiedTime,
    section,
    tags,
    noindex,
  ]);

  return null;
}
