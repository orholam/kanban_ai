/**
 * Post-build prerender for public marketing routes.
 * Serves `dist/` via `vite preview`, snapshots each route with Puppeteer,
 * and writes route-specific index.html files for crawlers.
 *
 * Set SKIP_PRERENDER=1 to skip. On failure, logs a warning and exits 0 so deploys still succeed.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { collectPrerenderRoutes } from './collect-prerender-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const distDir = path.join(frontendRoot, 'dist');
const previewPort = Number(process.env.PRERENDER_PORT ?? 4173);
const previewHost = process.env.PRERENDER_HOST ?? '127.0.0.1';
const previewOrigin = `http://${previewHost}:${previewPort}`;

function routeToOutputFile(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  const segments = route.replace(/^\//, '').replace(/\/$/, '');
  return path.join(distDir, segments, 'index.html');
}

async function waitForPreview(url, timeoutMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // preview still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

function startPreview() {
  return spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--host', previewHost, '--port', String(previewPort), '--strictPort'],
    {
      cwd: frontendRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
    }
  );
}

async function waitForRenderedContent(page) {
  await page.waitForSelector('#root', { timeout: 20_000 });
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      if (!root) return false;
      const text = (root.textContent ?? '').replace(/\s+/g, ' ').trim();
      return text.length > 200;
    },
    { timeout: 45_000 }
  );
  // Lazy routes + markdown render
  await new Promise((resolve) => setTimeout(resolve, 750));
}

async function prerenderRoute(browser, route) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${previewOrigin}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await waitForRenderedContent(page);

    const html = await page.content();
    const outFile = routeToOutputFile(route);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');
    console.log(`[prerender] ${route} → ${path.relative(distDir, outFile)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  if (process.env.SKIP_PRERENDER === '1') {
    console.log('[prerender] SKIP_PRERENDER=1 — skipping');
    return;
  }

  if (!fs.existsSync(distDir)) {
    throw new Error(`dist/ not found at ${distDir}. Run vite build first.`);
  }

  const routes = collectPrerenderRoutes();
  console.log(`[prerender] Rendering ${routes.length} public routes…`);

  const preview = startPreview();
  let browser;

  const stopPreview = () => {
    if (!preview.killed) preview.kill('SIGTERM');
  };

  preview.stderr?.on('data', (chunk) => {
    const text = String(chunk);
    if (text.toLowerCase().includes('error')) {
      console.warn('[prerender] preview:', text.trim());
    }
  });

  try {
    await waitForPreview(`${previewOrigin}/`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    for (const route of routes) {
      await prerenderRoute(browser, route);
    }

    console.log('[prerender] Done.');
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopPreview();
  }
}

main().catch((error) => {
  console.warn('[prerender] Failed (deploy will continue):', error instanceof Error ? error.message : error);
  process.exit(0);
});
