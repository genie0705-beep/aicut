const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  
  // 1) 수집 요청 보내기
  await saPage.goto('https://searchadvisor.naver.com/console/site/collect?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(3000);
  
  // "확인" 버튼 클릭해서 수집 요청
  const confirmBtn = await saPage.$('text=확인');
  if (confirmBtn) {
    await confirmBtn.click();
    await saPage.waitForTimeout(3000);
    const text = await saPage.evaluate(() => document.body.innerText);
    console.log('=== 수집 요청 결과 ===');
    console.log(text.substring(0, 3000));
  }

  // 2) 사이트맵 제출 페이지 확인
  await saPage.goto('https://searchadvisor.naver.com/console/site/rss?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(3000);
  
  const sitemapText = await saPage.evaluate(() => document.body.innerText);
  console.log('\n=== 사이트맵 제출 페이지 ===');
  console.log(sitemapText.substring(0, 3000));

  await browser.close();
})();
