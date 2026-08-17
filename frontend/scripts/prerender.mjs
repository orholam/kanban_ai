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
  let inList = null; // 'ul' | 'ol' | null
  let para = [];

  const flushPara = () => {
    if (para.length === 0) return;
    const text = para.join(' ').trim();
    if (text) out.push(`<p>${inlineFormat(text)}</p>`);
    para = [];
  };

  const flushList = () => {
    if (!inList) return;
    out.push(inList === 'ol' ? '</ol>' : '</ul>');
    inList = null;
  };

  const openList = (kind) => {
    if (inList === kind) return;
    flushList();
    out.push(kind === 'ol' ? '<ol>' : '<ul>');
    inList = kind;
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

    if (/^>\s?/.test(line)) {
      flushPara();
      flushList();
      out.push(`<blockquote><p>${inlineFormat(line.replace(/^>\s?/, ''))}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara();
      openList('ul');
      out.push(`<li>${inlineFormat(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      openList('ol');
      out.push(`<li>${inlineFormat(line.replace(/^\d+\.\s+/, ''))}</li>`);
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

function extractExportedTemplateLiterals(source) {
  const result = {};
  const prefixRe = /export const (\w+) = `/g;
  let match;
  while ((match = prefixRe.exec(source))) {
    const name = match[1];
    let i = match.index + match[0].length;
    let out = '';
    while (i < source.length) {
      const ch = source[i];
      if (ch === '\\' && i + 1 < source.length) {
        out += source[i + 1];
        i += 2;
        continue;
      }
      if (ch === '`') break;
      out += ch;
      i += 1;
    }
    result[name] = out;
  }
  return result;
}

function loadDocBodies() {
  const bodiesPath = path.join(
    frontendRoot,
    'src/documentation-board-feature/documentationBodies.ts'
  );
  return extractExportedTemplateLiterals(fs.readFileSync(bodiesPath, 'utf8'));
}

function loadDocArticles() {
  const articlesPath = path.join(
    frontendRoot,
    'src/documentation-board-feature/documentationArticles.ts'
  );
  const source = fs.readFileSync(articlesPath, 'utf8');
  const bodies = loadDocBodies();
  const articles = [];
  const blockRe =
    /\{\s*id:\s*'([^']+)'[\s\S]*?title:\s*'((?:\\'|[^'])*)'[\s\S]*?excerpt:\s*'((?:\\'|[^'])*)'[\s\S]*?body:\s*bodies\.(\w+)/g;
  let match;
  while ((match = blockRe.exec(source))) {
    const bodyName = match[4];
    const body = bodies[bodyName];
    if (!body) {
      throw new Error(`No markdown body "${bodyName}" for docs article "${match[1]}"`);
    }
    articles.push({
      id: match[1],
      title: match[2].replace(/\\'/g, "'"),
      excerpt: match[3].replace(/\\'/g, "'"),
      body,
    });
  }
  return articles;
}

function visibleWordCount(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Content routes that must not ship as stubs (AdSense low-quality failure mode). */
const MIN_BODY_WORDS = {
  '/': 250,
  '/contact': 80,
  '/privacy-policy': 200,
  '/terms-of-service': 200,
  '/docs': 80,
};

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
        <p>AI-powered kanban boards and task planning for builders and small teams. Plan a side project with an AI-assisted brief, run work on a classic board, and optionally drive the same board from Cursor or Claude via MCP.</p>
        <p><a href="${SITE}/login">Get started</a> — try a free guest board with no signup, or sign in to sync across devices.</p>
        <nav>
          <a href="${SITE}/blog">Blog</a>
          <a href="${SITE}/blog/ai-kanban-board-guide-2026">AI kanban board guide</a>
          <a href="${SITE}/docs">Documentation</a>
          <a href="${SITE}/docs/connect-mcp-claude-cursor">Connect Claude &amp; Cursor (MCP)</a>
          <a href="${SITE}/login">Sign in</a>
          <a href="${SITE}/contact">Contact</a>
          <a href="${SITE}/privacy-policy">Privacy Policy</a>
          <a href="${SITE}/terms-of-service">Terms of Service</a>
        </nav>
        <h2>What Kanban AI is</h2>
        <p>Kanban AI is a web app for planning and shipping side projects. You get kanban columns and cards, sprints, comments, and an AI sidebar that can suggest task breakdowns and next steps in the context of the active project. Guest mode stores a board in the browser so you can try the product before creating an account. Signed-in mode syncs projects through the hosted backend.</p>
        <h2>What makes it different</h2>
        <h3>Smart Sprint Planning</h3>
        <p>Drop your idea, preferred tech stack, and skills you want to showcase. The AI project builder drafts a multi-week plan toward an MVP and fills a live workspace with phases and starter tasks before you create the board.</p>
        <h3>Dynamic Weekly Task Management</h3>
        <p>The board is the source of truth. Move cards as work progresses; use sprints to focus a slice of the backlog. When you ask the assistant for help, it can recalibrate suggestions from the tasks that are actually on the board—not a generic template.</p>
        <h3>Interactive AI Assistance</h3>
        <p>Create tasks with AI assistance, ask follow-up questions, and let the sidebar propose breakdowns or comments. The model is scoped to the project you have open. See <a href="${SITE}/docs/ai-sidebar-and-task-chat">AI sidebar &amp; task chat</a> for what it can and cannot do.</p>
        <h3>Invite Teammates</h3>
        <p>Add editors by email on shared projects—they see the board in their sidebar and can edit tasks and comments. Public links stay read-only for visitors. Details: <a href="${SITE}/docs/invite-project-members">Invite project members</a>.</p>
        <h3>MCP for AI Clients</h3>
        <p>Connect Claude, Cursor, and other MCP-compatible tools to your boards—list projects, manage tasks, and read sprint context from your editor. Setup walkthrough: <a href="${SITE}/docs/connect-mcp-claude-cursor">Connect Claude &amp; Cursor</a>.</p>
        <h2>Pricing</h2>
        <p>Hobby is free for personal side projects (one active project, basic AI task creation, weekly sprint planning). Pro is listed at $6/month for unlimited projects, advanced AI assistance, MCP server access, and priority support (promotional pricing may apply). Enterprise is custom—<a href="${SITE}/contact">contact sales</a> for team scale, security, and deployment questions.</p>
        <h2>How to start</h2>
        <ol>
          <li>Open the guest board or <a href="${SITE}/login">sign in</a>.</li>
          <li>Create a blank board, or use the AI project builder to draft a roadmap first.</li>
          <li>Move tasks through columns; use the AI sidebar when you need a breakdown or next step.</li>
          <li>Optionally connect Cursor or Claude from <a href="${SITE}/connect">Connect AI</a>.</li>
        </ol>
        <p>Full product guides live in <a href="${SITE}/docs">documentation</a>. Comparisons, buyer checklists, and MCP write-ups live on the <a href="${SITE}/blog">blog</a>.</p>
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
    bodyHtml: `<main><h1>Sign in to Kanban AI</h1>
      <p>Save boards, sync across devices, and keep sprints and tasks in one place. Guest boards stay in this browser until you sign in or clear site data.</p>
      <p>After you sign in you can invite project members, open Connect AI for Cursor and Claude, and return to the same projects from another device.</p>
      <p>New here? Start from the <a href="${SITE}/">homepage</a> or read <a href="${SITE}/docs/guest-board-vs-account">guest board vs signed-in account</a>.</p>
    </main>`,
  },
  '/contact': {
    title: 'Contact — Kanban AI',
    description:
      'Contact Kanban AI for enterprise sales, partnerships, and product questions.',
    keywords: 'Kanban AI contact, sales, partnerships',
    type: 'website',
    bodyHtml: `<main>
      <h1>Contact Kanban AI</h1>
      <p>Enterprise plans, partnerships, or a product question — send a note from this page and we will reply by email. Product bugs and feature ideas from signed-in users can also go through in-app Feedback.</p>
      <h2>What to write about</h2>
      <ul>
        <li><strong>Enterprise / sales</strong> — team size, timeline, security or deployment questions. Enterprise inquiries usually get a reply within one business day.</li>
        <li><strong>Partnership</strong> — integrations, content, or distribution ideas.</li>
        <li><strong>Product support</strong> — something broken or confusing in the hosted app. Include the project name and what you expected to happen.</li>
        <li><strong>Something else</strong> — press, billing, or a question that does not fit the topics above.</li>
      </ul>
      <p>Messages from this form land in the same inbox as in-app feedback. For how-to detail, start with <a href="${SITE}/docs">documentation</a> or the <a href="${SITE}/docs/faq-and-troubleshooting">FAQ</a>.</p>
      <p>Privacy questions: <a href="${SITE}/privacy-policy">Privacy Policy</a>. Legal questions: <a href="${SITE}/terms-of-service">Terms of Service</a>.</p>
      <p>The form fields (name, work email, optional company, topic, and message) are in the live page after JavaScript loads. If you prefer email, use the addresses listed on the privacy and terms pages.</p>
    </main>`,
  },
  '/privacy-policy': {
    title: 'Privacy Policy — Kanban AI | Data & AI kanban app',
    description:
      'How Kanban AI handles data for your AI kanban boards and account: what we collect, why we use it, and your choices.',
    keywords: 'Kanban AI privacy policy',
    type: 'website',
    bodyHtml: `<main>
      <h1>Privacy Policy</h1>
      <p>Last updated: July 28, 2026</p>
      <h2>Introduction</h2>
      <p>Kanban AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered project management platform.</p>
      <h2>Information We Collect</h2>
      <h3>Personal Information</h3>
      <ul>
        <li>Name and email address when you create an account</li>
        <li>Profile information and preferences</li>
        <li>Project data and task information</li>
        <li>Usage data and analytics</li>
      </ul>
      <h3>Technical Information</h3>
      <ul>
        <li>IP address and device information</li>
        <li>Browser type and version</li>
        <li>Operating system</li>
        <li>Usage patterns and interactions</li>
      </ul>
      <h2>How We Use Your Information</h2>
      <ul>
        <li>Provide and maintain our services</li>
        <li>Personalize your experience and AI recommendations</li>
        <li>Improve our platform and develop new features</li>
        <li>Communicate with you about updates and changes</li>
        <li>Ensure security and prevent fraud</li>
      </ul>
      <h2>Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
      <h2>Advertising</h2>
      <p>We display ads on Kanban AI through advertising partners including Google AdSense and Apitiny. These partners may use cookies or similar technologies to serve ads and measure performance based on your visits to this site or other sites. You can learn more about how Google uses data when you use our site, and manage ad personalization, at <a href="https://policies.google.com/technologies/partner-sites">Google's Partner Sites Policy</a>.</p>
      <h2>Data Sharing</h2>
      <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law. Advertising partners such as Google and Apitiny may receive technical information (for example, cookies and device data) as described under Advertising above.</p>
      <h2>Your Rights</h2>
      <p>You have the right to access your personal information, correct inaccurate data, request deletion of your data, object to processing of your data, and request data portability.</p>
      <h2>Contact Us</h2>
      <p>If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@kanbanai.dev. Related pages: <a href="${SITE}/terms-of-service">Terms of Service</a> and <a href="${SITE}/contact">Contact</a>.</p>
    </main>`,
  },
  '/terms-of-service': {
    title: 'Terms of Service — Kanban AI | Using our AI kanban product',
    description:
      'Terms for using Kanban AI: acceptable use, accounts, the AI kanban service, and limitations of liability.',
    keywords: 'Kanban AI terms of service',
    type: 'website',
    bodyHtml: `<main>
      <h1>Terms of Service</h1>
      <p>Last updated: January 15, 2024</p>
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using Kanban AI ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
      <h2>2. Description of Service</h2>
      <p>Kanban AI is an AI-powered project management platform that helps users plan, track, and complete their side projects. The service includes:</p>
      <ul>
        <li>AI-powered project planning and task generation</li>
        <li>Kanban board management and task tracking</li>
        <li>Progress analytics and insights</li>
        <li>Personalized AI recommendations</li>
        <li>Collaboration features</li>
      </ul>
      <h2>3. User Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.</p>
      <h2>4. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Violate any applicable laws or regulations</li>
        <li>Infringe upon the rights of others</li>
        <li>Upload or transmit malicious code or content</li>
        <li>Attempt to gain unauthorized access to the Service</li>
        <li>Use the Service for commercial purposes without permission</li>
      </ul>
      <h2>5. Intellectual Property</h2>
      <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Kanban AI and its licensors. The Service is protected by copyright, trademark, and other laws.</p>
      <h2>6. Privacy Policy</h2>
      <p>Your privacy is important to us. Please review our <a href="${SITE}/privacy-policy">Privacy Policy</a>, which also governs your use of the Service, to understand our practices.</p>
      <h2>7. Limitation of Liability</h2>
      <p>In no event shall Kanban AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
      <h2>8. Termination</h2>
      <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
      <h2>9. Changes to Terms</h2>
      <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.</p>
      <h2>10. Contact Information</h2>
      <p>If you have any questions about these Terms of Service, please contact us at legal@kanbanai.dev. You can also use the <a href="${SITE}/contact">contact form</a>.</p>
    </main>`,
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
    bodyHtml: `<main>
      <h1>Connect AI</h1>
      <p>Set up Kanban AI with Claude Desktop, Cursor, and other MCP clients so an assistant can list projects, create and update tasks, and read sprint context without leaving your editor.</p>
      <h2>Fastest path</h2>
      <ol>
        <li>Sign in at Kanban AI.</li>
        <li>Open Connect AI from the sidebar (this page, when you are signed in).</li>
        <li>Choose Cursor or Claude Desktop.</li>
        <li>Click Copy config — a long-lived personal MCP key and headers are filled in for you.</li>
        <li>Paste into your client’s MCP settings and restart the client.</li>
      </ol>
      <p>The MCP endpoint is <code>https://kanbanai.dev/api/mcp</code>. Authentication uses a personal MCP key (<code>kai_…</code>) that does not expire until you rotate it.</p>
      <p>Full walkthrough, tools list, example prompts, and troubleshooting: <a href="${SITE}/docs/connect-mcp-claude-cursor">Connect Claude &amp; Cursor (MCP)</a>.</p>
      <p>If you are not signed in, <a href="${SITE}/login">sign in</a> first. Guest mode does not issue MCP keys.</p>
    </main>`,
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
      author: 'Kanban AI',
      section: 'Documentation',
      bodyHtml: `
        <article>
          <p><a href="${SITE}/docs">Back to Docs</a></p>
          <h1>${escapeHtml(doc.title)}</h1>
          <p>${escapeHtml(doc.excerpt)}</p>
          ${markdownToHtml(doc.body || '')}
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
    const isDocs = meta.url.includes('/docs/');
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: isDocs ? 'Docs' : 'Blog',
          item: isDocs ? `${SITE}/docs` : `${SITE}/blog`,
        },
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

function assertBodyDepth(route, meta) {
  const words = visibleWordCount(meta.bodyHtml || '');
  let min = MIN_BODY_WORDS[route];
  if (!min && /^\/docs\/[^/]+$/.test(route)) min = 80;
  if (!min) return;
  if (words < min) {
    throw new Error(
      `Prerender body for ${route} is too thin (${words} words, need ≥ ${min}). ` +
        'Crawlers and AdSense reviewers see this HTML, not the React tree.'
    );
  }
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
    assertBodyDepth(route, meta);
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
