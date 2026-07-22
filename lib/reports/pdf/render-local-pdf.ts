import fs from 'fs';
import puppeteer, { type Browser } from 'puppeteer-core';

/**
 * Resolve a Chromium/Chrome binary for local HTML→PDF rendering.
 * Railway/Docker: system Chromium (nixpacks apt package / image install).
 * Local/dev: env override or installed Google Chrome / Chromium.
 *
 * Do NOT use @sparticuz/chromium here — that binary targets AWS Lambda
 * and fails on Railway with missing shared libs (e.g. libnspr4.so).
 */
export function resolveChromeExecutable(): string | undefined {
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.CHROMIUM_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const candidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/local/bin/google-chrome',
  ];
  for (const path of candidates) {
    if (fs.existsSync(path)) return path;
  }
  return undefined;
}

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--font-render-hinting=none',
  '--hide-scrollbars',
];

/**
 * Render consulting-report HTML to a PDF buffer locally.
 * Uses Puppeteer + system Chrome/Chromium (Railway-compatible).
 * Completely replaces Abacus HTML2PDF (no createConvertHtmlToPdfRequest / getConvertHtmlToPdfStatus).
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  let browser: Browser | null = null;
  try {
    const executablePath = resolveChromeExecutable();
    if (!executablePath) {
      throw new Error(
        'No Chrome/Chromium binary found. On Railway, ensure Chromium is installed via nixpacks.toml (aptPkgs). Locally, install Chrome or set PUPPETEER_EXECUTABLE_PATH.'
      );
    }
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: LAUNCH_ARGS,
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
