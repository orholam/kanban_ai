/**
 * Post-build static prerender for public marketing routes.
 *
 * Writes route-specific `index.html` files under `dist/` with correct title,
 * description, canonical, Open Graph tags, JSON-LD, and crawlable body copy.
 * Does not require Puppeteer/Chrome — works on Vercel and other CI builds.
 *
 * Set SKIP_PRERENDER=1 to skip. Failures exit non-zero so deploys don't ship
 * a single SPA shell for every URL (which breaks Google indexing).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { collectPrerenderRoutes } from './collect-prerender-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const distDir = path.join(frontendRoot, 'dist');
const SITE = 'https://kanbanai.dev';
const OG_IMAGE = `${SITE}/og-image.png`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function routeToOutputFile(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  const segments = route.replace(/^\//, '').replace(/\/$/, '');
  return path.join(distDir, segments, 'index.html');
}

function absoluteUrl(route) {
  if (route === '/') return `${SITE}/`;
  return `${SITE}${route}`;
}

function setMetaName(html, name, content) {
  const safe = escapeHtml(content);
  const re = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*/?>`, 'i');
  if (re.test(html)) {
    return html.replace(re, `<meta name="${name}" content="${safe}" />`);
  }
  return html.replace(
    /<\/head>/i,
    `    <meta name="${name}" content="${safe}" />\n  </head>`
  );
}

function setMetaProperty(html, property, content) {
  const safe = escapeHtml(content);
  const re = new RegExp(
    `<meta\\s+property="${property}"\\s+content="[^"]*"\\s*/?>`,
    'i'
  );
  if (re.test(html)) {
    return html.replace(re, `<meta property="${property}" content="${safe}" />`);
  }
  return html.replace(
    /<\/head>/i,
    `    <meta property="${property}" content="${safe}" />\n  </head>`
  );
}

function setTitle(html, title) {
  const safe = escapeHtml(title);
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safe}</title>`);
}

function setCanonical(html, href) {
  const safe = escapeHtml(href);
  if (/rel="canonical"/i.test(html)) {
    return html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${safe}" />`
    );
  }
  return html.replace(
    /<\/head>/i,
    `    <link rel="canonical" href="${safe}" />\n  </head>`
  );
}

function upsertPageJsonLd(html, data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const block = `    <script id="seo-dynamic-page" type="application/ld+json">${json}</script>\n`;
  if (/id="seo-dynamic-page"/i.test(html)) {
    return html.replace(
      /<script id="seo-dynamic-page" type="application\/ld\+json">[\s\S]*?<\/script>\n?/i,
      block
    );
  }
  return html.replace(/<\/head>/i, `${block}  </head>`);
}

function injectRootContent(html, innerHtml) {
  return html.replace(
    /<div id="root"><\/div>/i,
    `<div id="root">${innerHtml}</div>`
  );
}

/** Lightweight markdown → HTML for crawler-visible article bodies. */
function markdownToHtml(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let inList = false;
  let para = [];

  const flushPara = () => {
    if (para.length === 0) return;
    const text = para.join(' ').trim();
    if (text) out.push(`<p>${inlineFormat(text)}</p>`);
    para = [];
  };

  const flushList = () => {
    if (!inList) return;
    out.push('</ul>');
    inList = false;
  };

  for (const raw of lines) {
    const line = raw;
    if (line.startsWith('```')) {
      flushPara();
      flushList();
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushPara();
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inlineFormat(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\|.+\|$/.test(line) || /^\|?[\s-:|]+\|$/.test(line)) {
      flushPara();
      flushList();
      // Skip markdown table chrome; keep row text as a paragraph for indexing.
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
        .filter((c) => !/^[-:]+$/.test(c));
      if (cells.length) out.push(`<p>${inlineFormat(cells.join(' — '))}</p>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushPara();
      flushList();
      out.push('<hr />');
      continue;
    }

    para.push(line.trim());
  }

  flushPara();
  flushList();
  if (inCode) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }
  return out.join('\n');
}

function inlineFormat(text) {
  let s = escapeHtml(text);
  // Absolute and root-relative internal links (SPA markdown uses /blog/... heavily)
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function loadBlogPosts() {
  const blogDir = path.join(frontendRoot, 'src/data/blog');
  return fs
    .readdirSync(blogDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const post = JSON.parse(fs.readFileSync(path.join(blogDir, name), 'utf8'));
      return { ...post, slug: name.replace(/\.json$/, '') };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function loadDocArticles() {
  const articlesPath = path.join(
    frontendRoot,
    'src/documentation-board-feature/documentationArticles.ts'
  );
  const source = fs.readFileSync(articlesPath, 'utf8');
  const articles = [];
  const blockRe =
    /\{\s*id:\s*'([^']+)'[\s\S]*?title:\s*'((?:\\'|[^'])*)'[\s\S]*?excerpt:\s*'((?:\\'|[^'])*)'/g;
  let match;
  while ((match = blockRe.exec(source))) {
    articles.push({
      id: match[1],
      title: match[2].replace(/\\'/g, "'"),
      excerpt: match[3].replace(/\\'/g, "'"),
    });
  }
  return articles;
}

const STATIC_PAGE_META = {
  '/': {
    title: 'Kanban AI — AI Kanban Board with AI Task Planning & MCP',
    description:
      'AI kanban board for builders and small teams: AI task planning, smart columns, sprints, and Cursor/Claude MCP. Try a free guest board — no signup required.',
    keywords:
      'kanban AI, AI kanban, AI kanban board, kanban software with ai, AI task management, kanban app, sprint planning, MCP, side projects',
    type: 'website',
    bodyHtml: `
      <main>
        <h1>Kanban AI</h1>
        <p>AI-powered kanban boards and task planning for builders and small teams.</p>
        <nav>
          <a href="${SITE}/blog">Blog</a>
          <a href="${SITE}/blog/ai-kanban-board-guide-2026">AI kanban board guide</a>
          <a href="${SITE}/docs">Documentation</a>
          <a href="${SITE}/login">Sign in</a>
          <a href="${SITE}/contact">Contact</a>
        </nav>
        <p>
          <a href="https://smollaunch.com" target="_blank" rel="noopener">
            <img
              src="https://smollaunch.com/badges/featured.svg"
              alt="Kanban AI — Featured on Smol Launch"
              loading="lazy"
              width="250"
              height="60"
            />
          </a>
        </p>
      </main>`,
  },
  '/blog': {
    title: 'Kanban AI Blog — kanban software, AI task planning & productivity',
    description:
      'Guides and comparisons from the Kanban AI team: kanban tools, AI-assisted planning, sprint workflows, and productivity for builders and teams.',
    keywords:
      'kanban AI blog, AI kanban, kanban software, task management, productivity, sprint planning',
    type: 'website',
  },
  '/docs': {
    title: 'Documentation — Kanban AI boards, AI planning & developer setup',
    description:
      'Guides for guest mode, boards, AI chat, account & sharing, and running the open-source app locally.',
    keywords: 'Kanban AI docs, AI kanban guide, guest board, sprint planning',
    type: 'website',
  },
  '/login': {
    title: 'Sign in — Kanban AI | AI kanban board & cloud sync',
    description:
      'Sign in to Kanban AI to save your AI kanban boards, sync across devices, and keep sprints and tasks in one place.',
    keywords: 'Kanban AI login, sign in, cloud sync',
    type: 'website',
    bodyHtml: `<main><h1>Sign in to Kanban AI</h1><p>Save boards, sync across devices, and keep sprints in one place.</p></main>`,
  },
  '/contact': {
    title: 'Contact — Kanban AI',
    description:
      'Contact Kanban AI for enterprise sales, partnerships, and product questions.',
    keywords: 'Kanban AI contact, sales, partnerships',
    type: 'website',
    bodyHtml: `<main><h1>Contact Kanban AI</h1><p>Enterprise sales, partnerships, and product questions.</p></main>`,
  },
  '/privacy-policy': {
    title: 'Privacy Policy — Kanban AI | Data & AI kanban app',
    description:
      'How Kanban AI handles data for your AI kanban boards and account: what we collect, why we use it, and your choices.',
    keywords: 'Kanban AI privacy policy',
    type: 'website',
    bodyHtml: `<main><h1>Privacy Policy</h1><p>How Kanban AI handles data for your AI kanban boards and account.</p></main>`,
  },
  '/terms-of-service': {
    title: 'Terms of Service — Kanban AI | Using our AI kanban product',
    description:
      'Terms for using Kanban AI: acceptable use, accounts, the AI kanban service, and limitations of liability.',
    keywords: 'Kanban AI terms of service',
    type: 'website',
    bodyHtml: `<main><h1>Terms of Service</h1><p>Terms for using Kanban AI.</p></main>`,
  },
  '/waitlist': {
    title: 'Waitlist — Kanban AI',
    description: 'Join the Kanban AI waitlist for updates on AI kanban boards and task planning.',
    keywords: 'Kanban AI waitlist',
    type: 'website',
    bodyHtml: `<main><h1>Waitlist</h1><p>Join the Kanban AI waitlist.</p></main>`,
  },
  '/connect': {
    title: 'Connect AI — Kanban AI',
    description:
      'Set up Kanban AI with Claude Desktop, Cursor, and other MCP clients.',
    keywords: 'Kanban AI MCP, Claude, Cursor, connect AI',
    type: 'website',
    bodyHtml: `<main><h1>Connect AI</h1><p>Set up Kanban AI with Claude Desktop, Cursor, and other MCP clients.</p><p><a href="${SITE}/docs/connect-mcp-claude-cursor">Read the MCP setup guide</a></p></main>`,
  },
};

function pageMetaForRoute(route, blogPosts, docArticles) {
  if (STATIC_PAGE_META[route]) {
    const meta = { ...STATIC_PAGE_META[route], url: absoluteUrl(route) };
    if (route === '/blog') {
      const links = blogPosts
        .map(
          (p) =>
            `<li><a href="${SITE}/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a> — ${escapeHtml(p.excerpt)}</li>`
        )
        .join('\n');
      meta.bodyHtml = `
        <main>
          <h1>Blog</h1>
          <p>Explore kanban software comparisons, project management insights, and productivity tips.</p>
          <ul>${links}</ul>
        </main>`;
    }
    if (route === '/docs') {
      const links = docArticles
        .map(
          (d) =>
            `<li><a href="${SITE}/docs/${escapeHtml(d.id)}">${escapeHtml(d.title)}</a> — ${escapeHtml(d.excerpt)}</li>`
        )
        .join('\n');
      meta.bodyHtml = `
        <main>
          <h1>Documentation</h1>
          <p>Guides for guest mode, boards, AI chat, account &amp; sharing, and local development.</p>
          <ul>${links}</ul>
        </main>`;
    }
    return meta;
  }

  const blogMatch = /^\/blog\/([^/]+)$/.exec(route);
  if (blogMatch) {
    const post = blogPosts.find((p) => p.slug === blogMatch[1]);
    if (!post) return null;
    const publishedIso = new Date(`${post.date}T12:00:00.000Z`).toISOString();
    const related = blogPosts
      .filter((p) => p.slug !== post.slug)
      .map((p) => ({
        post: p,
        overlap: (p.tags || []).filter((t) => (post.tags || []).includes(t)).length,
      }))
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || String(b.post.date).localeCompare(String(a.post.date)))
      .slice(0, 3)
      .map((x) => x.post);
    const relatedHtml =
      related.length > 0
        ? `<section aria-labelledby="related-posts-heading"><h2 id="related-posts-heading">Related reading</h2><ul>${related
            .map(
              (r) =>
                `<li><a href="${SITE}/blog/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a> — ${escapeHtml(r.excerpt)}</li>`
            )
            .join('')}</ul></section>`
        : '';
    return {
      title: `${post.title} | Kanban AI Blog`,
      description: post.excerpt,
      keywords: [...(post.tags || []), 'Kanban AI', 'kanban AI'].join(', '),
      url: absoluteUrl(route),
      type: 'article',
      author: post.author,
      publishedTime: publishedIso,
      image: post.featuredImage || OG_IMAGE,
      faqs: Array.isArray(post.faqs) ? post.faqs : [],
      bodyHtml: `
        <article>
          <p><a href="${SITE}/blog">Back to Blog</a></p>
          <h1>${escapeHtml(post.title)}</h1>
          <p>${escapeHtml(post.excerpt)}</p>
          <p>By ${escapeHtml(post.author || 'Kanban AI')} · <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time></p>
          ${markdownToHtml(post.body || '')}
        </article>
        ${relatedHtml}`,
    };
  }

  const docMatch = /^\/docs\/([^/]+)$/.exec(route);
  if (docMatch) {
    const doc = docArticles.find((d) => d.id === docMatch[1]);
    if (!doc) return null;
    return {
      title: `${doc.title} | Kanban AI Docs`,
      description: doc.excerpt,
      keywords: 'Kanban AI docs, AI kanban, documentation',
      url: absoluteUrl(route),
      type: 'article',
      bodyHtml: `
        <article>
          <p><a href="${SITE}/docs">Back to Docs</a></p>
          <h1>${escapeHtml(doc.title)}</h1>
          <p>${escapeHtml(doc.excerpt)}</p>
        </article>`,
    };
  }

  return null;
}

function applyHead(html, meta) {
  let out = html;
  out = setTitle(out, meta.title);
  out = setMetaName(out, 'title', meta.title);
  out = setMetaName(out, 'description', meta.description);
  if (meta.keywords) out = setMetaName(out, 'keywords', meta.keywords);
  out = setMetaName(out, 'robots', 'index, follow');
  if (meta.author) out = setMetaName(out, 'author', meta.author);

  out = setMetaProperty(out, 'og:type', meta.type || 'website');
  out = setMetaProperty(out, 'og:url', meta.url);
  out = setMetaProperty(out, 'og:title', meta.title);
  out = setMetaProperty(out, 'og:description', meta.description);
  out = setMetaProperty(out, 'og:image', meta.image || OG_IMAGE);

  out = setMetaName(out, 'twitter:url', meta.url);
  out = setMetaName(out, 'twitter:title', meta.title);
  out = setMetaName(out, 'twitter:description', meta.description);
  out = setMetaName(out, 'twitter:image', meta.image || OG_IMAGE);

  out = setCanonical(out, meta.url);

  if (meta.type === 'article' && meta.publishedTime) {
    out = setMetaProperty(out, 'article:published_time', meta.publishedTime);
    out = setMetaProperty(out, 'article:modified_time', meta.publishedTime);
    if (meta.author) out = setMetaProperty(out, 'article:author', meta.author);
  }

  const pageLd = {
    '@type': meta.type === 'article' ? 'Article' : 'WebPage',
    name: meta.title,
    headline: meta.title,
    description: meta.description,
    url: meta.url,
    image: meta.image || OG_IMAGE,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Kanban AI',
      url: `${SITE}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kanban AI',
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/favicon.svg` },
    },
  };
  if (meta.type === 'article') {
    if (meta.author) pageLd.author = { '@type': 'Person', name: meta.author };
    if (meta.publishedTime) {
      pageLd.datePublished = meta.publishedTime;
      pageLd.dateModified = meta.publishedTime;
    }
  }

  const graph = [pageLd];
  if (meta.type === 'article' && meta.url) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: meta.title, item: meta.url },
      ],
    });
  }
  if (Array.isArray(meta.faqs) && meta.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: meta.faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
  }
  out = upsertPageJsonLd(out, {
    '@context': 'https://schema.org',
    '@graph': graph,
  });

  if (meta.bodyHtml) {
    out = injectRootContent(out, meta.bodyHtml);
  }
  return out;
}

function main() {
  if (process.env.SKIP_PRERENDER === '1') {
    console.log('[prerender] SKIP_PRERENDER=1 — skipping');
    return;
  }

  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`dist/index.html not found at ${templatePath}. Run vite build first.`);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const blogPosts = loadBlogPosts();
  const docArticles = loadDocArticles();
  const routes = collectPrerenderRoutes();

  console.log(`[prerender] Writing static HTML for ${routes.length} public routes…`);

  let written = 0;
  for (const route of routes) {
    const meta = pageMetaForRoute(route, blogPosts, docArticles);
    if (!meta) {
      console.warn(`[prerender] No meta for ${route} — skipping`);
      continue;
    }
    const html = applyHead(template, meta);
    const outFile = routeToOutputFile(route);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');
    written += 1;
    console.log(`[prerender] ${route} → ${path.relative(distDir, outFile)}`);
  }

  if (written === 0) {
    throw new Error('Prerender wrote 0 routes');
  }

  console.log(`[prerender] Done (${written} files).`);
}

try {
  main();
} catch (error) {
  console.error('[prerender] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
