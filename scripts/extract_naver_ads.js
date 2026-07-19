const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // 서치어드바이저 탭 찾기
  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  
  if (saPage) {
    console.log('=== 서치어드바이저 데이터 ===');
    await saPage.bringToFront();
    await saPage.waitForTimeout(3000);
    
    const saData = await saPage.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').filter(l => l.trim()).map(l => l.trim());
      return { lines: lines.slice(0, 150), rawText: text.substring(0, 6000) };
    });
    
    console.log(JSON.stringify(saData, null, 2));
  } else {
    console.log('서치어드바이저 탭 없음');
  }
  
  // 네이버 광고센터 새 탭 열기
  console.log('=== 네이버 광고센터 접속 ===');
  const adPage = await ctx.newPage();
  await adPage.goto('https://manage.searchad.naver.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await adPage.waitForTimeout(5000);
  
  console.log('광고센터 URL:', adPage.url());
  
  const adData = await adPage.evaluate(() => {
    const text = document.body.innerText;
    return { rawText: text.substring(0, 6000) };
  });
  
  console.log(JSON.stringify(adData, null, 2));
  
  await browser.close();
})();
