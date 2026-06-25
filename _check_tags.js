const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  const tagInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.value && inp.value.includes('#')) {
        return {
          found: true,
          tags: inp.value,
          count: inp.value.split('#').length - 1,
          preview: inp.value.substring(0, 200)
        };
      }
    }
    
    // Also check tag display area
    const tagAreas = document.querySelectorAll('[class*="tag"], [class*="Tag"]');
    const tagTexts = [];
    tagAreas.forEach(el => {
      const t = (el.innerText || '').trim();
      if (t.includes('#')) tagTexts.push(t.substring(0, 100));
    });
    
    return { found: false, tagAreaTexts: tagTexts };
  });
  
  console.log('=== 해시태그 상태 ===');
  console.log(JSON.stringify(tagInfo, null, 2));
  
  await page.screenshot({ path: 'hashtag_check.png' });
  await b.close();
})();
