const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 🔌 150W PD 충전기 / HP 변환 케이블 검색 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. Victus 15-fa2710TX 충전 스펙 확인
  console.log('1. HP 공식 스펙 확인...');
  await page.goto('https://support.hp.com/kr-ko/document/ish_10363138-10431370-16', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(3000);
  let text = await page.evaluate(() => document.body.innerText);
  console.log('   [HP Support]');
  text.split('\n').filter(l => l.trim() && (l.toLowerCase().includes('power') || l.includes('전원') || l.includes('충전') || l.includes('어댑터') || l.includes('PD') || l.includes('USB-C') || l.includes('watt') || l.includes('W'))).slice(0, 15).forEach(l => console.log('    ' + l.trim().substring(0, 120)));

  // 2. 네이버 쇼핑 검색 - 150W PD 충전기
  console.log('\n\n2. 네이버 쇼핑 - 150W PD 충전기 검색...');
  await page.goto('https://search.shopping.naver.com/search/all?origQuery=150W+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0&query=150W+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  text = await page.evaluate(() => document.body.innerText);
  console.log('   [Search results]');
  text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  // 3. HP 변환 케이블 검색
  console.log('\n\n3. HP 변환 케이블 검색...');
  await page.goto('https://search.shopping.naver.com/search/all?origQuery=HP+PD+%EB%B3%80%ED%99%98+%EC%BC%80%EC%9D%B4%EB%B8%94&query=HP+PD+%EB%B3%80%ED%99%98+%EC%BC%80%EC%9D%B4%EB%B8%94', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  text = await page.evaluate(() => document.body.innerText);
  console.log('   [Search results]');
  text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  // 4. 100W 게이밍 노트북 충전기 + HP 팁
  console.log('\n\n4. 100W PD + HP 변환팁 검색...');
  await page.goto('https://search.shopping.naver.com/search/all?origQuery=100W+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0+HP+%ED%8C%81&query=100W+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0+HP+%ED%8C%81', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  text = await page.evaluate(() => document.body.innerText);
  console.log('   [Search results]');
  text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.trim().substring(0, 120)}`));

  b.close();
})().catch(e => console.error('FATAL:', e.message));
