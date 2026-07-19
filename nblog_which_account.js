const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 네이버 계정 확인 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. 네이버 계정 정보 확인
  console.log('1. 계정 정보...');
  await page.goto('https://nid.naver.com/user2/help/myInfo.naver', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  const text = await page.evaluate(() => document.body.innerText);
  console.log('   [My Info]');
  text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  // 2. 블로그 에디터 접근 시도 (글쓰기 페이지)
  console.log('\n2. 블로그 글쓰기 페이지...');
  await page.goto('https://blog.naver.com/blogpostwrite.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  const loc = await page.evaluate('location.href');
  console.log('   URL:', loc.substring(0, 100));
  const et = await page.evaluate(() => document.body.innerText);
  console.log('   [Editor]');
  et.split('\n').filter(l => l.trim()).slice(0, 20).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  console.log('\n3. 블로그 설정 페이지...');
  await page.goto('https://blog.naver.com/blogsetting?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  await sleep(2000);
  const loc2 = await page.evaluate('location.href');
  console.log('   URL:', loc2.substring(0, 100));
  const st = await page.evaluate(() => document.body.innerText);
  st.split('\n').filter(l => l.trim()).slice(0, 15).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 100)}`));

  b.close();
})().catch(e => console.error('FATAL:', e.message));
