const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let gaPage = null;
  for (const p of pages) {
    if (p.url().includes('analytics.google.com')) {
      gaPage = p;
      break;
    }
  }
  
  if (!gaPage) {
    console.log('GA 페이지 없음');
    process.exit(1);
  }
  
  // 이벤트 보고서로 이동
  await gaPage.evaluate(() => {
    const items = document.querySelectorAll('span, a, div');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '보고서' && el.offsetParent !== null) {
        el.click(); return;
      }
    }
  });
  await gaPage.waitForTimeout(1500);
  
  await gaPage.evaluate(() => {
    const items = document.querySelectorAll('span, a, div');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '이벤트' && el.offsetParent !== null) {
        el.click(); return;
      }
    }
  });
  await gaPage.waitForTimeout(5000);
  
  // 전환 페이지로 이동
  await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/reports/conversions', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await gaPage.waitForTimeout(3000);
  
  // 홈으로 가서 전체 현황
  await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/reports/intelligenthome', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await gaPage.waitForTimeout(3000);
  
  const data = await gaPage.evaluate(() => {
    const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
    return root?.innerText?.substring(0, 5000) || 'no data';
  }).catch(e => 'Error: ' + e.message);
  
  console.log(data);
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
