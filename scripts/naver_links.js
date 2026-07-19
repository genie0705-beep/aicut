const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(3000);

  // 모든 a 태그의 href 수집
  const allLinks = await saPage.evaluate(() => {
    const links = [];
    document.querySelectorAll('a').forEach(a => {
      if (a.href) links.push(a.href);
    });
    return [...new Set(links)];
  });
  console.log('=== 모든 링크 ===');
  allLinks.forEach(l => console.log(l));

  // "자세히 보기" 주변 요소 분석
  const detailData = await saPage.evaluate(() => {
    const results = [];
    // "자세히 보기" 텍스트 포함 요소 찾기
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.children.length === 0 && el.innerText?.trim() === '자세히 보기') {
        results.push({
          tag: el.tagName,
          text: el.innerText,
          parentTag: el.parentElement?.tagName,
          parentClass: el.parentElement?.className?.substring(0, 100),
          grandParentClass: el.parentElement?.parentElement?.className?.substring(0, 100)
        });
      }
    });
    return results;
  });
  console.log('\n=== 자세히 보기 요소 분석 ===');
  console.log(JSON.stringify(detailData, null, 2));

  await browser.close();
})();
