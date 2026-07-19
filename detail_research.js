const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  const searches = [
    '서울숲 주차요금 운영시간 곤충식물원',
    '코엑스 수족관 입장료 할인 주차 2026',
    '별마당도서관 운영시간 층별안내',
    '양재꽃시장 경매시간 주차 토요일',
    '북서울꿈의숲 돔전망대 운영시간',
    '서울스카이 입장료 할인 주차 2026',
    '석촌호수 분수쇼 시간 2026',
    '성수동 카페거리 맛집 영업시간',
  ];

  for (let s = 0; s < searches.length; s++) {
    const q = searches[s];
    console.log(`\n[${s+1}/${searches.length}] ${q}`);
    
    try {
      await page.goto(`https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
      await page.waitForTimeout(3000);
      
      const text = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let texts = [];
        let node;
        let count = 0;
        while ((node = walker.nextNode()) && count < 100) {
          const t = node.textContent.trim();
          if (t.length > 5 && !t.includes('function') && !t.includes('script') && !t.includes('새 창')) {
            texts.push(t);
            count++;
          }
        }
        return texts.join('|');
      });

      const info = text.split('|').filter(l => 
        l.includes('원') || l.includes('시') || l.includes('분') || 
        l.includes('주차') || l.includes('할인') || l.includes('무료') ||
        l.includes('~') || l.includes('~') || l.includes('영업')
      ).slice(0, 10);
      
      info.forEach(l => console.log(`  ${l.substring(0, 100)}`));
      
    } catch(e) {
      console.log(`  오류: ${e.message}`);
    }
  }

  console.log('\n=== 리서치 완료 ===');
})();
