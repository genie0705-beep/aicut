const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== 7월 여행지 정보 리서치 ===\n');

  const searches = [
    { label: '7월 국내 여행지 추천', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=2026%EB%85%84+7%EC%9B%94+%EA%B5%AD%EB%82%B4+%EC%97%AC%ED%96%89%EC%A7%80+%EC%B6%94%EC%B2%9C+%EC%97%AC%EB%A6%84' },
    { label: '제주도 7월 여행', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=2026%EB%85%84+7%EC%9B%94+%EC%A0%9C%EC%A3%BC%EB%8F%84+%EC%97%AC%ED%96%89+%EC%BD%94%EC%8A%A4+%EC%B6%94%EC%B2%9C' },
    { label: '강릉 속초 7월', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=2026%EB%85%84+7%EC%9B%94+%EA%B0%95%EB%A6%89+%EC%86%8D%EC%B4%88+%EC%97%AC%ED%96%89+%EC%B6%94%EC%B2%9C' },
    { label: '부산 7월 여행', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=2026%EB%85%84+7%EC%9B%94+%EB%B6%80%EC%82%B0+%EC%97%AC%ED%96%89+%EC%B6%94%EC%B2%9C' },
    { label: '여름 휴가철 인기 여행지', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=2026%EB%85%84+%EC%97%AC%EB%A6%84+%ED%9C%B4%EA%B0%80%EC%B2%A0+%EC%9D%B8%EA%B8%B0+%EC%97%AC%ED%96%89%EC%A7%80+%EC%B6%94%EC%B2%9C' },
  ];

  for (const s of searches) {
    try {
      await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      
      const text = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let texts = [];
        let node;
        while (node = walker.nextNode()) {
          const t = node.textContent.trim();
          if (t.length > 10 && !t.includes('새 창 열림') && !t.includes('AD') && !t.includes('script')) {
            texts.push(t);
          }
        }
        return texts.join('\n');
      });

      const lines = text.split('\n').filter(l => l.trim().length > 15).slice(0, 40);
      console.log(`\n=== ${s.label} ===`);
      lines.forEach(l => console.log(`  ${l.substring(0, 120)}`));
      
    } catch(e) {
      console.log(`\n=== ${s.label} === 오류: ${e.message}`);
    }
  }

  console.log('\n=== 리서치 완료 ===');
})();
