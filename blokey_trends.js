const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 실시간 트렌드
  console.log('=== Blokey 실시간 트렌드 ===');
  await page.goto('https://blokey.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);

  // "실시간 트렌드" 링크 클릭
  const clicked = await page.evaluate(() => {
    const links = document.querySelectorAll('a, button, span');
    for (const el of links) {
      if (el.textContent.trim() === '실시간 트렌드' || el.textContent.includes('실시간 트렌드')) {
        el.click();
        return el.textContent.trim();
      }
    }
    return null;
  });
  console.log('  클릭:', clicked || '실패');
  await sleep(4000);

  let text = await page.evaluate(() => document.body.innerText);
  console.log('  [실시간 트렌드]');
  text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));

  // "황금키워드 찾기" 
  console.log('\n\n=== 황금키워드 찾기 ===');
  await page.goto('https://blokey.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);

  const clicked2 = await page.evaluate(() => {
    const links = document.querySelectorAll('a, button, span');
    for (const el of links) {
      if (el.textContent.trim().includes('황금키워드 찾기') || el.textContent.includes('황금키워드')) {
        el.click();
        return el.textContent.trim();
      }
    }
    return null;
  });
  console.log('  클릭:', clicked2 || '실패');
  await sleep(4000);

  text = await page.evaluate(() => document.body.innerText);
  console.log('  [황금키워드]');
  text.split('\n').filter(l => l.trim()).slice(0, 40).forEach((l, i) => console.log(`    ${i}: ${l.substring(0, 100)}`));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
