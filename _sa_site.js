const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 서치어드바이저 - 사이트별 대시보드 URL 찾기
  // 시도 1: 사이트 선택 페이지
  await page.goto('https://searchadvisor.naver.com/site', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  let url = page.url();
  console.log('시도1:', url.substring(0, 120));
  
  if (!url.includes('site')) {
    // 시도 2: console 사이트
    await page.goto('https://searchadvisor.naver.com/console/site', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    url = page.url();
    console.log('시도2:', url.substring(0, 120));
  }
  
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
  console.log('\\n=== 내용 ===');
  console.log(text);
  
  // 에이컷 사이트 링크 찾기
  const links = await page.evaluate(() => {
    const all = document.querySelectorAll('a');
    const result = [];
    for (const a of all) {
      const t = (a.innerText || '').trim();
      const href = a.getAttribute('href') || '';
      if ((t.includes('aicut') || t.includes('에이컷') || href.includes('aicut')) && href) {
        result.push({ text: t, href: href.substring(0, 100) });
      }
    }
    return result;
  });
  console.log('\\nAICUT 링크:', JSON.stringify(links));
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
