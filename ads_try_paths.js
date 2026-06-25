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
  
  // Try different URL patterns that might work for conversion tracking
  const paths = [
    'https://ads.naver.com/manage/conversion-tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/conversion-tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/tracking',
    'https://ads.naver.com/manage/conversion',
    'https://ads.naver.com/manage/ad-accounts/334739/ad/tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/sa/tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/tools',
    'https://ads.naver.com/ad-account/334739/conversion-tracking',
    'https://ads.naver.com/settings/conversion-tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/da/tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/da/conversion',
  ];
  
  for (const url of paths) {
    try {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await p.waitForTimeout(1000);
      const text = await p.evaluate(() => document.body.innerText.substring(0, 200));
      const finalUrl = p.url();
      if (!text.includes('찾을 수 없습니다') && !text.includes('404') && !text.includes('nginx')) {
        console.log('✅ HIT: ' + finalUrl.substring(0, 100));
        console.log('   ' + text.substring(0, 100));
      }
    } catch(e) {}
  }
  
  console.log('검색 완료. 적합한 URL 없음.');
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
