const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.waitForTimeout(1000);

  // 현재 URL 기록 (요약 페이지)
  console.log('현재 URL:', saPage.url());

  // 3개 "자세히 보기" 링크 각각 클릭
  for (let i = 0; i < 3; i++) {
    await saPage.goto('https://searchadvisor.naver.com/website/overview?site=https://aicut.co.kr');
    await saPage.waitForTimeout(2000);
    
    const links = await saPage.$$('text=자세히 보기');
    if (links[i]) {
      console.log(`=== 링크 ${i+1} 클릭 ===`);
      await links[i].click();
      await saPage.waitForTimeout(4000);
      const text = await saPage.evaluate(() => document.body.innerText);
      console.log(`URL: ${saPage.url()}`);
      console.log(text.substring(0, 3000));
      console.log('---');
    }
  }

  // 간단체크 메뉴
  console.log('=== 간단체크 ===');
  await saPage.goto('https://searchadvisor.naver.com/website/simple-check?site=https://aicut.co.kr');
  await saPage.waitForTimeout(3000);
  const simpleText = await saPage.evaluate(() => document.body.innerText);
  console.log(simpleText.substring(0, 3000));

  await browser.close();
})();
