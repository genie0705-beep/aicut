const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 수집 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const page = await ctx.newPage();

  // 1. 네이버 블로그 통계 접속
  console.log('1. 블로그 통계 접속...');
  await page.goto('https://blog.naver.com/blogstats', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await sleep(5000);
  console.log('   URL:', (await page.evaluate('location.href')).substring(0, 100));

  // 로그인 확인
  let bodyText = await page.evaluate(() => document.body.innerText);
  const loggedIn = !bodyText.includes('로그인') || bodyText.includes('통계') || bodyText.includes('방문자') || bodyText.includes('노출');
  console.log('   로그인:', loggedIn ? '✅' : '❌');

  // 메인 통계 대시보드
  console.log('\n   [Blog Stats - Main]');
  bodyText.split('\n').filter(l => l.trim()).slice(0, 60).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  if (!loggedIn) {
    console.log('❌ 로그인 필요, Blogger 계정이 aicut일 가능성');
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
