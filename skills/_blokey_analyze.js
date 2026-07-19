// blokey — 실시간 트렌드 + 황금키워드 수집
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // blokey 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blokey')) { page = p; break; }
  }
  if (!page) { console.log('blokey 탭 없음'); await b.disconnect(); return; }
  
  // 1. 실시간 트렌드
  console.log('1️⃣ 실시간 트렌드 확인...');
  await page.goto('https://blokey.co.kr/trend', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const trendText = await page.evaluate(() => (document.body.innerText || '').slice(0, 1500));
  console.log('트렌드 페이지:', trendText);
  await page.screenshot({ path: 'debug_blokey_trend.png', fullPage: true });
  
  // 2. 황금키워드 찾기
  console.log('\n2️⃣ 황금키워드 찾기...');
  await page.goto('https://blokey.co.kr/golden-keyword', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const goldenText = await page.evaluate(() => (document.body.innerText || '').slice(0, 1500));
  console.log('황금키워드:', goldenText);
  await page.screenshot({ path: 'debug_blokey_golden.png', fullPage: true });
  
  // 3. 키워드 분석 — 시드 키워드로 연관 검색
  console.log('\n3️⃣ 영상편집외주 키워드 분석...');
  await page.goto('https://blokey.co.kr/keyword', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 입력창 찾아서 키워드 입력
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="키워드"], textarea');
    for (const inp of inputs) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(inp, '영상편집외주');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(500);
  
  // 조회 버튼 클릭
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button, [role="button"]');
    for (const b of btns) {
      if (b.innerText.includes('등급') || b.innerText.includes('조회') || b.innerText.includes('분석')) {
        b.click(); return;
      }
    }
  });
  await page.waitForTimeout(5000);
  
  const keywordResult = await page.evaluate(() => (document.body.innerText || '').slice(0, 2000));
  console.log('분석 결과:', keywordResult);
  await page.screenshot({ path: 'debug_blokey_analysis.png', fullPage: true });
  
  await b.disconnect();
  console.log('\n✅ blokey 데이터 수집 완료');
}

main().catch(e => console.error('❌', e.message));
