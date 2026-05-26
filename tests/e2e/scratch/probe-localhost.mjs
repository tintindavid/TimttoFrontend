import { chromium } from 'playwright';

const TARGETS = [
  { label: 'Frontend (Vite)',   url: 'http://localhost:5173' },
  { label: 'Backend (health)',  url: 'http://localhost:3000/api/v1/health' },
];

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

const results = [];
for (const t of TARGETS) {
  let status = 'DOWN';
  let title = '';
  let body = '';
  try {
    const resp = await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 7000 });
    status = resp ? `HTTP ${resp.status()}` : 'no response';
    title = await page.title().catch(() => '');
    body = (await page.locator('body').innerText().catch(() => '')).slice(0, 200);
  } catch (err) {
    status = `DOWN — ${err.message.split('\n')[0]}`;
  }
  results.push({ ...t, status, title, body });
  console.log(`\n[${t.label}] ${t.url}\n  → ${status}\n  title: ${title}\n  body : ${body.replace(/\s+/g, ' ').trim()}`);
}

console.log('\n\nKeeping browser open for 20 s so you can inspect — close it or wait…');
await page.waitForTimeout(20_000);
await browser.close();

const downCount = results.filter(r => !r.status.startsWith('HTTP 2')).length;
process.exit(downCount === 0 ? 0 : 1);
