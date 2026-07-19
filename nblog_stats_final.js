const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 분석 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 기존 탭 확인 (사용자가 로그인했을 수 있음)
  const pages = ctx.pages();
  console.log('열린 탭:', pages.length);
  for (let i = 0; i < pages.length; i++) {
    const url = pages[i].url();
    if (url.includes('blog') || url.includes('naver')) {
      console.log(`  [${i}] ${url.substring(0, 100)}`);
    }
  }

  // 새 탭에서 블로그 통계 시도
  const page = await ctx.newPage();
  
  // 1. 로그인 상태 확인
  console.log('\n1. 네이버 로그인 상태...');
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(3000);
  let text = await page.evaluate(() => document.body.innerText);
  const loggedIn = text.includes('로그아웃');
  console.log('   로그인:', loggedIn ? '✅' : '❌');
  
  if (loggedIn) {
    // 계정명 추출
    const accountMatch = text.match(/[a-zA-Z0-9_.]+@[a-zA-Z0-9_.]+/) || text.match(/([a-zA-Z0-9_]+)님/);
    console.log('   계정:', accountMatch ? accountMatch[0] || accountMatch[1] : '확인 불가');
  }

  // 2. 블로그 통계 페이지 접속
  console.log('\n2. 블로그 통계 접속...');
  
  // 통계 메인
  await page.goto('https://blog.naver.com/blogstats/blogInfo.naver', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);
  let loc = await page.evaluate('location.href');
  console.log('   URL:', loc.substring(0, 100));
  text = await page.evaluate(() => document.body.innerText);
  console.log('   [blogInfo]');
  text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  // 3. 다양한 통계 URL 시도
  const statUrls = [
    'https://section.blog.naver.com/stats/',
    'https://blog.naver.com/blogstats/statistics.naver',
    'https://blog.naver.com/blogstats/visitor.naver',
    'https://blog.naver.com/blogstats/traffic.naver',
    'https://blog.naver.com/blogstats/post.naver',
    'https://blog.naver.com/blogstats/subscriber.naver',
    'https://section.blog.naver.com/stats/main',
  ];
  
  for (const url of statUrls) {
    console.log(`\n   시도: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(3000);
    loc = await page.evaluate('location.href');
    text = await page.evaluate(() => document.body.innerText);
    const hasError = text.includes('유효하지 않은 요청') || text.includes('페이지 주소') || text.includes('해당 블로그');
    const hasStats = text.includes('방문자') || text.includes('노출') || text.includes('조회') || text.includes('오늘') || text.includes('구독');
    
    if (!hasError) {
      console.log(`   → ${loc.substring(0, 80)}`);
      console.log(`   stats data: ${hasStats ? '✅' : '⚠️'}`);
      text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => {
        const line = l.trim().substring(0, 120);
        if (line) console.log(`    ${i}: ${line}`);
      });
      
      if (hasStats) {
        // 숫자 데이터 추출 시도
        const numbers = text.match(/[0-9,]+/g) || [];
        console.log('\n   📊 숫자 데이터:', numbers.slice(0, 20).join(', '));
      }
      break;
    }
  }

  // 4. 각 게시물별 통계 (통계 팝업 확인) - 개별 포스트 페이지
  console.log('\n4. 개별 포스트 통계 확인...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(3000);
  
  const frames = page.frames();
  for (const f of frames) {
    if (f.url().includes('PostList')) {
      const ft = await f.evaluate(() => document.body.innerText);
      console.log('   [PostList]');
      ft.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));
      break;
    }
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
