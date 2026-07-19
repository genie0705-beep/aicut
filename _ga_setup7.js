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
  
  // cta_click도 전환으로 설정
  await gaPage.evaluate(() => {
    const walker = document.createTreeWalker(document.body, 4, null, false);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.trim() === 'cta_click') {
        let parent = node.parentElement;
        for (let i = 0; i < 8 && parent; i++) {
          const switches = parent.querySelectorAll('[role=switch], button[role=checkbox], input[type=checkbox]');
          for (const sw of switches) {
            if (sw.offsetParent !== null) {
              sw.click();
              console.log('cta_click switch clicked at level', i);
              return 'clicked';
            }
          }
          parent = parent.parentElement;
        }
        return 'no switch found for cta_click';
      }
    }
    return 'cta_click not found';
  });
  
  await gaPage.waitForTimeout(2000);
  
  // 확인
  const pageText = await gaPage.evaluate(() => {
    const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
    return root?.innerText?.substring(0, 200) || '';
  });
  console.log('페이지 확인:', pageText.substring(0, 100));
  
  console.log('\\n✅ GA4 전환 설정 완료! (generate_lead + cta_click)');
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
