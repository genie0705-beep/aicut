const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  await page.goto(
    'https://analytics.google.com/analytics/web/#/a227543683p538910436/admin/streams/table/',
    { waitUntil: 'domcontentloaded', timeout: 20000 }
  );
  await sleep(3000);

  // 에이컷 스트림 행 클릭
  const clicked = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr, [role="row"], .stream-row'));
    const row = rows.find(r => r.innerText?.includes('aicut.co.kr'));
    if (row) { row.click(); return true; }
    // 폴백: aicut 텍스트 포함 클릭 가능한 요소
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find(e => e.innerText?.trim() === '에이컷' || e.innerText?.includes('aicut.co.kr'));
    if (el) { el.click(); return true; }
    return false;
  });
  console.log('스트림 클릭:', clicked);
  await sleep(3000);

  // G- 측정 ID 찾기
  const text = await page.evaluate(() => document.body.innerText);
  const match = text.match(/G-[A-Z0-9]{8,12}/);
  if (match) {
    console.log('\n✅ 측정 ID:', match[0]);
  } else {
    console.log('\n측정 ID 못 찾음. 관련 텍스트:');
    const lines = text.split('\n').filter(l => l.includes('G-') || l.includes('측정') || l.includes('ID'));
    lines.slice(0, 10).forEach(l => console.log(' ', l.trim()));
  }

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
