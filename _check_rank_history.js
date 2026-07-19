const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Check previous days for rank data
  const dates = ['20260717', '20260716', '20260715', '20260714', '20260713', '20260712', '20260711'];
  
  console.log('=== DAILY RANK DATA (last 7 days) ===\n');
  
  for (const date of dates) {
    try {
      const url = 'https://blog.stat.naver.com/blog/rank/cv/content?blogId=aicut&isIE8=false&term=day&startDate=' + date;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const text = await page.evaluate(() => document.body.innerText);
      
      // Extract rank data
      const lines = text.split('\n');
      const rankStart = lines.findIndex(l => l.includes('순위\t제목'));
      if (rankStart >= 0) {
        console.log(`--- ${date} ---`);
        for (let i = rankStart + 1; i < Math.min(rankStart + 7, lines.length); i++) {
          if (lines[i].trim() && !lines[i].includes('이전 페이지') && !lines[i].includes('조회수 순위')) {
            console.log(`  ${lines[i]}`);
          }
        }
      }
    } catch(e) {
      console.log(`${date}: ERROR ${e.message.substring(0,40)}`);
    }
  }
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
