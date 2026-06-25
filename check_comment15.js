const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  // Track network requests
  const requests = [];
  page.on('request', req => {
    const url = req.url();
    // Track all requests for analysis
    if (requests.length < 200) {
      requests.push({ url: url.substring(0, 200), method: req.method() });
    }
  });
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  const beforeCount = requests.length;
  console.log(`Requests before click: ${beforeCount}`);
  
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView'); await page.close(); await browser.close(); return; }
  
  // Set a timeout for the click
  const clickPromise = postFrame.evaluate(() => {
    const btn = document.querySelector('#btn_comment_2');
    if (btn) btn.click();
    return 'clicked via evaluate';
  });
  
  const result = await clickPromise;
  console.log('Click result:', result);
  
  await page.waitForTimeout(5000);
  
  // Find new requests after click
  const newRequests = requests.slice(beforeCount);
  console.log(`\nNew requests after click (${newRequests.length}):`);
  newRequests.slice(0, 20).forEach(r => console.log(`  ${r.method} ${r.url.substring(0, 150)}`));
  
  // Check for comment-related HTML changes
  if (postFrame) {
    const state = await postFrame.evaluate(() => {
      const wrap = document.querySelector('.wrap_postcomment');
      const newHTML = wrap ? wrap.innerHTML.length : 0;
      const textareas = document.querySelectorAll('textarea').length;
      const contenteditables = document.querySelectorAll('[contenteditable]').length;
      
      // Check for any element added
      const postArea = document.querySelector('#post-area');
      const postHTML = postArea ? postArea.innerHTML.length : 0;
      
      return { wrapLength: newHTML, textareas, contenteditables, postAreaLength: postHTML };
    });
    
    console.log('\nState after click:', JSON.stringify(state));
    
    // Check for SE editor related content
    const seElements = await postFrame.evaluate(() => {
      const results = [];
      document.querySelectorAll('[id*="se"], [class*="se"], [class*="SE"], [class*="smart"], [id*="comment_iframe"]').forEach(el => {
        results.push({
          tag: el.tagName,
          id: el.id,
          cls: el.className.substring(0, 60),
          visible: el.offsetParent !== null
        });
      });
      return results;
    });
    
    console.log('\nSE elements after click:', JSON.stringify(seElements));
    
    // Check for newly added iframes in the document
    const iframes = await postFrame.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => ({
        src: f.src.substring(0, 150),
        id: f.id,
        visible: f.offsetParent !== null
      }));
    });
    console.log('\nIframes in PostView:', JSON.stringify(iframes, null, 2));
  }
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));
