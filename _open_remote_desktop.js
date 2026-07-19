const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Find a blank page or create new
  let page = pages.find(p => p.url() === 'about:blank');
  if (!page) page = await ctx.newPage();
  
  // Go to Chrome Remote Desktop setup
  await page.goto('https://remotedesktop.google.com/access', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('URL:', page.url());
  
  await page.waitForTimeout(2000);
  console.log('Chrome Remote Desktop 페이지가 열렸습니다.');
  
  await b.close();
})();
