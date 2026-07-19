const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const keywords = ['숏폼마케팅', '영상마케팅', '하반기마케팅', '릴스마케팅', '부동산마케팅', '보험마케팅'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages[7];
  await page.bringToFront();
  await sleep(2000);
  
  for (const kw of keywords) {
    console.log(`\n=== ${kw} ===`);
    
    await page.evaluate((keyword) => {
      const inp = document.querySelector('input[placeholder*="키워드"]');
      if (!inp) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, keyword);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }, kw);
    
    await sleep(6000);
    
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n').filter(l => l.trim());
    
    // 키워드 테이블 행 찾기
    let found = false;
    for (const l of lines) {
      if (l.includes('총검색') || l.includes('PC\t')) {
        if (!found) { console.log(l); found = true; }
        continue;
      }
      // 키워드가 들어간 데이터 행
      if (l.startsWith(kw) || l.includes(kw + '\t')) {
        console.log(l.substring(0, 100));
      }
    }
    
    // 직접 찾기
    for (let i = 49; i < Math.min(lines.length, 75); i++) {
      const l = lines[i];
      if (l.includes(kw) || (l.match(/^\d+$/) && i > 50)) {
        console.log(i + ': ' + l.substring(0, 100));
      }
    }
  }
  
  await b.close();
})();
