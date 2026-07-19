const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 v3 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. 먼저 aicut 블로그 방문
  console.log('1. 블로그 메인 방문...');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  const loc1 = await page.evaluate('location.href');
  console.log('   URL:', loc1.substring(0, 100));

  let text = await page.evaluate(() => document.body.innerText);
  console.log('   [Preview]');
  text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  // 2. 통계 URL 패턴 시도
  const statsUrls = [
    'https://blog.naver.com/blogstats/statistics?blogId=aicut',
    'https://blog.naver.com/blogstats/statistics.naver?blogId=aicut',
    'https://blog.naver.com/blogstats/visitor?blogId=aicut',
    'https://blog.naver.com/blogstats/traffic?blogId=aicut',
    'https://blog.naver.com/blogstats/post?blogId=aicut',
  ];

  for (const url of statsUrls) {
    console.log(`\n2. 시도: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(4000);

    const loc = await page.evaluate('location.href');
    const t = await page.evaluate(() => document.body.innerText);
    console.log('   →', loc.substring(0, 100));
    
    // 성공 조건: 에러 메시지 없고, 통계 관련 키워드 포함
    const hasStat = /방문자|노출|유입|조회|구독|통계|오늘|어제|주간|월간/.test(t);
    const noError = !t.includes('유효하지 않은 요청') && !t.includes('페이지 주소');
    
    if (noError && hasStat) {
      console.log('   ✅ 통계 데이터 발견!');
      t.split('\n').filter(l => l.trim()).slice(0, 50).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));
      break;
    } else if (noError) {
      console.log('   ⚠️ 접속됐으나 통계 데이터 미발견, raw:', t.substring(0, 300).replace(/\n/g, ' | '));
    }
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
