const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 7월 17일 주말 행사 검색
  await page.goto('https://search.naver.com/search.naver?query=2026+7%EC%9B%94+17%EC%9D%BC+%ED%96%89%EC%82%AC+%EC%84%9C%EC%9A%B8', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const text1 = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('=== 7/17 행사 ===\n' + text1);
  
  // 7월 주말 가볼만한 곳
  await page.goto('https://search.naver.com/search.naver?query=2026+7%EC%9B%94+%EC%A3%BC%EB%A7%90+%EA%B0%80%EB%B3%BC%EB%A7%8C%ED%95%9C%EA%B3%B3+%EC%84%9C%EC%9A%B8', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const text2 = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('\n=== 7월 주말 가볼만한곳 ===\n' + text2);
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
