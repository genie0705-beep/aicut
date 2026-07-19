const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://searchadvisor.naver.com/console/site/summary?site=https%3A%2F%2Faicut.co.kr', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // '요청' 메뉴 클릭 (expand_more 아이콘 옆)
  await page.evaluate(() => {
    const items = document.querySelectorAll('a, span, div, [role=button]');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if (t === '요청') {
        // 부모나 형제에 expand_more 아이콘이 있는지 확인
        const parent = el.parentElement;
        const hasExpandIcon = parent?.querySelector('[class*=expand]') || parent?.innerHTML?.includes('expand_more');
        if (hasExpandIcon || parent?.tagName === 'DIV') {
          el.click();
          return 'clicked: 요청 (expandable)';
        }
      }
    }
    // expand_more 아이콘 직접 클릭
    const icons = document.querySelectorAll('[class*=expand], i, span');
    for (const icon of icons) {
      if ((icon.innerText || '').trim() === 'expand_more' && icon.offsetParent !== null) {
        icon.click();
        return 'clicked: expand_more icon';
      }
    }
    return 'not found';
  });
  
  await page.waitForTimeout(2000);
  
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
  console.log('=== 요청 펼치기 후 ===');
  console.log(text);
  
  // '수집 요청' 서브메뉴 찾기
  const subClicked = await page.evaluate(() => {
    const items = document.querySelectorAll('a, span, div, [role=button]');
    for (const el of items) {
      const t = (el.innerText || '').trim();
      if ((t === '수집 요청' || t === '수집요청') && el.offsetParent !== null) {
        el.click();
        return 'clicked: ' + t;
      }
    }
    return 'not found';
  });
  console.log('\\n수집 요청 서브메뉴:', subClicked);
  
  await page.waitForTimeout(3000);
  
  const text2 = await page.evaluate(() => document.body?.innerText?.substring(0, 1500) || '');
  console.log('\\n=== 수집 요청 페이지 ===');
  console.log(text2);
  
  // 수집 요청 버튼
  const btnResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, [role=button], span');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if ((t === '요청' || t.includes('수집 요청')) && btn.offsetParent !== null && t.length < 15) {
        btn.click();
        return 'clicked: ' + t;
      }
    }
    return 'no button';
  });
  console.log('\\n버튼:', btnResult);
  
  await page.waitForTimeout(3000);
  
  const text3 = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
  console.log('\\n=== 최종 ===');
  console.log(text3);
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
