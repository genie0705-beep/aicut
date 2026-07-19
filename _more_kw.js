const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let bk = pages.find(p => p.url().includes('blokey.co.kr'));
  if (!bk) { bk = await ctx.newPage(); }
  await bk.bringToFront();
  
  const keywords = ['프랜차이즈영상마케팅', '유튜버편집의뢰', '병원마케팅', '크리에이터영상편집', '스타트업IR영상'];
  const results = {};
  
  for (const kw of keywords) {
    await bk.goto('https://blokey.co.kr/keyword', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const input = await bk.$('input[placeholder*="키워드를 입력"]');
    if (input) {
      await input.click(); await new Promise(r=>setTimeout(r,200));
      await input.fill(''); await new Promise(r=>setTimeout(r,200));
      await input.fill(kw);
    }
    
    try {
      const sb = bk.locator('button:has-text("검색")');
      if (await sb.count() > 0) await sb.first().click({ timeout: 3000 });
    } catch(e) {}
    await new Promise(r => setTimeout(r, 5000));
    
    const data = await bk.evaluate((k) => {
      const text = document.body.innerText;
      const lines = text.split('\n');
      // Find keyword data row
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(k) && lines[i].includes('\t')) {
          return { row: lines[i], context: lines.slice(Math.max(0,i-1), i+5).join(' | ') };
        }
      }
      // Also check for 상세 분석 section
      const idx = text.indexOf(k);
      if (idx >= 0) {
        return { section: text.substring(idx, idx + 300) };
      }
      return { notFound: true };
    }, kw);
    
    results[kw] = data;
    console.log(kw + ':', JSON.stringify(data).substring(0, 200));
  }
  
  console.log('\n=== ALL RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  browser.disconnect();
})().catch(e => console.log('ERR:', e.message.substring(0,200)));
