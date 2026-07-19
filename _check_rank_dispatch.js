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
  
  // Find parent elements of "조회수 순위" to understand the menu structure
  const structure = await page.evaluate(() => {
    const el = document.querySelector('#all_stat_rank_pv');
    if (!el) return 'NOT FOUND';
    let result = 'TAG=' + el.tagName + ' ID=' + el.id + ' CLASS=' + el.className + '\n';
    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      result += '  PARENT[' + depth + ']: TAG=' + parent.tagName + ' ID=' + (parent.id || '') + ' CLASS=' + parent.className.substring(0, 50) + '\n';
      // Check display
      const style = window.getComputedStyle(parent);
      result += '    display=' + style.display + ' visibility=' + style.visibility + ' overflow=' + style.overflow + ' height=' + style.height + '\n';
      parent = parent.parentElement;
      depth++;
    }
    return result;
  });
  console.log('Structure:', structure);
  
  // Use JavaScript to trigger the click event directly
  const result = await page.evaluate(() => {
    const el = document.querySelector('#all_stat_rank_pv');
    if (!el) return 'NOT FOUND';
    
    // Try dispatchEvent
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    el.dispatchEvent(event);
    return 'DISPATCHED';
  });
  console.log('Click result:', result);
  
  await page.waitForTimeout(3000);
  
  const text = await page.evaluate(() => {
    // Get all text including possibly updated content
    return document.body.innerText;
  });
  console.log('Page text:');
  console.log(text);
  
  // Check for any new content areas
  const newContent = await page.evaluate(() => {
    const content = document.querySelector('#content, .content, [class*=content], main, article');
    if (content) return content.innerText.substring(0, 2000);
    return 'no content area found';
  });
  console.log('\nContent area:', newContent);
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
