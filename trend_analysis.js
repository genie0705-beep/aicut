const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== 블로키 실시간 트렌드 분석 ===\n');

  // 블로키 메인 → 실시간 트렌드
  await page.goto('https://blokey.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);

  const mainText = await page.evaluate(() => document.body.innerText);
  
  // 🔥 인기: section
  const hotSection = mainText.match(/🔥 인기:[\s\S]*?(?=\n\n|\n\w|$)/);
  if (hotSection) console.log('🔥 인기 키워드:', hotSection[0]);

  // 네이버 실시간 트렌드 찾기
  const lines = mainText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // 맛집 카테고리 (1/32)
  const trendStart = lines.findIndex(l => l.includes('맛집 (1/32)') || l.includes('네이버') || l.includes('LIVE'));
  if (trendStart >= 0) {
    console.log('\n📊 네이버 실시간 트렌드:');
    for (let i = trendStart; i < Math.min(trendStart + 25, lines.length); i++) {
      const l = lines[i];
      if (/^\d+$/.test(l) || l.match(/^[가-힣]/)) {
        console.log(`  ${l}`);
      }
    }
  }

  // 황금키워드
  const goldStart = lines.findIndex(l => l.includes('황금지수') || l.includes('S등급'));
  if (goldStart >= 0) {
    console.log('\n🥇 황금키워드:');
    for (let i = goldStart; i < Math.min(goldStart + 15, lines.length); i++) {
      const l = lines[i];
      if (l.match(/^[A-D]\s/) || l.includes('S') || l.includes('황금')) {
        console.log(`  ${l}`);
      }
    }
  }

  // 실시간 트렌드 페이지도 확인
  console.log('\n=== 실시간 트렌드 페이지 ===');
  await page.goto('https://blokey.co.kr/trending', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  const trendText = await page.evaluate(() => document.body.innerText);
  const trendLines = trendText.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  
  const keywords = trendLines.filter(l => 
    (l.match(/^[가-힣]/) && l.length < 30) && 
    !l.includes('블로키') && !l.includes('로그인') && !l.includes('이용약관')
  ).slice(0, 30);
  
  if (keywords.length > 0) {
    console.log('주요 키워드:');
    keywords.forEach(k => console.log(`  ${k}`));
  }

  console.log('\n=== 분석 완료 ===');
})();
