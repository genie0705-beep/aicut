const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://searchadvisor.naver.com/console/board', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // 'https://aicut.co.kr' 링크 클릭
  await page.evaluate(() => {
    const items = document.querySelectorAll('a, span, div');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === 'https://aicut.co.kr' && el.offsetParent !== null) {
        el.click();
        return;
      }
    }
  });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('사이트 대시보드 URL:', url.substring(0, 150));
  
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
  console.log('\\n=== 대시보드 ===');
  console.log(text);
  
  // '요청' 탭 찾아서 클릭
  const tabs = ['요청', '수집요청', '수집 요청'];
  for (const tab of tabs) {
    const clicked = await page.evaluate((t) => {
      const items = document.querySelectorAll('a, [role=tab], span, div, button');
      for (const el of items) {
        if ((el.innerText || '').trim() === t && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    }, tab);
    if (clicked) {
      console.log(tab + ' 탭 클릭!');
      break;
    }
  }
  
  await page.waitForTimeout(3000);
  
  const text2 = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
  console.log('\\n=== 요청 페이지 ===');
  console.log(text2);
  
  // 수집 요청 버튼 클릭
  const btnResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, span, [role=button]');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t.includes('수집 요청') && btn.offsetParent !== null) {
        btn.click();
        return 'clicked: ' + t;
      }
    }
    return 'not found';
  });
  console.log('\\n수집 요청 버튼:', btnResult);
  
  await page.waitForTimeout(3000);
  const text3 = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
  console.log('\\n=== 결과 ===');
  console.log(text3);
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
