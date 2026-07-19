const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 수집 v2 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 여러 URL 시도
  const urls = [
    'https://blog.naver.com/blogstats/main?blogId=aicut',
    'https://blog.naver.com/blogstats/statistics?blogId=aicut',
    'https://blog.naver.com/blogstats/blogInfo.naver?blogId=aicut',
    'https://blog.naver.com/PostList.naver?blogId=aicut',
  ];

  for (const url of urls) {
    console.log(`시도: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(3000);
    const loc = await page.evaluate('location.href');
    console.log(`  → ${loc.substring(0, 100)}`);
    const text = await page.evaluate(() => document.body.innerText);
    const preview = text.substring(0, 500);
    if (!preview.includes('해당 블로그가 없습니다') && !preview.includes('유효하지 않은 요청')) {
      console.log('  ✅ 접속 성공!');
      console.log('  [data]');
      text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));
      break;
    } else {
      console.log('  ❌ 실패:', preview.substring(0, 100));
    }
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
