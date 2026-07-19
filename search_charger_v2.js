const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 네이버 쇼핑 - 150W PD 충전기
  console.log('=== 150W PD 충전기 검색 ===');
  await page.goto('https://search.shopping.naver.com/search/all?query=150W+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('nav err:', e.message.substring(0, 40)));
  await sleep(4000);
  let t = await page.evaluate(() => document.body.innerText).catch(() => '');
  t.split('\n').filter(l => l.trim()).slice(0, 25).forEach((l, i) => console.log(`  ${i}: ${l.substring(0, 100)}`));

  // HP 변환 케이블
  console.log('\n=== HP PD 변환 케이블 검색 ===');
  await page.goto('https://search.shopping.naver.com/search/all?query=HP+PD+%EB%B3%80%ED%99%98%EC%BC%80%EC%9D%B4%EB%B8%94', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('nav err:', e.message.substring(0, 40)));
  await sleep(4000);
  t = await page.evaluate(() => document.body.innerText).catch(() => '');
  t.split('\n').filter(l => l.trim()).slice(0, 25).forEach((l, i) => console.log(`  ${i}: ${l.substring(0, 100)}`));

  // 100W HP 변환 케이블
  console.log('\n=== 100W HP 변환케이블 검색 ===');
  await page.goto('https://search.shopping.naver.com/search/all?query=100W+HP+%EB%B3%80%ED%99%98%EC%BC%80%EC%9D%B4%EB%B8%94+PD', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('nav err:', e.message.substring(0, 40)));
  await sleep(4000);
  t = await page.evaluate(() => document.body.innerText).catch(() => '');
  t.split('\n').filter(l => l.trim()).slice(0, 25).forEach((l, i) => console.log(`  ${i}: ${l.substring(0, 100)}`));

  b.close();
})().catch(e => console.log('FATAL:', e.message.substring(0, 60)));
