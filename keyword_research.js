const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 블로키 골든키워드
  await page.goto('https://blokey.co.kr/golden', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('블로키 골든키워드:\n' + text);
  
  // 키워드 검색: 영상편집
  await page.goto('https://blokey.co.kr/keyword-search?query=%EC%98%81%EC%83%81%ED%8E%B8%EC%A7%91', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const kw1 = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('\n--- 영상편집 키워드 ---\n' + kw1);
  
  // 키워드 검색: 숏폼마케팅
  await page.goto('https://blokey.co.kr/keyword-search?query=%EC%88%8F%ED%8F%BC%EB%A7%88%EC%BC%80%ED%8C%85', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const kw2 = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('\n--- 숏폼마케팅 키워드 ---\n' + kw2);
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
