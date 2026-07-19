const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages[7];
  await page.bringToFront();
  await sleep(2000);
  
  // 검색어 입력
  const setResult = await page.evaluate(() => {
    const inp = document.querySelector('input[placeholder*="키워드"]');
    if (!inp) return 'input not found';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '영상편집외주');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return 'set: 영상편집외주 + Enter';
  });
  console.log(setResult);
  await sleep(6000);
  
  // 결과
  let text = await page.evaluate(() => document.body.innerText);
  let lines = text.split('\n').filter(l => l.trim());
  
  console.log('\n=== 검색 결과 ===');
  lines.slice(25, 120).forEach((l, i) => {
    const t = l.trim();
    if (t.length > 0) console.log((i+25) + ': ' + t.substring(0, 120));
  });
  
  await b.close();
})();
