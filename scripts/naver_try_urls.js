const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();

  // 다양한 URL 시도
  const urls = [
    'https://searchadvisor.naver.com/console/site/insight?site=https://aicut.co.kr',
    'https://searchadvisor.naver.com/console/site/report?site=https://aicut.co.kr',
    'https://searchadvisor.naver.com/console/site/diagnosis?site=https://aicut.co.kr',
    'https://searchadvisor.naver.com/console/site/crawl?site=https://aicut.co.kr',
    'https://searchadvisor.naver.com/console/site/collect?site=https://aicut.co.kr'
  ];

  for (const url of urls) {
    try {
      const resp = await saPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await saPage.waitForTimeout(2000);
      const status = resp?.status() || 'no response';
      const text = await saPage.evaluate(() => document.body.innerText);
      const first100 = text.substring(0, 200).replace(/\n/g, ' ');
      console.log(`${url} -> ${status} | ${first100.substring(0, 150)}`);
    } catch(e) {
      console.log(`${url} -> ERROR: ${e.message.substring(0, 80)}`);
    }
  }

  await browser.close();
})();
