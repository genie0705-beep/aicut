const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  console.log('=== PostWrite 페이지 스크린샷 ===\n');

  // 관리자 먼저 방문 (세션 유지)
  console.log('1. 관리자 방문...');
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  
  // 관리자 페이지가 잘 뜨는지 확인
  let adminText = await page.evaluate(() => document.body.innerText);
  const adminOk = !adminText.includes('페이지 주소') && !adminText.includes('유효하지 않은');
  console.log('   관리자 접속:', adminOk ? '✅' : '❌');

  // 2. PostWrite 페이지
  console.log('\n2. 글쓰기 페이지...');
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  
  const url = await page.evaluate('location.href');
  console.log('   URL:', url.substring(0, 100));
  
  // 스크린샷
  await page.screenshot({ path: 'postwrite_screenshot.png', fullPage: true });
  console.log('   📸 스크린샷 저장: postwrite_screenshot.png');

  const text = await page.evaluate(() => document.body.innerText);
  console.log('\n   [Page text]');
  text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
