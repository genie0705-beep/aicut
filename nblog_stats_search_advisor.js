const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 네이버 서치어드바이저 + 블로그 통계 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. 서치어드바이저 접속
  console.log('1. 서치어드바이저...');
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  let text = await page.evaluate(() => document.body.innerText);
  console.log('   로그인 상태:', text.includes('로그아웃') ? '✅' : '❌');
  if (text.includes('로그아웃') || text.includes('대시보드')) {
    console.log('   [Dashboard]');
    text.split('\n').filter(l => l.trim()).slice(0, 50).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));
  }

  // 2. 검색어별 블로그 통계
  console.log('\n2. 사이트 진단...');
  // 사이트 진단 페이지
  await page.goto('https://searchadvisor.naver.com/site', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  text = await page.evaluate(() => document.body.innerText);
  console.log('   [Site]');
  text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  // 3. blog.naver.com/aicut 포스트별 통계 (공개 페이지에서)
  console.log('\n3. 블로그 게시물 리스트 + 각 게시물 통계 확인...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  
  // mainFrame iframe 안으로
  const frame = page.frame({ url: /PrologueList|PostList/ });
  if (frame) {
    const ft = await frame.evaluate(() => document.body.innerText);
    console.log('   [PostList frame]');
    ft.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
