const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('ads.naver.com') || pg.url().includes('searchad.naver.com')) { p = pg; break; }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://searchad.naver.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  }
  await p.bringToFront();
  await p.waitForTimeout(2000);
  
  // Try old searchad URL for conversion tracking
  await p.goto('https://searchad.naver.com/manage/tools/conversion-tracking', {
    waitUntil: 'domcontentloaded', timeout: 15000
  }).catch(() => {});
  await p.waitForTimeout(5000);
  
  const info = await p.evaluate(() => {
    const body = document.body.innerText;
    const url = window.location.href;
    return { url: url.substring(0, 120), body: body.substring(0, 1000) };
  });
  
  console.log('URL:', info.url);
  console.log('내용:', info.body);
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
