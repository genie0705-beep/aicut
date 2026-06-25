const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  const p = await ctx.newPage();
  
  // 검색 URL 직접 사용
  const query = encodeURIComponent('영상편집 업체 추천');
  await p.goto('https://kin.naver.com/search/search.naver?query=' + query, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {
    // 다른 URL 시도
    return p.goto('https://kin.naver.com/search/search?query=' + query, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  });
  await p.waitForTimeout(5000);
  
  console.log('URL:', p.url().substring(0, 200));
  const body = await p.evaluate(() => document.body.innerText.substring(0, 6000));
  console.log(body);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 200)));
