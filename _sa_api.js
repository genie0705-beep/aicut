const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 서치어드바이저에 접속해서 쿠키 확보
  await page.goto('https://searchadvisor.naver.com/console/site/summary?site=https%3A%2F%2Faicut.co.kr', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // CSRF 토큰 추출
  const csrfInfo = await page.evaluate(() => {
    // 페이지 내 CSRF 토큰 찾기
    const html = document.documentElement.outerHTML;
    const csrfMatch = html.match(/csrfToken['":\s]+['"]([^'"]+)['"]/);
    const metaCsrf = document.querySelector('meta[name=csrf-token]')?.getAttribute('content');
    
    return {
      fromMeta: metaCsrf,
      fromHtml: csrfMatch ? csrfMatch[1].substring(0, 50) : null
    };
  });
  console.log('CSRF:', JSON.stringify(csrfInfo));
  
  // API 호출 시도 - 수집 요청
  // 네이버 서치어드바이저 API 추정 URL
  const apiResult = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/requestCrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          siteUrl: 'https://aicut.co.kr',
          requestType: 'CRAWL'
        })
      });
      return { status: response.status, text: await response.text().catch(() => '') };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('API 결과:', JSON.stringify(apiResult));
  
  // 다른 API 엔드포인트 시도
  const endpoints = [
    '/api/requestCrawl',
    '/api/requestCrawlSite',
    '/api/site/crawl',
    '/api/console/crawlRequest',
    '/api/crawlRequest'
  ];
  
  for (const ep of endpoints) {
    try {
      const res = await page.evaluate(async (url) => {
        const r = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'} });
        return { status: r.status, statusText: r.statusText };
      }, ep);
      console.log(ep, '→', JSON.stringify(res));
    } catch(e) {
      console.log(ep, '→ error:', e.message);
    }
  }
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
