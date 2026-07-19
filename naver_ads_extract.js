const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 광고센터 데이터 수집 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 네이버 광고센터 열기
  const page = await ctx.newPage();
  console.log('1. 네이버 광고센터 접속...');
  await page.goto('https://manage.searchad.naver.com', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await sleep(5000);
  console.log('   URL:', (await page.evaluate('location.href')).substring(0, 100));

  // 로그인 확인
  const isLoggedIn = await page.evaluate(() => {
    const text = document.body.innerText;
    return !text.includes('로그인') || text.includes('캠페인') || text.includes('광고') || text.includes('대시보드');
  });
  console.log('   로그인:', isLoggedIn ? '✅' : '❌');

  // 대시보드로 이동
  if (isLoggedIn) {
    await page.goto('https://manage.searchad.naver.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);

    const dashText = await page.evaluate(() => document.body.innerText);
    console.log('\n━━━ 대시보드 raw ━━━');
    dashText.split('\n').filter(l => l.trim()).slice(0, 50).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 100)}`));

    // 요약/통계 탭
    const summaryMatch = dashText.match(/(?:노출|클릭|CTR|CPC|비용|노출수|클릭수|광고비|총비용|평균\s*CPC|소진)[^0-9]*([0-9,]+[%]?)/g);
    if (summaryMatch) {
      console.log('\n📊 숫자 데이터 스니펫:');
      summaryMatch.forEach(m => console.log('  ' + m.trim()));
    }

    // 캠페인 목록
    console.log('\n2. 캠페인 목록...');
    await page.goto('https://manage.searchad.naver.com/customer/campaign', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);

    const campText = await page.evaluate(() => document.body.innerText);
    console.log('  [Campaigns raw]');
    campText.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

    // 비즈머니 잔액 확인
    console.log('\n3. 비즈머니 확인...');
    const bizMoney = await page.evaluate(() => {
      const text = document.body.innerText;
      const idx = text.indexOf('비즈머니');
      if (idx >= 0) {
        return text.substring(Math.max(0, idx - 50), Math.min(text.length, idx + 200)).replace(/\n/g, ' ').trim();
      }
      return '비즈머니 정보 없음';
    });
    console.log('  💰', bizMoney);
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));
