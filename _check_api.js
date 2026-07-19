const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Open a new clean tab
  const page = await b.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Listen for XHR/fetch requests
  const apiCalls = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('api') || url.includes('stat') || url.includes('rank') || url.includes('pv') || url.includes('blog')) {
      apiCalls.push({ url: url.substring(0, 120), method: request.method() });
    }
  });
  
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);
  
  // Force click the rank link with JS
  await page.evaluate(() => {
    const el = document.querySelector('#all_stat_rank_pv');
    if (el) {
      // Try using the href directly with pushState
      const a = document.createElement('a');
      a.href = el.href;
      a.click();
    }
  });
  
  await page.waitForTimeout(3000);
  
  console.log('API calls detected:');
  apiCalls.forEach(c => console.log(`  ${c.method} ${c.url}`));
  
  console.log('\nPage URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Text:', text);
  
  // Try to get data from localStorage or window.__INITIAL_STATE__
  const state = await page.evaluate(() => {
    const data = {};
    try {
      data.localStorage = Object.keys(localStorage).slice(0, 10);
    } catch(e) {}
    try {
      data.initialState = window.__INITIAL_STATE__ ? JSON.stringify(window.__INITIAL_STATE__).substring(0, 500) : 'none';
    } catch(e) {}
    try {
      data.initialData = window.__INITIAL_DATA__ ? JSON.stringify(window.__INITIAL_DATA__).substring(0, 500) : 'none';
    } catch(e) {}
    return data;
  });
  console.log('\nState:', JSON.stringify(state, null, 2));
  
  await page.close();
  b.disconnect();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
