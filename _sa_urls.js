const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // 전체 페이지 HTML에서 사이트 관련 URL 찾기
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  
  // aicut 관련 URL 찾기
  const matches = html.match(/aicut[^\"]*/g) || [];
  console.log('aicut 관련 문자열:', matches);
  
  const consoleMatches = html.match(/console[^\"]*/g) || [];
  console.log('console 관련:', consoleMatches.filter(m => m.includes('site') || m.includes('aicut')).slice(0, 5));
  
  // '웹마스터 도구 사용하기' 버튼 href
  const toolBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('a');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t.includes('웹마스터 도구 사용하기')) {
        return btn.getAttribute('href');
      }
      if (t.includes('웹마스터 도구')) {
        return btn.getAttribute('href');
      }
    }
    return null;
  });
  console.log('\\n웹마스터 도구 버튼 href:', toolBtn);
  
  // 네이버 웹마스터 도구 (이전 도메인) - 새 URL
  await page.goto('https://searchadvisor.naver.com/guide', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log('\\n가이드 URL:', page.url().substring(0, 120));
  
  // 사이트 등록/관리 URL 패턴 시도
  const possibleUrls = [
    'https://searchadvisor.naver.com/console/site',
    'https://searchadvisor.naver.com/console',
    'https://searchadvisor.naver.com/dashboard',
    'https://searchadvisor.naver.com/sites',
    'https://searchadvisor.naver.com/manage'
  ];
  
  for (const u of possibleUrls) {
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const finalUrl = page.url();
    const text = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || '');
    if (!text.includes('could not be found') && !text.includes('문제가 발생')) {
      console.log('\\n✅ 유효 URL:', u, '→', finalUrl.substring(0, 100));
      console.log('텍스트:', text.substring(0, 200));
      break;
    }
  }
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
