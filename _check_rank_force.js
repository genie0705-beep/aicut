const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Check the full page HTML to find the navigation structure
  const fullHTML = await page.evaluate(() => document.documentElement.outerHTML);
  console.log('Full HTML length:', fullHTML.length);
  
  // Try to find API endpoints in scripts
  const scripts = await page.evaluate(() => {
    const allScripts = Array.from(document.scripts);
    return allScripts.map(s => ({
      src: s.src?.substring(0, 80) || 'inline',
      length: s.textContent?.length || 0,
      text: s.textContent?.substring(0, 200) || ''
    })).filter(s => s.length > 100);
  });
  
  console.log('\nScripts:');
  scripts.forEach((s, i) => {
    console.log(`Script ${i}: src=${s.src} length=${s.length}`);
    if (s.text.includes('rank') || s.text.includes('pv') || s.text.includes('api') || s.text.includes('stat')) {
      console.log(`  MATCH: ${s.text.substring(0, 400)}`);
    }
  });
  
  // Try clicking with force to bypass visibility check
  const rankItem = page.locator('#all_stat_rank_pv');
  const count = await rankItem.count();
  console.log('\nRank PV items:', count);
  
  if (count > 0) {
    await rankItem.first().click({ force: true });
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    console.log('After forceful click:', text.substring(0, 2000));
  }
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
