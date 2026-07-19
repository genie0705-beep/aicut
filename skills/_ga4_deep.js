// GA4 — 전체 대시보드 데이터 상세 수집
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) {
    p.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  }
  
  const pages = ctx.pages();
  let ga4Page = null;
  for (const p of pages) {
    if (p.url().includes('analytics.google.com')) { ga4Page = p; break; }
  }
  
  if (!ga4Page) {
    console.log('GA4 탭 없음');
    await b.disconnect();
    return;
  }
  
  await ga4Page.bringToFront();
  await ga4Page.waitForTimeout(5000);
  
  // 전체 데이터 수집 with scroll
  console.log('GA4 데이터 수집 중...');
  
  // 스크롤 다운 후 다시 수집
  await ga4Page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await ga4Page.waitForTimeout(2000);
  await ga4Page.evaluate(() => window.scrollTo(0, 0));
  await ga4Page.waitForTimeout(2000);
  
  const allData = await ga4Page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => l.trim());
    return { totalText: text.slice(0, 8000), lines: lines.slice(0, 200) };
  });
  
  console.log('=== GA4 전체 텍스트 ===');
  allData.lines.forEach((l, i) => {
    if (l.trim().length > 2) console.log((i+1) + ': ' + l);
  });
  
  await ga4Page.screenshot({ path: 'debug_ga4_full.png', fullPage: true });
  console.log('\n✅ 스크린샷 저장');
  
  await b.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });