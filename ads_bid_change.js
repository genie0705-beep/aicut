const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) { await b.close(); return; }
  await p.bringToFront();

  // 광고그룹 설정 페이지로
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(5000);

  console.log('URL:', p.url().substring(0, 100));
  const body = await p.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log(body);
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
