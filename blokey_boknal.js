const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  let blokey = pages.find(p => p.url().includes('blokey'));
  if (!blokey) {
    blokey = await b.contexts()[0].newPage();
    await blokey.goto('https://blokey.co.kr/keyword', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);
  } else {
    await blokey.bringToFront();
    await sleep(2000);
  }
  
  const kws = ['복날', '초복', '중복', '복날음식', '보양식'];
  const results = [];
  
  for (const kw of kws) {
    console.log('검색:', kw);
    
    await blokey.evaluate((k) => {
      const inp = document.querySelector('input[placeholder*="키워드"]');
      if (!inp) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, k);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }, kw);
    await sleep(5000);
    
    const text = await blokey.evaluate(() => document.body.innerText);
    const lines = text.split('\n').filter(l => l.trim());
    
    console.log('  결과 라인:');
    for (let i = 49; i < Math.min(lines.length, 75); i++) {
      console.log('    ' + i + ': ' + lines[i].substring(0, 80));
    }
    console.log('');
  }
  
  await b.close();
})();
