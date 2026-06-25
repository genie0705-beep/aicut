const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  // Check existing pages
  const pages = ctx.pages();
  console.log('=== 기존 탭 목록 ===');
  for (let i = 0; i < pages.length; i++) {
    const u = pages[i].url().substring(0, 100);
    const t = await pages[i].title().catch(()=>'?');
    console.log(i + ': [' + t.substring(0, 40) + '] ' + u);
  }
  
  // Use the main page (index 0 typically) or find a Naver page
  let p = pages[0];
  if (!p.url().includes('naver')) {
    for (const pg of pages) {
      if (pg.url().includes('naver')) { p = pg; break; }
    }
  }
  
  await p.bringToFront();
  await p.goto('https://kin.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  // Now let's check if the page has a search input
  const hasSearch = await p.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
    const results = [];
    inputs.forEach((inp, i) => {
      results.push(i + ': name=' + (inp.name || '') + ' id=' + (inp.id || '') + ' placeholder=' + (inp.placeholder || '') + ' class=' + (inp.className.substring(0, 40) || ''));
    });
    return results;
  });
  console.log('\n=== input 요소들 ===');
  console.log(JSON.stringify(hasSearch, null, 2));
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 200)));
