const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // 광고센터 탭 사용
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('ads.naver.com'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://ads.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  }

  await new Promise(r => setTimeout(r, 2000));

  // 키워드 도구 페이지로 이동
  await page.goto('https://manage.searchad.naver.com/keyword/keywordTool', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  const kwPageText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('=== 키워드 도구 페이지 ===');
  console.log(kwPageText);

  // 로그인/접근 상태 확인
  const isLoggedIn = kwPageText.includes('로그아웃') || kwPageText.includes('genie0705');
  console.log('\n로그인 상태:', isLoggedIn ? '✅' : '❌');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
