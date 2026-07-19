const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. Blokey 실시간 트렌드 더 보기
  console.log('=== Blokey 실시간 트렌드 전체 ===');
  await page.goto('https://blokey.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);

  // 실시간 트렌드 클릭
  await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const el of links) {
      if (el.textContent.trim() === '실시간 트렌드') { el.click(); break; }
    }
  });
  await sleep(4000);

  // 모든 트렌드 데이터 수집
  let text = await page.evaluate(() => document.body.innerText);
  const trendSection = text.split('\n').filter(l => l.trim());
  
  console.log('   [네이버 트렌드 순위]');
  // 1~20위까지 찾기
  const trendItems = [];
  for (let i = 0; i < trendSection.length; i++) {
    const line = trendSection[i];
    if (/^\d+$/.test(line.trim())) {
      if (i + 1 < trendSection.length) {
        trendItems.push(`${line}. ${trendSection[i+1]}`);
      }
    }
  }
  trendItems.slice(0, 20).forEach(item => console.log(`    ${item}`));

  // 2. 키워드 분석 페이지 직접 방문
  console.log('\n\n=== 키워드 분석 ===');
  await page.goto('https://blokey.co.kr/keyword-analysis', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);
  
  text = await page.evaluate(() => document.body.innerText);
  console.log('   [키워드 분석 페이지]');
  text.split('\n').filter(l => l.trim()).slice(0, 20).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));

  // 3. 트렌드 주제 페이지
  console.log('\n\n=== 트렌드 주제 ===');
  await page.goto('https://blokey.co.kr/trend-topics', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);

  text = await page.evaluate(() => document.body.innerText);
  console.log('   [트렌드 주제]');
  text.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
