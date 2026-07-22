import fs from 'fs';
import puppeteer, { type Browser } from 'puppeteer-core';

/**
 * Resolve a Chromium/Chrome binary for local HTML→PDF rendering.
 * Prefer explicit env overrides for Railway / Docker.
 */
export function resolveChromeExecutable(): string | undefined {
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.CHROMIUM_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/local/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const path of candidates) {
    if (fs.existsSync(path)) return path;
  }
  return undefined;
}

/**
 * Render consulting-report HTML to a PDF buffer locally.
 * Uses Puppeteer + system Chrome/Chromium — more reliable on Railway than Playwright browsers.
 * Completely replaces Abacus HTML2PDF (no createConvertHtmlToPdfRequest / getConvertHtmlToPdfStatus).
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  let browser: Browser | null = null;
  try {
    const executablePath = resolveChromeExecutable();
    if (!executablePath) {
      throw new Error(
        'No Chrome/Chromium binary found. Set PUPPETEER_EXECUTABLE_PATH (or CHROME_PATH) for Railway/Docker.'
      );
    }
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--hide-scrollbars',
      ],
    });
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 60_000,
    });
    await new Promise((r) => setTimeout(r, 250));
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:7.5px;color:#94a3b8;width:100%;padding:0 14mm;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
        <span>Mining Economics Dashboard — Confidential</span>
      </div>`,
      footerTemplate: `<div style="font-size:7.5px;color:#94a3b8;width:100%;padding:0 14mm;font-family:Segoe UI,Helvetica,Arial,sans-serif;display:flex;justify-content:space-between;">
        <span>Economic Evaluation Report</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
    });
    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
