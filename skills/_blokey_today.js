// blokey — 오늘 날짜 실시간 키워드 + 트렌드 분석
const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // blokey 탭 찾기 or 새 탭 열기
  let page = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url.includes('blokey')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
  }
  
  const results = { trends: [], goldenKeywords: [], keywordAnalysis: [] };

  // 1️⃣ 실시간 트렌드
  console.log('1️⃣ 실시간 트렌드...');
  await page.goto('https://blokey.co.kr/trend', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const trendHtml = await page.evaluate(() => {
    const body = document.body;
    // 모든 텍스트 노드 수집
    const walker = document.createTreeWalker(body, 4, null, Infinity);
    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const t = node.textContent.trim();
      if (t.length > 3) texts.push(t);
    }
    return texts.join('\n').slice(0, 4000);
  });
  console.log('트렌드 HTML 텍스트:', trendHtml);
  
  // 2️⃣ 황금키워드
  console.log('\n2️⃣ 황금키워드...');
  await page.goto('https://blokey.co.kr/golden-keyword', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const goldenHtml = await page.evaluate(() => {
    const body = document.body;
    const walker = document.createTreeWalker(body, 4, null, Infinity);
    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const t = node.textContent.trim();
      if (t.length > 3) texts.push(t);
    }
    return texts.join('\n').slice(0, 4000);
  });
  console.log('황금키워드 HTML 텍스트:', goldenHtml);
  
  // 3️⃣ 키워드 분석 — 네이버 핫키워드/실시간 검색어
  console.log('\n3️⃣ 키워드 분석 페이지...');
  await page.goto('https://blokey.co.kr/keyword', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const kwHtml = await page.evaluate(() => {
    const body = document.body;
    const walker = document.createTreeWalker(body, 4, null, Infinity);
    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const t = node.textContent.trim();
      if (t.length > 3) texts.push(t);
    }
    return texts.join('\n').slice(0, 4000);
  });
  console.log('키워드 분석 페이지:', kwHtml);
  
  // 결과 저장
  const output = {
    trends: trendHtml,
    goldenKeywords: goldenHtml,
    keywordPage: kwHtml,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync('blokey_results.json', JSON.stringify(output, null, 2), 'utf8');
  console.log('\n✅ blokey 데이터 수집 완료 → blokey_results.json');
  
  await b.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
