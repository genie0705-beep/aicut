const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // /console/board로 이동 (웹마스터 도구)
  await page.goto('https://searchadvisor.naver.com/console/board', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('board URL:', url.substring(0, 150));
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
  console.log('\\n=== 내용 ===');
  console.log(text);
  
  // 사이드 메뉴에서 사이트 관리 찾기
  const menuItems = await page.evaluate(() => {
    const items = document.querySelectorAll('a, [role=button], button, span, div');
    const result = [];
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if ((t.includes('사이트') || t.includes('수집') || t.includes('요청') || t.includes('최적화') || t.includes('진단')) && t.length < 20) {
        const href = el.getAttribute('href') || el.closest('a')?.getAttribute('href') || '';
        result.push({ text: t.substring(0, 30), href: href.substring(0, 80) });
      }
    }
    return result.slice(0, 10);
  });
  console.log('\\n메뉴 항목:', JSON.stringify(menuItems, null, 2));
  
  // 사이드바 메뉴에서 '사이트 관리' 또는 유사 항목 클릭
  for (const label of ['사이트 관리', '사이트', '관리', '사이트소개', '진단']) {
    const clicked = await page.evaluate((lbl) => {
      const items = document.querySelectorAll('a, span, div, [role=button]');
      for (const el of items) {
        const t = (el.innerText || '').trim();
        if (t === lbl && el.offsetParent !== null) {
          el.click();
          return 'clicked: ' + lbl;
        }
      }
      return '';
    }, label);
    if (clicked) {
      console.log('클릭:', clicked);
      break;
    }
  }
  
  await page.waitForTimeout(3000);
  
  const text2 = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
  console.log('\\n=== 이동 후 ===');
  console.log(text2);
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
