const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  const searches = [
    { label: '서울식물원 상세', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EC%84%9C%EC%9A%B8%EC%8B%9D%EB%AC%BC%EC%9B%90+%EC%9E%85%EC%9E%A5%EB%A3%8C+%EC%98%81%EC%97%85%EC%8B%9C%EA%B0%84+%EC%A3%BC%EC%B0%A8+%ED%99%94%EC%9E%A5%EC%8B%A4+2026' },
    { label: '한강유람선', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%ED%95%9C%EA%B0%95+%EC%9C%A0%EB%9E%8C%EC%84%A0+%EC%9A%94%EA%B8%88+%EC%8B%9C%EA%B0%84+%EC%97%AC%EC%9D%98%EB%8F%84+%EC%95%BC%EA%B0%84+2026+%EC%9A%94%EA%B8%88' },
    { label: '서울공예박물관', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EC%84%9C%EC%9A%B8%EA%B3%B5%EC%98%88%EB%B0%95%EB%AC%BC%EA%B4%80+%EC%9E%85%EC%9E%A5%EB%A3%8C+%EC%9C%84%EC%B9%98+%EC%A3%BC%EC%B0%A8+%EC%98%81%EC%97%85%EC%8B%9C%EA%B0%84' },
    { label: '사운드나루', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EC%82%AC%EC%9A%B4%EB%93%9C%EB%82%98%EB%A3%A8+%EC%84%9C%EC%9A%B8+2026+%EC%84%9C%EA%B5%90%EC%8A%A4%ED%80%98%EC%96%B4+%EB%AC%B4%EB%A3%8C+%EC%9D%BC%EC%A0%95' },
    { label: '발레블러썸', url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EB%B0%9C%EB%A0%88%EB%B8%94%EB%9F%AC%EC%8D%B8+%EC%86%A1%ED%8C%8C%EB%AC%B8%ED%99%94%EC%98%88%EC%88%A0%ED%9A%8C%EA%B4%80+2026' },
  ];

  for (const s of searches) {
    try {
      await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      
      // Try to get the detail text from search results
      const text = await page.evaluate(() => {
        // Get all visible text content
        const body = document.body;
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
        let texts = [];
        let node;
        while (node = walker.nextNode()) {
          const t = node.textContent.trim();
          if (t.length > 20 && !t.includes('새 창 열림') && !t.includes('AD') && !t.includes('광고')) {
            texts.push(t);
          }
        }
        return texts.slice(0, 30).join('\n');
      });
      
      console.log(`\n=== ${s.label} ===`);
      console.log(text.substring(0, 1500));
    } catch(e) {
      console.log(`Error: ${e.message}`);
    }
  }

  console.log('\n=== DONE ===');
})();
