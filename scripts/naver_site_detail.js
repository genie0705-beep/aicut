const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.waitForTimeout(1000);

  // 1) 콘텐츠 노출/클릭 "자세히 보기"
  const links = await saPage.$$('text=자세히 보기');
  if (links.length > 0) {
    console.log('=== 콘텐츠 노출/클릭 ===');
    await links[0].click();
    await saPage.waitForTimeout(4000);
    let text = await saPage.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 3000));
  }

  await browser.close();
})();
