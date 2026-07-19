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
  
  await gaPage.bringToFront();
  
  // 1. 이벤트 보고서
  await gaPage.evaluate(() => {
    const items = document.querySelectorAll('span, a, div');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '보고서' && el.offsetParent !== null) { el.click(); return; }
    }
  });
  await gaPage.waitForTimeout(1500);
  
  await gaPage.evaluate(() => {
    const items = document.querySelectorAll('span, a, div');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '이벤트' && el.offsetParent !== null) { el.click(); return; }
    }
  });
  await gaPage.waitForTimeout(5000);
  
  const eventData = await gaPage.evaluate(() => {
    const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
    return root?.innerText?.substring(0, 4000) || '';
  });
  
  console.log('=== 이벤트 보고서 ===');
  console.log(eventData);
  
  // 2. 전환 확인 - 좌측 메뉴에서 '전환' 찾기
  await gaPage.evaluate(() => {
    const items = document.querySelectorAll('span, a, div');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '전환' && el.offsetParent !== null) { el.click(); return; }
    }
  });
  await gaPage.waitForTimeout(4000);
  
  const convData = await gaPage.evaluate(() => {
    const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
    return root?.innerText?.substring(0, 2000) || '';
  });
  
  console.log('\\n=== 전환 보고서 ===');
  console.log(convData);
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
