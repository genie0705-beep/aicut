const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages[7];
  await page.bringToFront();
  await sleep(2000);
  
  // 시즌 키워드 검색
  const seasonKw = ['여름마케팅', '7월마케팅', '무더위'];
  
  for (const kw of seasonKw) {
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
    
    for (let i = 49; i < Math.min(lines.length, 80); i++) {
      const l = lines[i];
      if (l.includes(kw) || (l.match(/^\d+$/) && i > 49)) {
        console.log(i + ': ' + l.substring(0, 100));
      }
    }
    // 연관 키워드 상위
    console.log('--- 연관키워드 상위 ---');
    let count = 0;
    for (const l of lines) {
      if (l.includes('+') && l.includes('개 더보기')) break;
      if (count < 10 && l.length > 0 && l.length < 30 && !l.includes('키워드') && !l.includes('PC') && !l.includes('월간') && !l.includes('문서수') && !l.match(/^\d+$/) && !l.includes('높음') && !l.includes('낮음') && !l.includes('검색') && !l.includes('분석') && !l.includes('추가') && !l.includes('초기화') && !l.includes('복사') && !l.includes('다운')) {
        console.log('  ' + l);
        count++;
      }
    }
  }
  
  await b.close();
})();
