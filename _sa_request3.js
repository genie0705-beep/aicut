const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 요청 페이지 URL 직접 시도
  const urls = [
    'https://searchadvisor.naver.com/console/site/request?site=https%3A%2F%2Faicut.co.kr',
    'https://searchadvisor.naver.com/console/site/requestSite?site=https%3A%2F%2Faicut.co.kr',
    'https://searchadvisor.naver.com/console/site/crawlRequest?site=https%3A%2F%2Faicut.co.kr',
  ];
  
  for (const u of urls) {
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const text = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
    if (!text.includes('could not be found') && !text.includes('문제가 발생')) {
      console.log('✅ 유효:', u.substring(0, 100));
      console.log('내용:', text.substring(0, 300));
      break;
    }
  }
  
  // 수집 요청 버튼 찾기
  const btnInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, div[role=button], span');
    const result = [];
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t && t.length < 30 && btn.offsetParent !== null) {
        result.push(t);
      }
    }
    return result;
  });
  console.log('\\n버튼들:', btnInfo.slice(0, 15).join(', '));
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
