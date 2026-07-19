const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 웹마스터 도구로 직접 이동
  await page.goto('https://webmaster.naver.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('웹마스터 URL:', url.substring(0, 150));
  
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
  console.log('\\n=== 페이지 내용 ===');
  console.log(text);
  
  // aicut.co.kr 사이트가 있는지 확인
  const hasAicut = text.includes('aicut') || text.includes('에이컷');
  console.log('\\naicut.co.kr 등록됨:', hasAicut);
  
  if (hasAicut) {
    // '요청' 탭 찾기
    await page.evaluate(() => {
      const items = document.querySelectorAll('a, button, span, [role=tab]');
      for (const el of items) {
        const t = (el.innerText || '').trim();
        if ((t === '요청' || t.includes('수집 요청')) && el.offsetParent !== null) {
          el.click();
          return;
        }
      }
    });
    await page.waitForTimeout(3000);
    
    const text2 = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
    console.log('\\n=== 요청 페이지 ===');
    console.log(text2);
    
    // 수집 요청 버튼 찾기
    const btnResult = await page.evaluate(() => {
      const items = document.querySelectorAll('a, button, span, [role=button]');
      for (const el of items) {
        const t = (el.innerText || '').trim();
        if ((t.includes('수집 요청') || t.includes('요청')) && el.offsetParent !== null && !t.includes('웹마스터')) {
          el.click();
          return 'clicked: ' + t;
        }
      }
      return 'no button';
    });
    console.log('\\n수집 요청 버튼:', btnResult);
    
    await page.waitForTimeout(3000);
    const text3 = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
    console.log('\\n=== 결과 ===');
    console.log(text3);
  }
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
