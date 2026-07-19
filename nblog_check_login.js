const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 네이버 블로그 로그인 상태 확인 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 기존 탭 확인
  const pages = ctx.pages();
  console.log(`열린 탭: ${pages.length}개`);
  for (let i = 0; i < pages.length; i++) {
    console.log(`  [${i}] ${pages[i].url().substring(0, 80)}`);
  }

  // 이미 열린 탭 중에서 네이버 관련 페이지 찾기
  for (const p of pages) {
    if (p.url().includes('naver') || p.url().includes('searchad') || p.url().includes('blog')) {
      console.log(`\n--- ${p.url().substring(0, 80)} ---`);
      await p.bringToFront();
      await sleep(2000);
      const cookies = await ctx.cookies();
      const naverCookies = cookies.filter(c => c.domain.includes('naver') || c.domain.includes('nid'));
      console.log('네이버 쿠키:', naverCookies.length, '개');
      naverCookies.forEach(c => console.log(`  ${c.name}: ${c.value.substring(0, 20)}${c.value.length > 20 ? '...' : ''}`));

      const text = await p.evaluate(() => document.body.innerText).catch(() => 'err');
      console.log('텍스트 미리보기:', text.substring(0, 200).replace(/\n/g, ' | '));
    }
  }

  // 새 탭에서 blog.naver.com 로그인 상태 확인
  console.log('\n--- 새 탭: blog.naver.com ---');
  const np = await ctx.newPage();
  await np.goto('https://blog.naver.com', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(3000);
  const t = await np.evaluate(() => document.body.innerText);
  console.log('blog.naver.com:', t.substring(0, 200).replace(/\n/g, ' | '));

  b.close();
})().catch(e => console.error('FATAL:', e.message));
