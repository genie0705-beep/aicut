const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 광고 상세 데이터 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 상세 성과 보고서 페이지로 이동
  const page = await ctx.newPage();
  
  // 보고서 페이지 시도
  console.log('1. 보고서 페이지 접속...');
  await page.goto('https://manage.searchad.naver.com/reports/overview', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  console.log('   URL:', (await page.evaluate('location.href')).substring(0, 100));

  let text = await page.evaluate(() => document.body.innerText);
  console.log('\n   [Reports Overview]');
  text.split('\n').filter(l => l.trim()).slice(0, 60).forEach((l, i) => {
    if (i < 60) console.log(`    ${i}: ${l.trim().substring(0, 120)}`);
  });

  // 키워드 성과 확인
  console.log('\n2. 키워드 성과 페이지...');
  await page.goto('https://manage.searchad.naver.com/reports/keyword', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  
  text = await page.evaluate(() => document.body.innerText);
  console.log('   [Keyword Performance]');
  text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => {
    console.log(`    ${i}: ${l.trim().substring(0, 120)}`);
  });

  b.close();
})().catch(e => console.error('FATAL:', e.message));
