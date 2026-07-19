const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // 로그인 버튼 클릭
  const clickResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('a, button, span');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '로그인' && btn.offsetParent !== null) {
        btn.click();
        return 'clicked';
      }
    }
    return 'not found';
  });
  console.log('로그인 버튼:', clickResult);
  
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('이동 후 URL:', url.substring(0, 120));
  
  // 이미 로그인되어서 사이트 목록으로 이동했는지 확인
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
  console.log('\\n페이지:', text.substring(0, 500));
  
  if (url.includes('nid.naver.com')) {
    console.log('\\n네이버 로그인 페이지 - 자동 로그인 시도');
    // 자동 로그인 (저장된 세션)
    await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const url2 = page.url();
    console.log('재시도 URL:', url2.substring(0, 120));
    const text2 = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
    console.log('재시도 텍스트:', text2);
  }
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
