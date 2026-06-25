const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard');
  }
  await p.bringToFront();
  await p.waitForTimeout(3000);

  // 대시보드 페이지에서 모든 링크 스캔
  const allLinks = await p.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.filter(a => a.href).map(a => ({
      text: a.innerText.trim().substring(0, 40),
      href: a.href.substring(0, 120)
    }));
  });
  
  console.log('=== 전체 링크 (' + allLinks.length + '개) ===');
  allLinks.forEach(item => console.log(item.text + ' | ' + item.href));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
