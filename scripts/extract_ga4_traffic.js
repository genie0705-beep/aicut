const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  const gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (!gaPage) { console.log('GA4 탭 없음'); await browser.close(); process.exit(1); }
  
  await gaPage.bringToFront();
  await gaPage.waitForTimeout(2000);
  
  // 트래픽 획득 보고서로 이동
  // SPA이므로 URL 직접 변경
  await gaPage.evaluate(() => {
    window.location.hash = '#/p538910436/reports/trafficacquisition';
  });
  await gaPage.waitForTimeout(8000);
  
  const data = await gaPage.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => l.trim()).map(l => l.trim());
    return { 
      lines: lines.slice(0, 200),
      rawText: text.substring(0, 8000)
    };
  });
  
  console.log(JSON.stringify(data, null, 2));
  
  await browser.close();
})();
