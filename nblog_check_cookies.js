const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  
  // 정확한 PostWrite URL 시도
  const page = await ctx.newPage();
  console.log('블로그 포스트 작성 페이지...');
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);
  const loc = await page.evaluate('location.href');
  console.log('URL:', loc.substring(0, 100));
  const t = await page.evaluate(() => document.body.innerText);
  console.log('Body:', t.substring(0, 300));
  
  // 모든 도메인 쿠키 확인
  const allCookies = await ctx.cookies();
  const naverCookies = allCookies.filter(c => c.domain.includes('naver'));
  const blogCookies = allCookies.filter(c => c.domain.includes('blog'));
  console.log('\n네이버 쿠키:', naverCookies.length, '개');
  console.log('블로그 쿠키:', blogCookies.length, '개');
  
  // blog.naver.com 쿠키 확인 (특히 세션 관련)
  if (blogCookies.length > 0) {
    blogCookies.forEach(c => console.log(`  ${c.domain} | ${c.name}: ${c.value.substring(0, 30)}`));
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
