const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // '에이컷' 또는 웹마스터 도구 클릭
  await page.evaluate(() => {
    const items = document.querySelectorAll('a, button, span, div');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if ((t.includes('에이컷') || t === '웹마스터 도구 사용하기') && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('URL:', url.substring(0, 150));
  
  // 요청 탭으로 이동
  const tabs = ['요청', '수집 요청', '수집'];
  for (const tab of tabs) {
    const clicked = await page.evaluate((t) => {
      const items = document.querySelectorAll('a, button, span, div, [role=tab]');
      for (const el of items) {
        if ((el.innerText || '').trim() === t && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    }, tab);
    if (clicked) {
      console.log(tab + ' 클릭됨');
      break;
    }
  }
  
  await page.waitForTimeout(3000);
  
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
  console.log('\\n=== 페이지 내용 ===');
  console.log(text);
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
