const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  
  // 요약 페이지로 이동
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(3000);

  // 전체 메뉴 구조 파악
  const menuData = await saPage.evaluate(() => {
    const allElements = document.querySelectorAll('a, button, [role="button"], li, span, div');
    const texts = [];
    allElements.forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 0 && text.length < 100) {
        texts.push(text);
      }
    });
    // 중복 제거
    return [...new Set(texts)].slice(0, 80);
  });
  console.log('=== 전체 메뉴 ===');
  console.log(JSON.stringify(menuData, null, 2));

  // expand_more 클릭해서 펼치기
  const expandBtns = await saPage.$$('[class*=expand], [class*=arrow], [class*=dropdown]');
  console.log(`\n확장 버튼 수: ${expandBtns.length}`);

  // keyboard_arrow_down 있는 곳 클릭
  const downArrows = await saPage.$$('text=keyboard_arrow_down');
  console.log(`keyboard_arrow_down 수: ${downArrows.length}`);

  // 전체 텍스트 한번 더 확인
  const fullText = await saPage.evaluate(() => document.body.innerText);
  console.log('\n=== 전체 텍스트 ===');
  console.log(fullText.substring(0, 5000));

  await browser.close();
})();
