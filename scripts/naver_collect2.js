const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();

  // 요약 페이지로 먼저 이동
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(2000);

  // === 1) 수집 요청 ===
  // "요청" 헤더 클릭해서 펼치기
  const reqHeaders = await saPage.$$('[class*="v-list-group__header"]');
  for (const h of reqHeaders) {
    const text = await h.innerText();
    if (text.includes('요청')) {
      await h.click();
      await saPage.waitForTimeout(1000);
      break;
    }
  }

  // "웹 페이지 수집" 클릭
  const collectLink = await saPage.$('a:has-text("웹 페이지 수집")');
  if (collectLink) {
    await collectLink.click();
    await saPage.waitForTimeout(4000);
    const url = saPage.url();
    console.log('수집 페이지 URL:', url);
    
    // "확인" 버튼 찾아서 클릭
    const confirmBtn = await saPage.$('button:has-text("확인")');
    if (confirmBtn) {
      await confirmBtn.click();
      await saPage.waitForTimeout(3000);
      const result = await saPage.evaluate(() => document.body.innerText);
      console.log('=== 수집 요청 결과 ===');
      console.log(result.substring(0, 2000));
    } else {
      console.log('"확인" 버튼 못 찾음');
    }
  }

  // === 2) 사이트맵 제출 ===
  // 다시 "요청" 헤더 (이미 펼쳐져 있을 수 있음)
  // "사이트맵 제출" 클릭
  const sitemapLink = await saPage.$('a:has-text("사이트맵 제출")');
  if (sitemapLink) {
    await sitemapLink.click();
    await saPage.waitForTimeout(4000);
    const url2 = saPage.url();
    console.log('\n사이트맵 페이지 URL:', url2);
    const text2 = await saPage.evaluate(() => document.body.innerText);
    console.log('=== 사이트맵 제출 페이지 ===');
    console.log(text2.substring(0, 3000));
  } else {
    console.log('사이트맵 제출 링크 못 찾음');
  }

  await browser.close();
})();
