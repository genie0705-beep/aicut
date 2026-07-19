const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(2000);

  // 사이드바 "요청" 메뉴 찾아서 클릭 (expand_more 아이콘 또는 텍스트)
  // 1) "요청" 텍스트가 포함된 버튼 또는 링크 찾기
  const requestBtn = await saPage.$('text=요청');
  if (requestBtn) {
    console.log('"요청" 버튼 발견');
    const parent = await requestBtn.evaluate(el => el.parentElement?.innerText);
    console.log('부모 텍스트:', parent);
    
    // expand_more 아이콘이 sibling으로 있을 것
    await requestBtn.click();
    await saPage.waitForTimeout(2000);
    
    const text = await saPage.evaluate(() => document.body.innerText);
    console.log('=== 클릭 후 ===');
    console.log(text.substring(0, 3000));
  } else {
    console.log('"요청" 버튼 못 찾음');
  }

  // 2) 모든 버튼/링크에서 "요청" 포함된 것 찾기
  const allRequestElements = await saPage.evaluate(() => {
    const results = [];
    document.querySelectorAll('a, button, span, div, li').forEach(el => {
      if (el.innerText?.includes('요청')) {
        results.push({
          tag: el.tagName,
          text: el.innerText.substring(0, 60),
          class: el.className?.substring(0, 60),
          role: el.getAttribute('role') || ''
        });
      }
    });
    return results;
  });
  console.log('\n=== "요청" 포함 요소들 ===');
  console.log(JSON.stringify(allRequestElements, null, 2));

  await browser.close();
})();
