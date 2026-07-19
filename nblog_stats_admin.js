const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 관리자 통계 추출 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // admin.blog.naver.com 탭 찾기
  let adminPage = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url.includes('admin.blog.naver.com')) {
      adminPage = p;
      console.log('✅ 블로그 관리자 페이지 발견:', url.substring(0, 100));
      break;
    }
  }

  if (!adminPage) {
    console.log('❌ 블로그 관리자 페이지 없음. 새로 접속 시도...');
    const page = await ctx.newPage();
    await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(5000);
    adminPage = page;
  }

  await adminPage.bringToFront();
  await sleep(2000);

  // ========================================
  // A. 오늘의 통계 (stat/today)
  // ========================================
  console.log('\n━━━ A. 오늘의 통계 ━━━');
  let text = await adminPage.evaluate(() => document.body.innerText);
  console.log('   [Raw - first 60 lines]');
  text.split('\n').filter(l => l.trim()).slice(0, 60).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  // ========================================
  // B. 방문자 통계
  // ========================================
  console.log('\n━━━ B. 방문자 통계 ━━━');
  // admin blog visitor stats
  await adminPage.goto('https://admin.blog.naver.com/aicut/stat/visitor', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);
  text = await adminPage.evaluate(() => document.body.innerText);
  text.split('\n').filter(l => l.trim()).slice(0, 50).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  // ========================================
  // C. 유입 경로 통계
  // ========================================
  console.log('\n━━━ C. 유입 경로 ━━━');
  await adminPage.goto('https://admin.blog.naver.com/aicut/stat/referrer', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);
  text = await adminPage.evaluate(() => document.body.innerText);
  text.split('\n').filter(l => l.trim()).slice(0, 50).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  // ========================================
  // D. 게시글 통계
  // ========================================
  console.log('\n━━━ D. 게시글 통계 ━━━');
  await adminPage.goto('https://admin.blog.naver.com/aicut/stat/post', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);
  text = await adminPage.evaluate(() => document.body.innerText);
  text.split('\n').filter(l => l.trim()).slice(0, 60).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  console.log('\n✅ 수집 완료');
  b.close();
})().catch(e => console.error('FATAL:', e.message));
